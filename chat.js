// chat.js
class ChatApp
{
	constructor()
	{
		this.elements = this.getElements();
		this.state = {
			messages: [],
			abortController: null,
			imageUploader: null,
			videoUploader: null,
			isStreaming: false,
		};
		this.loadMessages();
		this.selectedRenderer = StorageService.load('selected_renderer', 'katex');
	}
	getElements()
	{
		return {
			apiModelSelect: document.getElementById('apiModel'),
			chatContainer: document.getElementById('chatContainer'),
			messageInput: document.getElementById('messageInput'),
			sendMessageBtn: document.getElementById('sendMessage'),
			cleanChatBtn: document.getElementById('cleanChat'),
			imageUploadInput: document.getElementById('imageUploadInput'),
			videoUploadInput: document.getElementById('videoUploadInput'),
			imageList: document.getElementById('imageList'),
			videoList: document.getElementById('videoList'),
		};
	}
	init()
	{
		const isWideMode = StorageService.load('wide_enabled') === true;
		UIState.updateLayout(isWideMode);
		this.setupEventListeners();
		this.initializeComponents();
		this.displayMessages();
		this.updateInitialUI();
		const savedModel = StorageService.load('selected_api_model', 'chatgpt');
		if (this.elements.apiModelSelect)
		{
			this.elements.apiModelSelect.value = savedModel;
		}
	}
	async initializeComponents()
	{
		this.state.imageUploader = new UIComponents.ImageUploader(this.elements.imageUploadInput,
		{
			displayElement: this.elements.imageList,
			getApiModel: () => this.elements.apiModelSelect.value
		});
		this.state.videoUploader = new UIComponents.VideoUploader(this.elements.videoUploadInput,
		{
			displayElement: this.elements.videoList,
			getApiModel: () => this.elements.apiModelSelect.value
		});
		UIHandlers.setupModelSelectionHandler(this.elements);
	}
	updateInitialUI()
	{
		if (this.elements.apiModelSelect)
		{
			const currentModel = this.elements.apiModelSelect.value;
			const currentModelDetails = CONFIG.API.MODELS[currentModel]?.options.find(m => m.name === StorageService.load(`${currentModel}_model`, CONFIG.API.MODELS[currentModel].default));
			if (currentModelDetails)
			{
				UIState.updateImageUploadVisibility(currentModelDetails);
				UIState.updateVideoUploadVisibility(currentModelDetails);
			}
		}
	}
	setupEventListeners()
	{
		this.elements.sendMessageBtn.addEventListener('click', this.sendMessage.bind(this));
		this.elements.cleanChatBtn.addEventListener('click', this.clearChat.bind(this));
		if (this.elements.apiModelSelect)
		{
			this.elements.apiModelSelect.addEventListener('change', () =>
			{
				const selectedModel = this.elements.apiModelSelect.value;
				const currentModelDetails = CONFIG.API.MODELS[selectedModel]?.options.find(m => m.name === StorageService.load(`${selectedModel}_model`, CONFIG.API.MODELS[selectedModel].default));
				StorageService.save('selected_api_model', selectedModel);
				UIState.updateImageUploadVisibility(currentModelDetails);
				UIState.updateVideoUploadVisibility(currentModelDetails);
				this.loadMessages();
				this.displayMessages();
			});
		}
	}
	loadMessages()
	{
		const savedMessages = StorageService.load('chat_history', []);
		const currentModel = this.elements.apiModelSelect.value;
		if (currentModel === 'gemini')
		{
			this.state.messages = savedMessages.map(this.convertFromGeminiFormat);
		}
		else
		{
			this.state.messages = savedMessages.map(this.convertToGeminiFormat);
		}
		this.state.messages = savedMessages;
	}
	saveMessages()
	{
		const currentModel = this.elements.apiModelSelect.value;
		let messagesToSave = this.state.messages;
		if (currentModel === 'gemini')
		{
			messagesToSave = this.state.messages.map(this.convertToGeminiFormat);
		}
		else
		{
			messagesToSave = this.state.messages.map(this.convertFromGeminiFormat);
		}
		StorageService.save('chat_history', messagesToSave);
	}
	async sendMessage()
	{
		const messageText = this.elements.messageInput.value.trim();
		if (!messageText) return;
		this.addUserMessage(messageText);
		this.elements.messageInput.value = '';
		const model = this.elements.apiModelSelect.value;
		const apiKey = StorageService.load(CONFIG.API.KEYS[model]);
		if (!apiKey)
		{
			alert(`Please set your API key for ${model} in settings.`);
			return;
		}
		this.state.abortController = new AbortController();
		try
		{
			const imageURLs = Object.values(this.state.imageUploader.getImages());
			const videoURLs = Object.values(this.state.videoUploader.getVideos());
			const streamingEnabled = StorageService.load('streaming_enabled', true);
			this.state.isStreaming = streamingEnabled;
			const aiResponse = await AiService.generate("", model,
			{
				messages: this.state.messages,
				images: imageURLs,
				videos: videoURLs,
				abortSignal: this.state.abortController.signal,
				streaming: this.state.isStreaming,
				onProgress: (text) =>
				{
					if (this.state.messages.length > 0 && this.state.messages[this.state.messages.length - 1].role === "assistant")
					{
						this.state.messages[this.state.messages.length - 1].content = text;
					}
					else
					{
						this.addAssistantMessage(text);
					}
					this.displayMessages();
					this.saveMessages();
				}
			});
			if (!this.state.isStreaming)
			{
				const assistantContent = model === 'gemini' ? aiResponse.response.text() : CONFIG.API.CONFIG[model].extractContent(aiResponse);
				this.addAssistantMessage(assistantContent);
			}
		}
		catch (error)
		{
			if (error.name !== 'AbortError')
			{
				console.error("Error sending message:", error);
				alert("Failed to send message: " + error.message);
			}
		}
		finally
		{
			this.state.abortController = null;
			this.state.isStreaming = false;
		}
	}
	addUserMessage(text)
	{
		this.state.messages.push(
		{
			role: "user",
			content: text
		});
		this.displayMessages();
		this.saveMessages();
	}
	addAssistantMessage(text)
	{
		this.state.messages.push(
		{
			role: "assistant",
			content: text
		});
		this.displayMessages();
		this.saveMessages();
	}
	clearChat()
	{
		this.state.messages = [];
		this.displayMessages();
		this.saveMessages();
		this.state.imageUploader.clear();
		this.state.videoUploader.clear();
	}
	displayMessages()
	{
		this.elements.chatContainer.innerHTML = '';
		this.state.messages.forEach(message =>
		{
			const messageElement = this.createMessageElement(message);
			this.elements.chatContainer.appendChild(messageElement);
		});
		this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
	}
	createMessageElement(message)
	{
		const messageDiv = document.createElement('div');
		messageDiv.classList.add('message');
		messageDiv.classList.add(message.role === 'user' ? 'user-message' : 'assistant-message');
		const contentPara = document.createElement('p');
		let contentText = message.content;
		if (typeof contentText === 'string')
		{
			contentText = TextService.format.latex(contentText);
			contentPara.textContent = contentText;
		}
		messageDiv.appendChild(contentPara);
		setTimeout(() =>
		{
			if (this.selectedRenderer === 'katex')
			{
				renderMathInElement(messageDiv,
				{
					delimiters: [
					{
						left: '$$',
						right: '$$',
						display: true
					},
					{
						left: '$',
						right: '$',
						display: false
					},
					{
						left: '\\[',
						right: '\\]',
						display: true
					},
					{
						left: '\\(',
						right: '\\)',
						display: false
					}, ],
					throwOnError: false,
					trust: true,
					strict: false
				});
			}
			else if (this.selectedRenderer === 'mathjax3')
			{
				MathJax.typesetPromise([messageDiv]);
			}
		}, 0);
		return messageDiv;
	}
	convertToGeminiFormat(message)
	{
		if (message.role && typeof message.content === 'string')
		{
			return {
				role: message.role === "assistant" ? "model" : message.role,
				parts: [
				{
					text: message.content
				}],
			};
		}
		return message;
	}
	convertFromGeminiFormat(message)
	{
		if (message.role && Array.isArray(message.parts))
		{
			const textContent = message.parts.map(part => part.text)
				.join('');
			return {
				role: message.role === "model" ? "assistant" : message.role,
				content: textContent,
			};
		}
		return message;
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const chatApp = new ChatApp();
	chatApp.init();
});