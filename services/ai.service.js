// services/ai.service.js
const AiService = {
	async generate(prompt, model, options = {})
	{
		const apiKey = StorageService.load(CONFIG.API.KEYS[model]);
		if (!apiKey)
		{
			throw new Error(`Please enter your ${model} API key.`);
		}
		try
		{
			if (options.task === 'transcribe')
			{
				return await this.transcribe(options.file, options.language, apiKey);
			}
			switch (model)
			{
				case 'gemini':
					return await this.generateWithGemini(apiKey, prompt, options, 0);
				default:
					return await this.generateWithOtherModels(apiKey, prompt, model, options, 0);
			}
		}
		catch (error)
		{
			console.error('Generation error:', error);
			throw error;
		}
	},
	async generateWithGemini(apiKey, prompt, options, attempt)
	{
		const maxRetries = StorageService.load('exponential_retry', 4);
		try
		{
			const
			{
				GoogleGenerativeAI
			} = await import("@google/generative-ai");
			const genAI = new GoogleGenerativeAI(apiKey);
			const selectedModelName = StorageService.load('gemini_model', CONFIG.API.MODELS.gemini.default);
			const model = genAI.getGenerativeModel(
			{
				model: selectedModelName
			});
			const imageParts = this.prepareMediaParts(options.images, 'image/png');
			const videoParts = this.prepareMediaParts(options.videos, 'video/mp4');
			const contents = this.buildGeminiContents(prompt, options, imageParts, videoParts);
			const textPrompt = {
				contents,
				generationConfig:
				{
					temperature: 0
				},
			};
			if (options.streaming)
			{
				return await this.handleGeminiStreaming(model, textPrompt, options);
			}
			else
			{
				return await model.generateContent(textPrompt);
			}
		}
		catch (error)
		{
			if (error.name === 'AbortError') throw error;
			if (attempt < maxRetries)
			{
				const delay = this.calculateRetryDelay(attempt);
				console.warn(`Gemini API error (attempt ${attempt + 1}/${maxRetries}): ${error.message}. Retrying in ${delay / 1000}s...`);
				await this.wait(delay);
				return this.generateWithGemini(apiKey, prompt, options, attempt + 1);
			}
			throw new Error(`Gemini API error after ${maxRetries} attempts: ${error.message}`);
		}
	},
	prepareMediaParts(mediaURLs, defaultMimeType)
	{
		return (mediaURLs || [])
			.map(dataURL =>
			{
				const base64Data = dataURL.split(',')[1];
				const mimeType = dataURL.match(/^data:(.*?);base64,/)
					?.[1] || defaultMimeType;
				return {
					inlineData:
					{
						data: base64Data,
						mimeType
					}
				};
			});
	},
	buildGeminiContents(prompt, options, imageParts, videoParts)
	{
		if (options.messages && Array.isArray(options.messages))
		{
			return options.messages.map(msg =>
			{
				const role = msg.role;
				let parts = [];
				if (msg.content)
				{
					parts.push(
					{
						text: msg.content
					});
				}
				const hasMedia = imageParts.length > 0 || videoParts.length > 0;
				if (role === "user")
				{
					if (hasMedia)
					{
						parts = [...parts, ...imageParts, ...videoParts]
					}
					return {
						role,
						parts
					};
				}
				else
				{
					return {
						role,
						parts
					};
				}
			});
		}
		else
		{
			return [
			{
				role: "user",
				parts: [
				{
					text: prompt
				}, ...imageParts, ...videoParts]
			}];
		}
	},
	async handleGeminiStreaming(model, textPrompt, options)
	{
		const result = await model.generateContentStream(textPrompt);
		let accumulatedText = '';
		for await (const chunk of result.stream)
		{
			if (options.abortSignal?.aborted)
			{
				throw new DOMException('Aborted', 'AbortError');
			}
			const content = CONFIG.API.CONFIG.gemini.extractStreamContent(chunk);
			if (content)
			{
				accumulatedText += content;
				options.onProgress?.(accumulatedText);
			}
		}
		return {
			response:
			{
				text: () => accumulatedText
			}
		};
	},
	async generateWithOtherModels(apiKey, prompt, model, options, attempt)
	{
		const maxRetries = StorageService.load('exponential_retry', 4);
		const config = CONFIG.API.CONFIG[model];
		if (!config)
		{
			throw new Error(`Configuration not found for model: ${model}`);
		}
		const selectedModelName = StorageService.load(`${model}_model`, CONFIG.API.MODELS[model].default);
		const selectedModel = CONFIG.API.MODELS[model].options.find(m => m.name === selectedModelName);
		if (!selectedModel)
		{
			throw new Error(`Model ${selectedModelName} not found in configuration.`);
		}
		const requestBody = this.buildRequestBody(prompt, model, selectedModel, options);
		const headers = this.buildRequestHeaders(apiKey, config);
		try
		{
			const response = await fetch(config.url,
			{
				method: 'POST',
				headers,
				body: JSON.stringify(requestBody),
				signal: options.abortSignal,
			});
			if (!response.ok)
			{
				const errorText = await response.text();
				if (attempt < maxRetries)
				{
					const delay = this.calculateRetryDelay(attempt);
					console.warn(`${model} API error (attempt ${attempt + 1}/${maxRetries}): ${response.status} - ${errorText}. Retrying in ${delay / 1000}s...`);
					await this.wait(delay);
					return this.generateWithOtherModels(apiKey, prompt, model, options, attempt + 1);
				}
				throw new Error(`API request failed after ${maxRetries} attempts: ${response.status} - ${errorText}`);
			}
			if (options.streaming)
			{
				return await this.handleStreamingResponse(response, model, options.onProgress);
			}
			else
			{
				return await response.json();
			}
		}
		catch (error)
		{
			if (error.name === 'AbortError') throw error;
			if (attempt < maxRetries)
			{
				const delay = this.calculateRetryDelay(attempt);
				console.warn(`Fetch error (attempt ${attempt + 1}/${maxRetries}): ${error.message}. Retrying in ${delay / 1000}s...`);
				await this.wait(delay);
				return this.generateWithOtherModels(apiKey, prompt, model, options, attempt + 1);
			}
			throw new Error(`API request failed after ${maxRetries} attempts: ${error.message}`);
		}
	},
	buildRequestBody(prompt, model, selectedModel, options)
	{
		let messages = [];
		if (options.messages && Array.isArray(options.messages))
		{
			messages = options.messages.map(msg =>
			{
				if (msg.role === "user")
				{
					if (options.images?.length > 0 && model !== 'claude')
					{
						const imageContent = options.images.map(dataURL => (
						{
							type: 'image_url',
							image_url:
							{
								url: dataURL
							},
						}));
						return {
							role: msg.role,
							content: [...imageContent,
							{
								type: 'text',
								text: msg.content
							}]
						};
					}
					else if (options.images?.length > 0 && model === 'claude')
					{
						const imageContent = options.images.map(dataURL =>
						{
							const base64Data = dataURL.split(',')[1];
							const mimeType = dataURL.match(/^data:(.*?);base64,/)
								?.[1] || 'image/png';
							return {
								type: 'image',
								source:
								{
									type: "base64",
									media_type: mimeType,
									data: base64Data
								}
							};
						});
						let contentArray = [];
						if (msg.content)
						{
							contentArray.push(
							{
								type: "text",
								text: msg.content
							});
						}
						contentArray = [...contentArray, ...imageContent]
						return {
							role: msg.role,
							content: contentArray
						};
					}
				}
				return {
					role: msg.role,
					content: msg.content
				};
			});
		}
		else
		{
			messages = [
			{
				role: "user",
				content: prompt
			}];
			if (options.images && options.images.length > 0)
			{
				messages = this.formatMessagesWithImages(prompt, options.images, model);
			}
		}
		let requestBody = {
			model: selectedModel.name,
			messages,
			stream: options.streaming,
		};
		if (selectedModel.name !== 'o3-mini' && selectedModel.name !== 'o3-mini-2025-01-31')
		{
			requestBody.temperature = 0;
		}
		if (selectedModel.name === 'o3-mini' || selectedModel.name === 'o3-mini-2025-01-31')
		{
			requestBody.reasoning_effort = StorageService.load('reasoning_effort', 'low');
		}
		if (model !== 'sambanova' && selectedModel.name !== 'o3-mini' && selectedModel.name !== 'o3-mini-2025-01-31')
		{
			requestBody.max_tokens = selectedModel.max_completion_tokens;
		}
		return requestBody;
	},
	buildRequestHeaders(apiKey, config)
	{
		return {
			'Content-Type': 'application/json',
			[config.apiKeyHeader]: config.apiKeyPrefix + apiKey,
			...config.additionalHeaders,
		};
	},
	formatMessagesWithImages(prompt, images = [], model)
	{
		if (images.length === 0)
		{
			return [
			{
				role: "user",
				content: prompt
			}];
		}
		if (model === 'claude')
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
						type: "base64",
						media_type: mimeType,
						data: base64Data
					}
				};
			});
			return [
			{
				role: "user",
				content: [
				{
					type: "text",
					text: prompt
				}, ...imageContent]
			}];
		}
		const imageContent = images.map(dataURL => (
		{
			type: 'image_url',
			image_url:
			{
				url: dataURL
			},
		}));
		return [
		{
			role: "user",
			content: [...imageContent,
			{
				type: "text",
				text: prompt
			}]
		}];
	},
	async handleStreamingResponse(response, model, onProgress)
	{
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let accumulatedText = '';
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
						const content = CONFIG.API.CONFIG[model].extractStreamContent(parsed);
						if (content)
						{
							accumulatedText += content;
							onProgress?.(accumulatedText);
						}
					}
					catch (e)
					{
						console.error('Error parsing streaming JSON:', e, 'Data:', data);
					}
				}
			}
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
	async transcribe(file, language, apiKey)
	{
		const formData = new FormData();
		formData.append('file', file);
		formData.append('model', 'whisper-large-v3');
		formData.append('language', language);
		formData.append('response_format', 'verbose_json');
		const response = await fetch(CONFIG.API.CONFIG.groq.url.replace('chat/completions', 'audio/transcriptions'),
		{
			method: 'POST',
			headers:
			{
				[CONFIG.API.CONFIG.groq.apiKeyHeader]: CONFIG.API.CONFIG.groq.apiKeyPrefix + apiKey,
			},
			body: formData,
		});
		if (!response.ok)
		{
			throw new Error(`Transcription failed with status ${response.status}`);
		}
		return await response.json();
	},
	calculateRetryDelay(attempt)
	{
		return Math.pow(2, attempt) * 1000;
	},
	wait(ms)
	{
		return new Promise(resolve => setTimeout(resolve, ms));
	},
};
window.AiService = AiService;