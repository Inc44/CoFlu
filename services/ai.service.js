const AiService = {
	ffmpegLoaded: false,
	ffmpeg: null,
	ffmpegDuration: 0,
	async toBlobURL(url, mimeType, patcher)
	{
		const resp = await fetch(url);
		const body = patcher ? patcher(await resp.text()) : await resp.blob();
		const blob = new Blob([body],
		{
			type: mimeType
		});
		return URL.createObjectURL(blob);
	},
	async loadFFmpeg()
	{
		if (this.ffmpegLoaded) return;
		const baseURLFFMPEG = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg/dist/umd';
		const ffmpegBlobURL = await this.toBlobURL(baseURLFFMPEG + '/ffmpeg.js', 'text/javascript', (js) =>
		{
			return js.replace('new URL(e.p+e.u(814),e.b)', 'r.worker814URL');
		});
		const baseURLCore = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core/dist/umd';
		const config = {
			worker814URL: await this.toBlobURL(baseURLFFMPEG + '/814.ffmpeg.js', 'text/javascript'),
			coreURL: await this.toBlobURL(baseURLCore + '/ffmpeg-core.js', 'text/javascript'),
			wasmURL: await this.toBlobURL(baseURLCore + '/ffmpeg-core.wasm', 'application/wasm'),
		};
		await import(ffmpegBlobURL);
		this.ffmpeg = new FFmpegWASM.FFmpeg();
		this.ffmpeg.on('log', (
		{
			message
		}) =>
		{
			const regex = /Duration: (\d+):(\d+):(\d+)\.(\d+)/
			const match = message.match(regex);
			if (match) this.ffmpegDuration = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 100;
		});
		await this.ffmpeg.load(config);
		this.ffmpegLoaded = true;
	},
	async getFFmpegDuration(filename)
	{
		this.ffmpegDuration = 0;
		await this.ffmpeg.exec(['-i', filename]);
		return this.ffmpegDuration;
	},
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
		const resp = await fetch(config.url,
		{
			method: 'POST',
			headers,
			body: JSON.stringify(reqBody),
			signal: options.abortSignal
		});
		if (!resp.ok)
		{
			const errText = await resp.text();
			if (attempt < maxRetries)
			{
				const delay = this.calcRetryDelay(attempt);
				await this.wait(delay);
				return this.complete(apiKey, prompt, model, options, attempt + 1);
			}
			alert(`API request failed: ${resp.status} - ${errText}`);
			return;
		}
		if (options.streaming)
		{
			return await this.handleStreamResponse(resp, endpoint, options.onProgress);
		}
		else
		{
			const jsonResponse = await resp.json();
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
					content: content.length === 1 && content[0]?.text != null ? content[0].text : content
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
		if (options.audios?.length > 0 || options.files || options.images?.length > 0 || options.videos?.length > 0)
		{
			let userMsgIdx = msgs.findIndex(m => m.role === 'user');
			for (let i = msgs.length - 1; i >= 0; --i)
			{
				if (msgs[i].role === "user")
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
			userContent = userContent.concat(this.buildMediaContent(options.audios, options.images, options.videos, options.files, model, modelConfig));
			if (userContent.length === 1 && typeof userContent[0] === "object" && userContent[0].text !== null)
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
				if (msg.content.length > 0 && typeof msg.content[0] === "object" && msg.content[0].text !== null)
				{
					return msg.content[0].text.trim() !== '';
				}
			}
			return true;
		});
		let reqBody = {
			model: modelConfig.name,
			stream: options.streaming
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
				let reasoningEffort = StorageService.load('reasoning_effort', modelConfig.reasoning_effort[0]);
				if (!modelConfig.reasoning_effort.includes(reasoningEffort))
				{
					reasoningEffort = modelConfig.reasoning_effort[0];
					StorageService.save('reasoning_effort', reasoningEffort);
				}
				reqBody.reasoning = {
					effort: reasoningEffort
				};
			}
		}
		else
		{
			reqBody.messages = msgs;
			if (modelConfig.reasoning_effort)
			{
				let reasoningEffort = StorageService.load('reasoning_effort', modelConfig.reasoning_effort[0]);
				if (!modelConfig.reasoning_effort.includes(reasoningEffort))
				{
					reasoningEffort = modelConfig.reasoning_effort[0];
					StorageService.save('reasoning_effort', reasoningEffort);
				}
				reqBody.reasoning_effort = reasoningEffort;
			}
		}
		if (!modelConfig.reasoning_effort && !modelConfig.responses_api_only && !modelConfig.search_context_size && !(modelConfig.thinking_budget && modelConfig.name.startsWith('claude-')))
		{
			reqBody.temperature = 0;
		}
		if (modelConfig.search_context_size)
		{
			let searchContextSize = StorageService.load('search_context_size', modelConfig.search_context_size[0]);
			if (!modelConfig.search_context_size.includes(searchContextSize))
			{
				searchContextSize = modelConfig.search_context_size[0];
				StorageService.save('search_context_size', searchContextSize);
			}
			reqBody.web_search_options = {
				search_context_size: searchContextSize
			};
		}
		if (modelConfig.thinking_budget)
		{
			const minThinkingBudget = modelConfig.thinking_budget ? modelConfig.thinking_budget[0] : 0;
			const thinkingBudget = parseInt(StorageService.load('thinking', minThinkingBudget), 10);
			if (thinkingBudget >= minThinkingBudget)
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
	buildMediaContent(audios = [], images = [], videos = [], files = [], model, modelConfig)
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
					}
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
						}
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
					}
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
				}
			}));
			mediaContent = mediaContent.concat(imageContent);
		}
		mediaContent = mediaContent.concat(this.createMediaContent(videos, "image_url", "image_url"));
		let fileEntries = [];
		if (Array.isArray(files))
		{
			fileEntries = files.map(dataURL => (
			{
				filename: 'file.pdf',
				dataURL
			}));
		}
		else if (files && typeof files === 'object')
		{
			Object.entries(files)
				.forEach(([filename, dataURL]) =>
				{
					fileEntries.push(
					{
						filename,
						dataURL
					});
				});
		}
		if (fileEntries.length > 0 && model === 'anthropic')
		{
			const fileContent = fileEntries.map(item =>
			{
				const base64Data = item.dataURL.split(',')[1];
				const mimeType = item.dataURL.match(/^data:(.*?);base64,/)
					?.[1] || 'application/pdf';
				return {
					type: 'document',
					source:
					{
						type: 'base64',
						media_type: mimeType,
						data: base64Data
					}
				};
			});
			mediaContent = mediaContent.concat(fileContent);
		}
		else if (fileEntries.length > 0 && model === 'openai' && modelConfig && modelConfig.responses_api_only)
		{
			const fileContent = fileEntries.map(item => (
			{
				type: 'input_file',
				filename: item.filename,
				file_data: item.dataURL
			}));
			mediaContent = mediaContent.concat(fileContent);
		}
		else if (fileEntries.length > 0)
		{
			const fileContent = fileEntries.map(item => (
			{
				type: 'file',
				file:
				{
					filename: item.filename,
					file_data: item.dataURL
				}
			}));
			mediaContent = mediaContent.concat(fileContent);
		}
		return mediaContent;
	},
	buildHeaders(apiKey, config)
	{
		return {
			'Content-Type': 'application/json',
			[config.apiKeyHeader]: config.apiKeyPrefix + apiKey,
			...config.additionalHeaders
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
			}
		}));
	},
	async handleStreamResponse(resp, model, onProgress)
	{
		const reader = resp.body.getReader();
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
	async splitAudio(file, maxSizeMB)
	{
		await this.loadFFmpeg();
		const filename = file.name;
		const filenameParts = filename.split('.');
		const extension = filenameParts.length > 1 ? filenameParts.pop() : 'mp4';
		const basename = filenameParts.join('.');
		const mimeType = file.type || 'application/octet-stream';
		await this.ffmpeg.writeFile(filename, new Uint8Array(await file.arrayBuffer()));
		const totalDuration = await this.getFFmpegDuration(filename);
		const chunks = [];
		let currentDuration = 0;
		let i = 1;
		while (currentDuration < totalDuration)
		{
			const chunkFilename = basename + '_' + i + '.' + extension;
			await this.ffmpeg.exec(['-ss', String(currentDuration), '-i', filename, '-fs', maxSizeMB + 'M', '-c', 'copy', chunkFilename]);
			const chunkDuration = await this.getFFmpegDuration(chunkFilename);
			if (chunkDuration <= 0) break;
			const data = await this.ffmpeg.readFile(chunkFilename);
			const blob = new Blob([data.buffer],
			{
				type: mimeType
			});
			const chunkFile = new File([blob], chunkFilename,
			{
				type: mimeType
			});
			chunks.push(chunkFile);
			currentDuration += chunkDuration;
			i++;
		}
		return chunks;
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
		const resp = await fetch(config.url,
		{
			method: 'POST',
			headers:
			{
				[config.apiKeyHeader]: config.apiKeyPrefix + apiKey
			},
			body: formData,
			signal: abortSignal
		});
		if (!resp.ok)
		{
			const errText = await resp.text();
			alert(`Transcription failed with status ${resp.status}: ${errText}`);
			return;
		}
		return await resp.json();
	},
	calcRetryDelay(attempt)
	{
		return Math.pow(2, attempt) * 1000;
	},
	wait(ms)
	{
		return new Promise(resolve => setTimeout(resolve, ms));
	}
};
window.AiService = AiService;