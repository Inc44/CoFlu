// services/ai.service.js
const AiService = {
	async generate(prompt, model, options = {}) {
		const apiKey = StorageService.load(CONFIG.API.KEYS[model]);
		if (!apiKey) {
		  throw new Error("Please enter your API key.");
		}
		try {
		  if (model === 'gemini') {
			await this.generateWithGemini(apiKey, prompt, options);
		  } else {
			const config = CONFIG.API.CONFIG[model];
			const selectedModelName = StorageService.load(`${model}_model`, CONFIG.API.MODELS[model].default);
			const selectedModel = CONFIG.API.MODELS[model].options.find(m => m.name === selectedModelName);
	
			if (!selectedModel) {
			  throw new Error(`Model ${selectedModelName} not found in configuration.`);
			}
	
			let requestBody = {
			  model: selectedModel.name,
			  messages: this.formatMessagesWithImages(prompt, options.images, model),
			  temperature: 0,
			  max_tokens: selectedModel.max_completion_tokens,
			  stream: options.streaming
			};
	
			const headers = {
			  'Content-Type': 'application/json',
			  [config.apiKeyHeader]: config.apiKeyPrefix + apiKey,
			  ...config.additionalHeaders
			};
	
			const response = await fetch(config.url, {
			  method: 'POST',
			  headers,
			  body: JSON.stringify(requestBody),
			  signal: options.abortSignal
			});
	
			if (!response.ok) {
			  throw new Error(`API request failed: ${response.status}`);
			}
	
			if (options.streaming) {
			  await this.handleStreamingResponse(response, model, options.onProgress);
			} else {
			  const data = await response.json();
			  const content = config.extractContent(data);
			  if (content && options.onProgress) {
				options.onProgress(content);
			  }
			}
		  }
		} catch (error) {
		  console.error('Generation error:', error);
		  throw error;
		}
	  },
	async generateWithGemini(apiKey, prompt, options) {
		const { GoogleGenerativeAI } = await import("@google/generative-ai");
		const genAI = new GoogleGenerativeAI(apiKey);
		const selectedModel = StorageService.load('gemini_model', CONFIG.API.MODELS.gemini.default);
		const model = genAI.getGenerativeModel({ model: selectedModel });
	  
		let imageParts = [];
		if (options.images && options.images.length > 0) {
		  imageParts = options.images.map(imageDataUrl => {
			const base64Data = imageDataUrl.split(',')[1];
			const mimeType = imageDataUrl.match(/^data:(.*?);base64,/)?.[1];
			return {
			  inlineData: {
				data: base64Data,
				mimeType: mimeType || 'image/png'
			  }
			};
		  });
		}
	  
		const textPrompt = {
		  contents: [{
			role: "user",
			parts: [
			  { text: prompt },
			  ...imageParts
			]
		  }],
		};
	  
		try {
		  if (options.streaming) {
			const result = await model.generateContentStream(textPrompt);
			let accumulatedText = '';
			for await (const chunk of result.stream) {
			  if (options.abortSignal?.aborted) {
				throw new DOMException('Aborted', 'AbortError');
			  }
			  const content = CONFIG.API.CONFIG.gemini.extractStreamContent(chunk);
			  if (content) {
				accumulatedText += content;
				if (options.onProgress) {
				  options.onProgress(accumulatedText);
				}
			  }
			}
		  } else {
			const result = await model.generateContent(textPrompt);
			const response = result.response;
			const content = CONFIG.API.CONFIG.gemini.extractContent(response);
			if (content && options.onProgress) {
			  options.onProgress(content);
			}
		  }
		} catch (error) {
		  if (error.name === 'AbortError') throw error;
		  throw new Error(`Gemini API error: ${error.message}`);
		}
	  },
		
	formatMessagesWithImages(prompt, images = [], model)
	{
		const imageContent = images.map(dataURL => (
		{
			type: 'image_url',
			image_url:
			{
				url: dataURL
			}
		}));
		if (model === 'groq')
		{
			return [
			{
				role: "user",
				content: [
				{
					type: "text",
					text: prompt
				}, ...imageContent.map(img => (
				{
					type: "image_url",
					image_url: img.image_url
				}))]
			}];
		}
		return [
		{
			role: "user",
			content: [...imageContent, prompt]
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
							if (onProgress)
							{
								onProgress(accumulatedText);
							}
						}
					}
					catch (e)
					{
						console.error('Error parsing streaming JSON:', e);
					}
				}
			}
			buffer = lines.pop() || '';
		}
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
				[CONFIG.API.CONFIG.groq.apiKeyHeader]: CONFIG.API.CONFIG.groq.apiKeyPrefix + apiKey
			},
			body: formData
		});
		if (!response.ok)
		{
			throw new Error(`Transcription failed with status ${response.status}`);
		}
		return await response.json();
	}
};
window.AiService = AiService;