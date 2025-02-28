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
				case 'google':
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
			const selectedModelName = StorageService.load('google_model', CONFIG.API.MODELS.COMPLETION.google.default);
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
				const result = await model.generateContent(textPrompt);
				return result;
			}
		}
		catch (error)
		{
			if (error.name === 'AbortError') throw error;
			if (attempt < maxRetries)
			{
				const delay = this.calculateRetryDelay(attempt);
				console.warn(`Google API error (attempt ${attempt + 1}/${maxRetries}): ${error.message}. Retrying in ${delay / 1000}s...`);
				await this.wait(delay);
				return this.generateWithGemini(apiKey, prompt, options, attempt + 1);
			}
			throw new Error(`Google API error after ${maxRetries} attempts: ${error.message}`);
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
		let contents = [];
		if (options.messages && Array.isArray(options.messages))
		{
			options.messages.forEach(msg =>
			{
				let parts = [];
				if (msg.content)
				{
					parts.push(
					{
						text: msg.content
					});
				}
				if (msg.role === "user")
				{
					parts.push(...imageParts, ...videoParts);
				}
				contents.push(
				{
					role: msg.role === "assistant" ? "model" : msg.role,
					parts: parts
				});
			});
		}
		else
		{
			contents.push(
			{
				role: "user",
				parts: [
				{
					text: prompt
				}, ...imageParts, ...videoParts]
			});
		}
		return contents;
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
			const content = CONFIG.API.CONFIG.COMPLETION.google.extractStreamContent(chunk);
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
		const config = CONFIG.API.CONFIG.COMPLETION[model];
		if (!config)
		{
			throw new Error(`Configuration not found for model: ${model}`);
		}
		const selectedModelName = StorageService.load(`${model}_model`, CONFIG.API.MODELS.COMPLETION[model].default);
		const selectedModel = CONFIG.API.MODELS.COMPLETION[model].options.find(m => m.name === selectedModelName);
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
				const jsonResponse = await response.json();
				return jsonResponse;
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
				if (options.images?.length > 0 && model !== 'anthropic')
				{
					const imageContent = options.images.map(dataURL => (
					{
						type: 'image_url',
						image_url:
						{
							url: dataURL
						},
					}));
					content = content.concat(imageContent);
				}
				if (options.images?.length > 0 && model === 'anthropic')
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
					content = content.concat(imageContent);
				}
				return {
					role: msg.role,
					content: content.length === 1 ? content[0].text : content
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
		if (!selectedModel.reasoning_effort && !selectedModel.thinking)
		{
			requestBody.temperature = 0;
		}
		if (selectedModel.reasoning_effort)
		{
			requestBody.reasoning_effort = StorageService.load('reasoning_effort', 'low');
		}
		if (selectedModel.thinking)
		{
			const thinkingBudget = parseInt(StorageService.load('thinking', 0), 10);
			if (thinkingBudget >= 1024)
			{
				requestBody.thinking = {
					type: "enabled",
					budget_tokens: thinkingBudget
				};
			}
			else
			{
				requestBody.temperature = 0;
			}
		}
		if (model !== 'openrouter' && model !== 'sambanova' && model !== 'together' && !selectedModel.reasoning_effort && selectedModel.name !== 'grok-2-1212')
		{
			requestBody.max_tokens = selectedModel.max_tokens;
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
		if (model === 'anthropic')
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
						const content = CONFIG.API.CONFIG.COMPLETION[model].extractStreamContent(parsed);
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
	async transcribe(file, language, apiKey, modelName, transcriptionModel, abortSignal)
	{
		const formData = new FormData();
		formData.append('file', file);
		formData.append('model', modelName);
		formData.append('language', language);
		formData.append('response_format', 'verbose_json');
		const config = CONFIG.API.CONFIG.TRANSCRIPTION[transcriptionModel];
		if (!config)
		{
			throw new Error(`Configuration not found for transcription model: ${transcriptionModel}`);
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
			const errorText = await response.text();
			throw new Error(`Transcription failed with status ${response.status}: ${errorText}`);
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