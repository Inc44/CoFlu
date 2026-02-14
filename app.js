class App
{
	constructor()
	{
		this.els = this.getElements();
		this.state = {
			abortCtrl: null,
			transcribeAbortCtrl: null,
			audioUploader: null,
			fileUploader: null,
			imageUploader: null,
			videoUploader: null
		};
		this.loadSavedSettings();
	}
	getElements()
	{
		return {
			apiModel: document.getElementById('apiModel'),
			audioFile: document.getElementById('audioFile'),
			audioUploadInput: document.getElementById('audioUploadInput'),
			fileUploadInput: document.getElementById('fileUploadInput'),
			imageUploadInput: document.getElementById('imageUploadInput'),
			videoUploadInput: document.getElementById('videoUploadInput'),
			cleanupToggle: document.getElementById('cleanupToggle'),
			compareBtn: document.getElementById('compareBtn'),
			customPromptBox: document.getElementById('customPromptContainer'),
			customPrompt: document.getElementById('customPrompt'),
			genTargetBtn: document.getElementById('generateTarget'),
			langSelect: document.getElementById('language'),
			noBSToggle: document.getElementById('noBSToggle'),
			noBSPlusToggle: document.getElementById('noBSPlusToggle'),
			printBox: document.getElementById('printContainer'),
			promptSelect: document.getElementById('promptSelect'),
			renderMdBtn: document.getElementById('renderMarkdownBtn'),
			savePromptBtn: document.getElementById('savePrompt'),
			deletePromptBtn: document.getElementById('deletePrompt'),
			sourceText: document.getElementById('sourceText'),
			streamToggle: document.getElementById('streamingToggle'),
			switchBtn: document.getElementById('switchBtn'),
			targetText: document.getElementById('targetText'),
			transcribeBtn: document.getElementById('transcribeBtn'),
			transcribeLang: document.getElementById('transcribeLanguage'),
			translateToggle: document.getElementById('translationToggle'),
			speedBox: document.getElementById('speed-container'),
			speedDisplay: document.getElementById('speed')
		};
	}
	async init()
	{
		await this.initComponents();
		this.loadSavedContent();
		this.setupEvents();
		this.updateUI();
		this.setupErrorHandling();
	}
	async initComponents()
	{
		UIHandlers.setupTextAreaHandlers(this.els);
		UIHandlers.setupFileUploaders(this.els);
		if (window.location.pathname.endsWith('settings.html'))
		{
			UIHandlers.setupSettingsHandlers(this.els);
		}
		else
		{
			UIHandlers.setupModelSelectionHandler(this.els);
		}
		this.state.audioUploader = new UIComponents.AudioUploader(this.els.audioUploadInput,
		{
			displayElement: document.getElementById('audioList'),
			getApiModel: () => this.els.apiModel.value
		});
		this.state.fileUploader = new UIComponents.FileUploader(this.els.fileUploadInput,
		{
			displayElement: document.getElementById('fileList'),
			getApiModel: () => this.els.apiModel.value
		});
		this.state.imageUploader = new UIComponents.ImageUploader(this.els.imageUploadInput,
		{
			displayElement: document.getElementById('imageList'),
			getApiModel: () => this.els.apiModel.value
		});
		this.state.videoUploader = new UIComponents.VideoUploader(this.els.videoUploadInput,
		{
			displayElement: document.getElementById('videoList'),
			getApiModel: () => this.els.apiModel.value
		});
	}
	loadSavedSettings()
	{
		const savedModel = StorageService.load('selected_api_model', 'openai');
		if (this.els.apiModel)
		{
			this.els.apiModel.value = savedModel;
		}
		const toggles = {
			'cleanupToggle': ['cleanup_enabled', true],
			'noBSToggle': ['no_bs_enabled', false],
			'noBSPlusToggle': ['no_bs_plus_enabled', false],
			'streamToggle': ['streaming_enabled', true],
			'translateToggle': ['translation_enabled', false]
		};
		Object.entries(toggles)
			.forEach(([id, [key, def]]) =>
			{
				if (this.els[id])
				{
					const saved = StorageService.load(key);
					this.els[id].checked = saved !== null ? saved === true : def;
				}
			});
		if (this.els.langSelect)
		{
			this.els.langSelect.value = StorageService.load('selected_language', 'English (American)');
		}
		if (this.els.transcribeLang)
		{
			this.els.transcribeLang.value = StorageService.load('transcribe_language', 'en');
		}
	}
	loadSavedContent()
	{
		if (this.els.sourceText)
		{
			this.els.sourceText.value = StorageService.load('sourceText', '');
			TextService.updateStats(this.els.sourceText, 'source');
		}
		if (this.els.targetText)
		{
			this.els.targetText.value = StorageService.load('targetText', '');
			TextService.updateStats(this.els.targetText, 'target');
		}
		PromptService.loadPrompts(this.els, false);
	}
	setupEvents()
	{
		UIHandlers.setupCompareButton(this.els);
		UIHandlers.setupSwitchButton(this.els);
		UIHandlers.setupGenerateButton(this.els, this.state);
		PromptService.setupPromptEvents(this.els, false);
		this.setupMarkdownEvent();
		this.setupTranscribeEvent();
		if (this.els.langSelect)
		{
			this.els.langSelect.addEventListener('change', () =>
			{
				StorageService.save('selected_language', this.els.langSelect.value);
			});
		}
	}
	setupMarkdownEvent()
	{
		if (!this.els.renderMdBtn) return;
		this.els.renderMdBtn.addEventListener('click', () =>
		{
			const srcMd = this.els.sourceText?.value || '';
			const tgtMd = this.els.targetText?.value || '';
			document.getElementById('leftColumn')
				.innerHTML = marked.parse(TextService.format.latex(srcMd));
			document.getElementById('rightColumn')
				.innerHTML = marked.parse(TextService.format.latex(tgtMd));
			this.els.printBox.innerHTML = marked.parse(TextService.format.latex(tgtMd));
			this.renderMath();
		});
	}
	renderMath()
	{
		const renderer = StorageService.load('selected_renderer', 'katex');
		[
			document.getElementById('leftColumn'),
			document.getElementById('rightColumn'),
			this.els.printBox,
			this.els.sourceText,
			this.els.targetText
		].forEach(el => MathService.renderMath(el, renderer));
	}
	setupTranscribeEvent()
	{
		if (!this.els.transcribeBtn) return;
		this.els.transcribeBtn.addEventListener('click', async () =>
		{
			if (this.els.transcribeBtn.dataset.transcribing === 'true')
			{
				if (this.state.transcribeAbortCtrl)
				{
					this.state.transcribeAbortCtrl.abort();
				}
				UIState.setTranscribing(false, this.els);
				this.state.transcribeAbortCtrl = null;
				return;
			}
			const transModel = StorageService.load('selected_transcription_api_model', 'groq');
			const apiKey = StorageService.load(CONFIG.API.KEYS[transModel]);
			if (!apiKey)
			{
				alert(`Please enter your ${transModel} API key.`);
				return;
			}
			const file = this.els.audioFile?.files[0];
			if (!file)
			{
				alert("Please select an audio file.");
				return;
			}
			const limits = CONFIG.LIMITS.TRANSCRIPTION.AUDIO[transModel];
			const fileSizeMB = file.size / (1024 * 1024);
			const autoSplitEnabled = StorageService.load('auto_split_enabled', false) === true;
			if (!autoSplitEnabled && fileSizeMB > limits.size)
			{
				alert(`Audio file exceeds the maximum size of ${limits.size}MB for ${transModel}. Enable Auto-Split in settings.`);
				return;
			}
			UIState.setTranscribing(true, this.els);
			this.state.transcribeAbortCtrl = new AbortController();
			const abortSignal = this.state.transcribeAbortCtrl.signal;
			const whisperModel = StorageService.load(`${transModel}_whisper_model`, CONFIG.API.MODELS.TRANSCRIPTION[transModel].default);
			let text = '';
			if (autoSplitEnabled && fileSizeMB > limits.size)
			{
				const chunks = await AiService.splitAudio(file, limits.size);
				for (let i = 0; i < chunks.length; i++)
				{
					if (abortSignal.aborted) break;
					const result = await AiService.transcribe(chunks[i], this.els.transcribeLang.value, apiKey, whisperModel, transModel, abortSignal);
					if (result?.text)
					{
						text += (text ? ' ' : '') + result.text;
					}
				}
			}
			else
			{
				const result = await AiService.transcribe(file, this.els.transcribeLang.value, apiKey, whisperModel, transModel, abortSignal);
				if (result?.text !== undefined)
				{
					text = result.text;
				}
			}
			if (this.els.sourceText)
			{
				this.els.sourceText.value = text;
				TextService.updateStats(this.els.sourceText, 'source');
				StorageService.save('sourceText', text);
			}
			UIState.setTranscribing(false, this.els);
			this.state.transcribeAbortCtrl = null;
		});
	}
	updateUI()
	{
		if (!this.els.apiModel) return;
		const provider = this.els.apiModel.value;
		const details = UtilService.getDetails(provider);
		if (details)
		{
			UIState.updateUploadsVisibility(details);
		}
	}
	setupErrorHandling()
	{
		window.onerror = () =>
		{
			alert('An unexpected error occurred. Please refresh the page and try again.');
			return false;
		};
		window.addEventListener('beforeunload', () =>
		{
			if (this.els.sourceText)
			{
				StorageService.save('sourceText', this.els.sourceText.value);
			}
			if (this.els.targetText)
			{
				StorageService.save('targetText', this.els.targetText.value);
			}
		});
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const app = new App();
	app.init();
});