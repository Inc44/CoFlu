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
		this.throttleTimer = null;
		this.throttleDelay = 1000;
		this.accumulatedText = '';
	}
	getElements()
	{
		return {
			apiModelSelect: document.getElementById('apiModel'),
			chatContainer: document.getElementById('chatContainer'),
			cleanChatBtn: document.getElementById('cleanChat'),
			exportSettingsBtn: document.getElementById('exportSettings'),
			imageList: document.getElementById('imageList'),
			imageUploadInput: document.getElementById('imageUploadInput'),
			importSettingsBtn: document.getElementById('importSettings'),
			messageInput: document.getElementById('messageInput'),
			sendMessageBtn: document.getElementById('sendMessage'),
			videoList: document.getElementById('videoList'),
			videoUploadInput: document.getElementById('videoUploadInput')
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
		const savedModel = StorageService.load('selected_api_model', 'openai');
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
			const currentModelDetails = CONFIG.API.MODELS.COMPLETION[currentModel]?.options.find(m => m.name === StorageService.load(`${currentModel}_model`, CONFIG.API.MODELS.COMPLETION[currentModel].default));
			if (currentModelDetails)
			{
				UIState.updateImageUploadVisibility(currentModelDetails);
				UIState.updateVideoUploadVisibility(currentModelDetails);
			}
		}
	}
	setupEventListeners()
	{
		this.elements.cleanChatBtn.addEventListener('click', this.clearChat.bind(this));
		this.elements.exportSettingsBtn.addEventListener('click', this.exportChat.bind(this));
		this.elements.importSettingsBtn.addEventListener('click', this.importChat.bind(this));
		this.elements.sendMessageBtn.addEventListener('click', this.sendMessage.bind(this));
		this.elements.messageInput.addEventListener('keydown', (event) =>
		{
			if (event.key === 'Enter' && !event.shiftKey)
			{
				event.preventDefault();
				this.sendMessage();
			}
		});
		if (this.elements.apiModelSelect)
		{
			this.elements.apiModelSelect.addEventListener('change', () =>
			{
				const selectedModel = this.elements.apiModelSelect.value;
				const currentModelDetails = CONFIG.API.MODELS.COMPLETION[selectedModel]?.options.find(m => m.name === StorageService.load(`${selectedModel}_model`, CONFIG.API.MODELS.COMPLETION[selectedModel].default));
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
		this.state.messages = savedMessages;
	}
	saveMessages()
	{
		StorageService.save('chat_history', this.state.messages);
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
		this.accumulatedText = '';
		this.elements.sendMessageBtn.textContent = 'Stop';
		this.elements.sendMessageBtn.style.backgroundColor = 'red';
		try
		{
			const imageURLs = Object.values(this.state.imageUploader.getImages());
			const videoURLs = Object.values(this.state.videoUploader.getVideos());
			const streamingEnabled = StorageService.load('streaming_enabled', true);
			this.state.isStreaming = streamingEnabled;
			const messages = this.state.messages.map(msg => (
			{
				role: msg.role,
				content: msg.content
			}));
			const aiResponse = await AiService.generate("", model,
			{
				messages: messages,
				images: imageURLs,
				videos: videoURLs,
				abortSignal: this.state.abortController.signal,
				streaming: this.state.isStreaming,
				onProgress: (text) =>
				{
					this.accumulatedText = text;
					this.throttledDisplay();
				}
			});
			if (!this.state.isStreaming)
			{
				let assistantContent = model === 'google' ? aiResponse.response.text() : CONFIG.API.CONFIG.COMPLETION[model].extractContent(aiResponse);
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
			this.elements.sendMessageBtn.textContent = 'Send';
			this.elements.sendMessageBtn.style.backgroundColor = '';
			this.state.abortController = null;
			this.state.isStreaming = false;
		}
	}
	throttledDisplay()
	{
		if (!this.throttleTimer)
		{
			this.throttleTimer = setTimeout(() =>
			{
				this.updateAssistantMessage(this.accumulatedText);
				this.displayMessages();
				this.throttleTimer = null;
			}, this.throttleDelay);
		}
	}
	updateAssistantMessage(text)
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
		this.state.messages.forEach((message, index) =>
		{
			const messageElement = this.createMessageElement(message, index);
			this.elements.chatContainer.appendChild(messageElement);
		});
		this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
	}
	createMessageElement(message, index)
	{
		const messageDiv = document.createElement('div');
		messageDiv.classList.add('message');
		messageDiv.classList.add(message.role === 'user' ? 'user-message' : 'assistant-message');
		messageDiv.dataset.index = index;
		const contentPara = document.createElement('p');
		let contentText = message.content;
		if (typeof contentText === 'string')
		{
			contentText = TextService.format.latex(contentText);
			contentText = marked.parse(contentText);
		}
		contentPara.innerHTML = contentText;
		const buttonContainer = document.createElement('div');
		buttonContainer.classList.add('message-buttons');
		const copyButton = document.createElement('button');
		copyButton.textContent = '📋';
		copyButton.classList.add('copy-button', 'btn', 'btn-sm');
		copyButton.addEventListener('click', () => this.copyMessage(index));
		buttonContainer.appendChild(copyButton);
		const editButton = document.createElement('button');
		editButton.textContent = '✏️';
		editButton.classList.add('edit-button', 'btn', 'btn-sm');
		editButton.addEventListener('click', () => this.editMessage(index));
		buttonContainer.appendChild(editButton);
		const deleteButton = document.createElement('button');
		deleteButton.textContent = '🗑️';
		deleteButton.classList.add('delete-button', 'btn', 'btn-sm');
		deleteButton.addEventListener('click', () => this.deleteMessage(index));
		buttonContainer.appendChild(deleteButton);
		messageDiv.appendChild(buttonContainer);
		messageDiv.appendChild(contentPara);
		setTimeout(() =>
		{
			this.renderMath(messageDiv);
		}, 0);
		return messageDiv;
	}
	editMessage(index)
	{
		const message = this.state.messages[index];
		if (!message) return;
		const messageDiv = this.elements.chatContainer.querySelector(`.message[data-index="${index}"]`);
		if (!messageDiv) return;
		const originalContent = message.content;
		const textarea = document.createElement('textarea');
		textarea.value = message.content;
		textarea.classList.add('edit-textarea', 'form-control');
		const buttonContainer = document.createElement('div');
		buttonContainer.classList.add('edit-buttons');
		const saveButton = document.createElement('button');
		saveButton.textContent = '💾';
		saveButton.classList.add('edit-button', 'btn', 'btn-sm');
		saveButton.addEventListener('click', () => this.saveEditedMessage(index, textarea.value));
		const cancelButton = document.createElement('button');
		cancelButton.textContent = '❌';
		cancelButton.classList.add('edit-button', 'btn', 'btn-sm');
		cancelButton.addEventListener('click', () => this.cancelEdit(index, originalContent));
		buttonContainer.appendChild(saveButton);
		buttonContainer.appendChild(cancelButton);
		messageDiv.innerHTML = '';
		messageDiv.appendChild(textarea);
		messageDiv.appendChild(buttonContainer);
		textarea.focus();
	}
	saveEditedMessage(index, newText)
	{
		this.state.messages[index].content = newText;
		this.saveMessages();
		this.displayMessages();
	}
	cancelEdit(index, originalContent)
	{
		this.state.messages[index].content = originalContent;
		this.displayMessages();
	}
	deleteMessage(index)
	{
		this.state.messages.splice(index, 1);
		this.saveMessages();
		this.displayMessages();
	}
	copyMessage(index)
	{
		const message = this.state.messages[index];
		if (!message) return;
		try
		{
			navigator.clipboard.writeText(message.content);
		}
		catch (err)
		{
			console.error('Failed to copy: ', err);
			alert('Failed to copy message to clipboard.');
		}
	}
	renderMath(element)
	{
		if (this.selectedRenderer === 'katex')
		{
			renderMathInElement(element,
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
					left: '\[',
					right: '\]',
					display: true
				},
				{
					left: '\(',
					right: '\)',
					display: false
				}, ],
				throwOnError: false,
				trust: true,
				strict: false
			});
		}
		else if (this.selectedRenderer === 'mathjax3')
		{
			MathJax.typesetPromise([element])
				.catch(err => console.error("MathJax typesetting error:", err));
		}
	}
	exportChat()
	{
		const chatHistory = StorageService.load('chat_history', []);
		const chatHistoryJSON = JSON.stringify(chatHistory, null, 2);
		const blob = new Blob([chatHistoryJSON],
		{
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'CoFlu Chat.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
	importChat()
	{
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.addEventListener('change', (event) =>
		{
			const file = event.target.files[0];
			if (file)
			{
				const reader = new FileReader();
				reader.onload = (e) =>
				{
					try
					{
						const parsedHistory = JSON.parse(e.target.result);
						if (!Array.isArray(parsedHistory))
						{
							throw new Error('Imported data is not a valid chat history array.');
						}
						StorageService.save('chat_history', parsedHistory);
						this.loadMessages();
						this.displayMessages();
						alert('Chat history imported successfully!');
					}
					catch (error)
					{
						console.error('Error importing chat history:', error);
						alert(`Error importing chat history: ${error.message}`);
					}
				};
				reader.readAsText(file);
			}
		});
		input.click();
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const chatApp = new ChatApp();
	chatApp.init();
});