const AiService = {
	async generate(prompt, model, options = {})
	{
		const apiKey = StorageService.load(CONFIG.API.KEYS[model]);
		if (!apiKey)
		{
			alert(`Please enter your ${model} API key.`);
			return;
		}
		if (options.task === 'transcribe')
		{
			return await this.transcribe(options.file, options.language, apiKey);
		}
		if (model)
		{
			return await this.complete(apiKey, prompt, model, options, 0);
		}
	},
	prepMediaParts(mediaURLs, defaultType)
	{
		return (mediaURLs || [])
			.map(dataURL =>
			{
				const base64Data = dataURL.split(',')[1];
				const mimeType = dataURL.match(/^data:(.*?);base64,/)
					?.[1] || defaultType;
				return {
					inlineData:
					{
						data: base64Data,
						mimeType
					}
				};
			});
	},
	async complete(apiKey, prompt, model, options, attempt)
	{
		const maxRetries = StorageService.load('exponential_retry', 4);
		const modelName = StorageService.load(`${model}_model`, CONFIG.API.MODELS.COMPLETION[model].default);
		let modelConfig = CONFIG.API.MODELS.COMPLETION[model]?.options.find(m => m.name === modelName);
		if (!modelConfig && StorageService.load('high_cost_enabled', false) && CONFIG.API.MODELS.COMPLETION_HIGH_COST[model])
		{
			modelConfig = CONFIG.API.MODELS.COMPLETION_HIGH_COST[model].options.find(m => m.name === modelName);
		}
		if (!modelConfig)
		{
			alert(`Model ${modelName} not found in config.`);
			return;
		}
		const endpoint = (model === 'openai' && modelConfig.responses_api_only) ? 'openai_responses' : model;
		const config = CONFIG.API.CONFIG.COMPLETION[endpoint];
		if (!config)
		{
			alert(`Config not found for endpoint: ${endpoint}`);
			return;
		}
		const reqBody = this.buildReqBody(prompt, model, modelConfig, options);
		const headers = this.buildHeaders(apiKey, config);
		const response = await fetch(config.url,
		{
			method: 'POST',
			headers,
			body: JSON.stringify(reqBody),
			signal: options.abortSignal,
		});
		if (!response.ok)
		{
			const errText = await response.text();
			if (attempt < maxRetries)
			{
				const delay = this.calcRetryDelay(attempt);
				await this.wait(delay);
				return this.complete(apiKey, prompt, model, options, attempt + 1);
			}
			alert(`API request failed: ${response.status} - ${errText}`);
			return;
		}
		if (options.streaming)
		{
			return await this.handleStreamResponse(response, endpoint, options.onProgress);
		}
		else
		{
			const jsonResponse = await response.json();
			const content = config.extractContent(jsonResponse);
			return {
				choices: [
				{
					message:
					{
						content: content || ""
					}
				}]
			};
		}
	},
	buildReqBody(prompt, model, modelConfig, options)
	{
		let msgs = [];
		if (options.messages && Array.isArray(options.messages))
		{
			msgs = options.messages.map(msg =>
			{
				let content = [];
				if (msg.content)
				{
					if (typeof msg.content === 'string')
					{
						content.push(
						{
							type: 'text',
							text: msg.content
						});
					}
					else if (Array.isArray(msg.content))
					{
						content = content.concat(msg.content);
					}
				}
				return {
					role: msg.role,
					content: content.length === 1 ? content[0].text : content
				};
			});
		}
		else
		{
			msgs = [
			{
				role: "user",
				content: prompt
			}];
		}
		if (options.audios?.length > 0 || options.images?.length > 0 || options.videos?.length > 0)
		{
			let userMsgIdx = msgs.findIndex(m => m.role === 'user');
			for (let i = msgs.length - 1; i >= 0; --i)
			{
				if (msgs[i].role == "user")
				{
					userMsgIdx = i;
					break;
				}
			}
			if (userMsgIdx === -1)
			{
				userMsgIdx = msgs.length;
				msgs.push(
				{
					role: "user",
					content: []
				});
			}
			let userContent = [];
			if (typeof msgs[userMsgIdx].content === 'string')
			{
				userContent.push(
				{
					type: "text",
					text: msgs[userMsgIdx].content
				});
			}
			else
			{
				userContent = msgs[userMsgIdx].content;
			}
			userContent = userContent.concat(this.buildMediaContent(options.audios, options.images, options.videos, model));
			if (userContent.length === 1 && typeof userContent[0] === "object" && userContent[0].text != null)
			{
				msgs[userMsgIdx].content = userContent[0].text;
			}
			else
			{
				msgs[userMsgIdx].content = userContent;
			}
		}
		msgs = msgs.filter(msg =>
		{
			if (typeof msg.content === 'string')
			{
				return msg.content.trim() !== '';
			}
			if (Array.isArray(msg.content))
			{
				if (msg.content.length > 0 && typeof msg.content[0] === "object" && msg.content[0].text != null)
				{
					return msg.content[0].text.trim() != '';
				}
			}
			return true;
		});
		let reqBody = {
			model: modelConfig.name,
			stream: options.streaming,
		};
		if (model === 'openai' && modelConfig.responses_api_only)
		{
			reqBody.input = msgs;
			if (modelConfig.tools && Array.isArray(modelConfig.tools))
			{
				reqBody.tools = modelConfig.tools.map(tool => (
				{
					type: tool
				}));
			}
			if (modelConfig.reasoning_effort)
			{
				reqBody.reasoning = {
					effort: StorageService.load('reasoning_effort', 'low')
				};
			}
		}
		else
		{
			reqBody.messages = msgs;
			if (modelConfig.reasoning_effort)
			{
				reqBody.reasoning_effort = StorageService.load('reasoning_effort', 'low');
			}
		}
		if (!modelConfig.reasoning_effort && !modelConfig.responses_api_only && !modelConfig.search_context_size && !modelConfig.thinking)
		{
			reqBody.temperature = 0;
		}
		if (modelConfig.search_context_size)
		{
			reqBody.web_search_options = {
				search_context_size: StorageService.load('search_context_size', 'low')
			};
		}
		if (modelConfig.thinking)
		{
			const thinkingBudget = parseInt(StorageService.load('thinking', 0), 10);
			if (thinkingBudget >= 1024)
			{
				reqBody.thinking = {
					type: "enabled",
					budget_tokens: thinkingBudget
				};
			}
			else
			{
				reqBody.temperature = 0;
			}
		}
		if (!['chutes', 'openrouter', 'perplexity', 'sambanova', 'together'].includes(model) && !modelConfig.reasoning_effort && !modelConfig.responses_api_only && !modelConfig.search_context_size && modelConfig.name !== 'grok-2-1212')
		{
			reqBody.max_tokens = modelConfig.max_tokens;
		}
		return reqBody;
	},
	buildMediaContent(audios = [], images = [], videos = [], model)
	{
		let mediaContent = [];
		if (audios.length > 0)
		{
			if (model === 'sambanova')
			{
				const audioContent = audios.map(dataURL => (
				{
					type: 'audio_content',
					audio_content:
					{
						content: dataURL
					},
				}));
				mediaContent = mediaContent.concat(audioContent);
			}
			else
			{
				const audioContent = audios.map(dataURL =>
				{
					const base64Data = dataURL.split(',')[1];
					let mimeType = dataURL.match(/^data:(.*?);base64,/)
						?.[1] || 'audio/mp3';
					if (mimeType.startsWith('audio/mpeg'))
					{
						mimeType = 'audio/mp3';
					}
					return {
						type: 'input_audio',
						input_audio:
						{
							data: base64Data,
							format: mimeType.split('/')[1]
						},
					};
				});
				mediaContent = mediaContent.concat(audioContent);
			}
		}
		if (images.length > 0 && model === 'anthropic')
		{
			const imageContent = images.map(dataURL =>
			{
				const base64Data = dataURL.split(',')[1];
				const mimeType = dataURL.match(/^data:(.*?);base64,/)
					?.[1] || 'image/png';
				return {
					type: 'image',
					source:
					{
						type: 'base64',
						media_type: mimeType,
						data: base64Data
					},
				};
			});
			mediaContent = mediaContent.concat(imageContent);
		}
		else if (images.length > 0)
		{
			const imageContent = images.map(dataURL => (
			{
				type: 'image_url',
				image_url:
				{
					url: dataURL
				},
			}));
			mediaContent = mediaContent.concat(imageContent);
		}
		mediaContent = mediaContent.concat(this.createMediaContent(videos, "image_url", "image_url"));
		return mediaContent;
	},
	buildHeaders(apiKey, config)
	{
		return {
			'Content-Type': 'application/json',
			[config.apiKeyHeader]: config.apiKeyPrefix + apiKey,
			...config.additionalHeaders,
		};
	},
	createMediaContent(mediaItems, typeKey, urlKey)
	{
		return mediaItems.map(dataURL => (
		{
			type: typeKey,
			[urlKey]:
			{
				url: dataURL
			},
		}));
	},
	async handleStreamResponse(response, model, onProgress)
	{
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let accumulatedText = '';
		let latestCitations = null;
		while (true)
		{
			const
			{
				done,
				value
			} = await reader.read();
			if (done) break;
			buffer += decoder.decode(value);
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';
			for (const line of lines)
			{
				if (line.startsWith('data: '))
				{
					const data = line.slice(6);
					if (data === '[DONE]') continue;
					try
					{
						const parsed = JSON.parse(data);
						if (model === 'perplexity' && parsed.citations)
						{
							latestCitations = parsed.citations;
						}
						const content = CONFIG.API.CONFIG.COMPLETION[model].extractStreamContent(parsed);
						if (content)
						{
							accumulatedText += content;
							onProgress?.(accumulatedText);
						}
					}
					catch (e)
					{
						console.error('Error parsing JSON:', e);
					}
				}
			}
		}
		if (model === 'perplexity' && latestCitations && latestCitations.length > 0)
		{
			const citationsText = "\n\nReferences:\n" + latestCitations.map((citation, i) => `[${i + 1}] ${citation}`)
				.join('\n');
			accumulatedText += citationsText;
			onProgress?.(accumulatedText);
		}
		return {
			choices: [
			{
				message:
				{
					content: accumulatedText
				}
			}]
		};
	},
	async transcribe(file, language, apiKey, modelName, transModel, abortSignal)
	{
		const formData = new FormData();
		formData.append('file', file);
		formData.append('model', modelName);
		formData.append('language', language);
		const config = CONFIG.API.CONFIG.TRANSCRIPTION[transModel];
		if (!config)
		{
			alert(`Config not found for transcription model: ${transModel}`);
			return;
		}
		const response = await fetch(config.url,
		{
			method: 'POST',
			headers:
			{
				[config.apiKeyHeader]: config.apiKeyPrefix + apiKey,
			},
			body: formData,
			signal: abortSignal
		});
		if (!response.ok)
		{
			const errText = await response.text();
			alert(`Transcription failed with status ${response.status}: ${errText}`);
			return;
		}
		return await response.json();
	},
	calcRetryDelay(attempt)
	{
		return Math.pow(2, attempt) * 1000;
	},
	wait(ms)
	{
		return new Promise(resolve => setTimeout(resolve, ms));
	},
};
window.AiService = AiService;