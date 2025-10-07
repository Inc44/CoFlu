class ChatApp
{
	constructor()
	{
		this.els = this.getElements();
		this.state = {
			msgs: [],
			abortCtrl: null,
			audioUploader: null,
			fileUploader: null,
			imageUploader: null,
			videoUploader: null,
			isStreaming: false,
		};
		this.loadMsgs();
		this.renderer = StorageService.load('selected_renderer', 'katex');
		this.throttleTimer = null;
		this.throttleDelay = 1000;
		this.accumulatedText = '';
	}
	getElements()
	{
		return {
			apiModel: document.getElementById('apiModel'),
			audioList: document.getElementById('audioList'),
			audioUploadInput: document.getElementById('audioUploadInput'),
			fileList: document.getElementById('fileList'),
			fileUploadInput: document.getElementById('fileUploadInput'),
			imageList: document.getElementById('imageList'),
			imageUploadInput: document.getElementById('imageUploadInput'),
			videoList: document.getElementById('videoList'),
			videoUploadInput: document.getElementById('videoUploadInput'),
			chatBox: document.getElementById('chatContainer'),
			cleanChatBtn: document.getElementById('cleanChat'),
			exportBtn: document.getElementById('exportSettings'),
			importBtn: document.getElementById('importSettings'),
			msgInput: document.getElementById('messageInput'),
			sendBtn: document.getElementById('sendMessage'),
		};
	}
	init()
	{
		this.setupEvents();
		this.initComponents();
		this.displayMsgs();
		this.updateUI();
		const savedModel = StorageService.load('selected_api_model', 'openai');
		if (this.els.apiModel)
		{
			this.els.apiModel.value = savedModel;
		}
	}
	initComponents()
	{
		this.state.audioUploader = new UIComponents.AudioUploader(this.els.audioUploadInput,
		{
			displayElement: this.els.audioList,
			getApiModel: () => this.els.apiModel.value
		});
		this.state.fileUploader = new UIComponents.FileUploader(this.els.fileUploadInput,
		{
			displayElement: this.els.fileList,
			getApiModel: () => this.els.apiModel.value
		});
		this.state.imageUploader = new UIComponents.ImageUploader(this.els.imageUploadInput,
		{
			displayElement: this.els.imageList,
			getApiModel: () => this.els.apiModel.value
		});
		this.state.videoUploader = new UIComponents.VideoUploader(this.els.videoUploadInput,
		{
			displayElement: this.els.videoList,
			getApiModel: () => this.els.apiModel.value
		});
		UIHandlers.setupModelSelectionHandler(this.els);
	}
	updateUI()
	{
		if (!this.els.apiModel) return;
		const model = this.els.apiModel.value;
		const modelName = StorageService.load(`${model}_model`, CONFIG.API.MODELS.COMPLETION[model].default);
		let details = CONFIG.API.MODELS.COMPLETION[model]?.options.find(m => m.name === modelName);
		if (!details && StorageService.load('high_cost_enabled', false) && CONFIG.API.MODELS.COMPLETION_HIGH_COST[model])
		{
			details = CONFIG.API.MODELS.COMPLETION_HIGH_COST[model].options.find(m => m.name === modelName);
		}
		if (details)
		{
			UIState.updateAudioUploadVisibility(details);
			UIState.updateFileUploadVisibility(details);
			UIState.updateImageUploadVisibility(details);
			UIState.updateVideoUploadVisibility(details);
		}
	}
	setupEvents()
	{
		this.els.cleanChatBtn.addEventListener('click', this.clearChat.bind(this));
		this.els.exportBtn.addEventListener('click', this.exportChat.bind(this));
		this.els.importBtn.addEventListener('click', this.importChat.bind(this));
		this.els.sendBtn.addEventListener('click', this.sendMsg.bind(this));
		this.els.msgInput.addEventListener('keydown', (event) =>
		{
			if (event.key === 'Enter' && !event.shiftKey)
			{
				event.preventDefault();
				this.sendMsg();
			}
		});
		if (this.els.apiModel)
		{
			this.els.apiModel.addEventListener('change', () =>
			{
				const model = this.els.apiModel.value;
				const modelName = StorageService.load(`${model}_model`, CONFIG.API.MODELS.COMPLETION[model].default);
				let details = CONFIG.API.MODELS.COMPLETION[model]?.options.find(m => m.name === modelName);
				if (!details && StorageService.load('high_cost_enabled', false) && CONFIG.API.MODELS.COMPLETION_HIGH_COST[model])
				{
					details = CONFIG.API.MODELS.COMPLETION_HIGH_COST[model].options.find(m => m.name === modelName);
				}
				StorageService.save('selected_api_model', model);
				if (details)
				{
					UIState.updateAudioUploadVisibility(details);
					UIState.updateFileUploadVisibility(details);
					UIState.updateImageUploadVisibility(details);
					UIState.updateVideoUploadVisibility(details);
				}
				this.loadMsgs();
				this.displayMsgs();
			});
		}
	}
	loadMsgs()
	{
		this.state.msgs = StorageService.load('chat_history', []);
	}
	saveMsgs()
	{
		StorageService.save('chat_history', this.state.msgs);
	}
	async sendMsg()
	{
		const text = this.els.msgInput.value.trim();
		if (!text) return;
		if (this.state.isStreaming || this.state.abortCtrl)
		{
			this.state.abortCtrl?.abort();
			this.els.sendBtn.textContent = 'Send';
			this.els.sendBtn.style.backgroundColor = '';
			this.state.abortCtrl = null;
			this.state.isStreaming = false;
			return;
		}
		this.addUserMsg(text);
		this.els.msgInput.value = '';
		const model = this.els.apiModel.value;
		const apiKey = StorageService.load(CONFIG.API.KEYS[model]);
		if (!apiKey)
		{
			alert(`Please set your API key for ${model} in settings.`);
			return;
		}
		this.state.abortCtrl = new AbortController();
		this.accumulatedText = '';
		this.els.sendBtn.textContent = 'Stop';
		this.els.sendBtn.style.backgroundColor = 'red';
		const audioURLs = Object.values(this.state.audioUploader.getAudios());
		const fileURLs = this.state.fileUploader.getFiles();
		const imageURLs = Object.values(this.state.imageUploader.getImages());
		const videoURLs = Object.values(this.state.videoUploader.getVideos());
		const streaming = StorageService.load('streaming_enabled', true);
		this.state.isStreaming = streaming;
		const messages = this.state.msgs.map(msg => (
		{
			role: msg.role,
			content: msg.content
		}));
		const aiResponse = await AiService.generate("", model,
		{
			messages: messages,
			audios: audioURLs,
			files: fileURLs,
			images: imageURLs,
			videos: videoURLs,
			abortSignal: this.state.abortCtrl.signal,
			streaming: this.state.isStreaming,
			onProgress: (text) =>
			{
				this.accumulatedText = text;
				this.throttledDisplay();
			}
		});
		if (!this.state.isStreaming)
		{
			let content = CONFIG.API.CONFIG.COMPLETION[model].extractContent(aiResponse);
			this.addAssistantMsg(content);
		}
		this.els.sendBtn.textContent = 'Send';
		this.els.sendBtn.style.backgroundColor = '';
		this.state.abortCtrl = null;
		this.state.isStreaming = false;
	}
	throttledDisplay()
	{
		if (!this.throttleTimer)
		{
			this.throttleTimer = setTimeout(() =>
			{
				this.updateAssistantMsg(this.accumulatedText);
				this.displayMsgs();
				this.throttleTimer = null;
			}, this.throttleDelay);
		}
	}
	updateAssistantMsg(text)
	{
		if (this.state.msgs.length > 0 && this.state.msgs[this.state.msgs.length - 1].role === "assistant")
		{
			this.state.msgs[this.state.msgs.length - 1].content = text;
		}
		else
		{
			this.addAssistantMsg(text);
		}
		this.displayMsgs();
		this.saveMsgs();
	}
	addUserMsg(text)
	{
		this.state.msgs.push(
		{
			role: "user",
			content: text
		});
		this.displayMsgs();
		this.saveMsgs();
	}
	addAssistantMsg(text)
	{
		this.state.msgs.push(
		{
			role: "assistant",
			content: text
		});
		this.displayMsgs();
		this.saveMsgs();
	}
	clearChat()
	{
		this.state.msgs = [];
		this.displayMsgs();
		this.saveMsgs();
		this.state.audioUploader.clear();
		this.state.fileUploader.clear();
		this.state.imageUploader.clear();
		this.state.videoUploader.clear();
	}
	displayMsgs()
	{
		this.els.chatBox.innerHTML = '';
		this.state.msgs.forEach((msg, i) =>
		{
			const msgEl = this.createMsgElement(msg, i);
			this.els.chatBox.appendChild(msgEl);
		});
		this.els.chatBox.scrollTop = this.els.chatBox.scrollHeight;
	}
	createMsgElement(msg, index)
	{
		const msgDiv = document.createElement('div');
		msgDiv.classList.add('message');
		msgDiv.classList.add(msg.role === 'user' ? 'user-message' : 'assistant-message');
		msgDiv.dataset.index = index;
		const contentP = document.createElement('p');
		let content = msg.content;
		if (typeof content === 'string')
		{
			content = TextService.format.latex(content);
			content = marked.parse(content);
		}
		contentP.innerHTML = content;
		const btnBox = document.createElement('div');
		btnBox.classList.add('message-buttons');
		const copyBtn = document.createElement('button');
		copyBtn.textContent = '📋';
		copyBtn.classList.add('copy-button', 'btn', 'btn-sm');
		copyBtn.addEventListener('click', () => this.copyMsg(index));
		btnBox.appendChild(copyBtn);
		const editBtn = document.createElement('button');
		editBtn.textContent = '✏️';
		editBtn.classList.add('edit-button', 'btn', 'btn-sm');
		editBtn.addEventListener('click', () => this.editMsg(index));
		btnBox.appendChild(editBtn);
		const delBtn = document.createElement('button');
		delBtn.textContent = '🗑️';
		delBtn.classList.add('delete-button', 'btn', 'btn-sm');
		delBtn.addEventListener('click', () => this.deleteMsg(index));
		btnBox.appendChild(delBtn);
		msgDiv.appendChild(btnBox);
		msgDiv.appendChild(contentP);
		setTimeout(() =>
		{
			this.renderMath(msgDiv);
		}, 0);
		return msgDiv;
	}
	editMsg(index)
	{
		const msg = this.state.msgs[index];
		if (!msg) return;
		const msgDiv = this.els.chatBox.querySelector(`.message[data-index="${index}"]`);
		if (!msgDiv) return;
		const origContent = msg.content;
		const textarea = document.createElement('textarea');
		textarea.value = msg.content;
		textarea.classList.add('edit-textarea', 'form-control');
		textarea.setAttribute('rows', 20);
		textarea.setAttribute('cols', 120);
		const btnBox = document.createElement('div');
		btnBox.classList.add('edit-buttons');
		const saveBtn = document.createElement('button');
		saveBtn.textContent = '💾';
		saveBtn.classList.add('edit-button', 'btn', 'btn-sm');
		saveBtn.addEventListener('click', () => this.saveEditedMsg(index, textarea.value));
		const cancelBtn = document.createElement('button');
		cancelBtn.textContent = '❌';
		cancelBtn.classList.add('edit-button', 'btn', 'btn-sm');
		cancelBtn.addEventListener('click', () => this.cancelEdit(index, origContent));
		btnBox.appendChild(saveBtn);
		btnBox.appendChild(cancelBtn);
		msgDiv.innerHTML = '';
		msgDiv.appendChild(textarea);
		msgDiv.appendChild(btnBox);
		textarea.focus();
	}
	saveEditedMsg(index, newText)
	{
		this.state.msgs[index].content = newText;
		this.saveMsgs();
		this.displayMsgs();
	}
	cancelEdit(index, origContent)
	{
		this.state.msgs[index].content = origContent;
		this.displayMsgs();
	}
	deleteMsg(index)
	{
		this.state.msgs.splice(index, 1);
		this.saveMsgs();
		this.displayMsgs();
	}
	copyMsg(index)
	{
		const msg = this.state.msgs[index];
		if (!msg) return;
		navigator.clipboard.writeText(msg.content);
	}
	renderMath(element)
	{
		if (this.renderer === 'katex')
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
					left: '\\\[',
					right: '\\\]',
					display: true
				},
				{
					left: '\\\(',
					right: '\\\)',
					display: false
				}],
				throwOnError: false,
				trust: true,
				strict: false
			});
		}
		else if (this.renderer === 'mathjax3')
		{
			MathJax.typesetPromise([element]);
		}
	}
	exportChat()
	{
		const chatHistory = StorageService.load('chat_history', []);
		const chatJSON = JSON.stringify(chatHistory, null, 2);
		const blob = new Blob([chatJSON],
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
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (e) =>
			{
				const parsed = JSON.parse(e.target.result);
				if (!Array.isArray(parsed))
				{
					alert('Imported data is not a valid chat history array.');
					return;
				}
				StorageService.save('chat_history', parsed);
				this.loadMsgs();
				this.displayMsgs();
				alert('Chat history imported successfully!');
			};
			reader.readAsText(file);
		});
		input.click();
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const chatApp = new ChatApp();
	chatApp.init();
});