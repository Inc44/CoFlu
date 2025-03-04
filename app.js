// app.js
class App
{
	constructor()
	{
		this.elements = this.getElements();
		this.state = {
			abortController: null,
			transcribeAbortController: null,
			imageUploader: null,
			videoUploader: null
		};
		this.loadSavedSettings();
	}
	getElements()
	{
		return {
			apiModelSelect: document.getElementById('apiModel'),
			audioFile: document.getElementById('audioFile'),
			cleanupToggle: document.getElementById('cleanupToggle'),
			compareBtn: document.getElementById('compareBtn'),
			customPromptContainer: document.getElementById('customPromptContainer'),
			customPromptInput: document.getElementById('customPrompt'),
			generateTargetBtn: document.getElementById('generateTarget'),
			imageUploadInput: document.getElementById('imageUploadInput'),
			languageSelect: document.getElementById('language'),
			noBSToggle: document.getElementById('noBSToggle'),
			printContainer: document.getElementById('printContainer'),
			promptSelect: document.getElementById('promptSelect'),
			renderMarkdownBtn: document.getElementById('renderMarkdownBtn'),
			savePromptBtn: document.getElementById('savePrompt'),
			sourceText: document.getElementById('sourceText'),
			streamingToggle: document.getElementById('streamingToggle'),
			switchBtn: document.getElementById('switchBtn'),
			targetText: document.getElementById('targetText'),
			transcribeBtn: document.getElementById('transcribeBtn'),
			transcribeLanguage: document.getElementById('transcribeLanguage'),
			translationToggle: document.getElementById('translationToggle'),
			videoUploadInput: document.getElementById('videoUploadInput'),
			wpmContainer: document.getElementById('wpm-container'),
			wpmDisplay: document.getElementById('wpm')
		};
	}
	async init()
	{
		try
		{
			await this.initializeComponents();
			this.loadSavedContent();
			this.setupEventHandlers();
			this.updateInitialUI();
			this.setupErrorHandling();
		}
		catch (error)
		{
			console.error('Initialization error:', error);
			alert('Error initializing application. Please refresh the page.');
		}
	}
	async initializeComponents()
	{
		UIHandlers.setupTextAreaHandlers(this.elements);
		UIHandlers.setupFileUploaders(this.elements);
		if (window.location.pathname.endsWith('settings.html'))
		{
			UIHandlers.setupSettingsHandlers(this.elements);
		}
		else
		{
			UIHandlers.setupModelSelectionHandler(this.elements);
		}
		this.state.imageUploader = new UIComponents.ImageUploader(this.elements.imageUploadInput,
		{
			displayElement: document.getElementById('imageList'),
			getApiModel: () => this.elements.apiModelSelect.value
		});
		this.state.videoUploader = new UIComponents.VideoUploader(this.elements.videoUploadInput,
		{
			displayElement: document.getElementById('videoList'),
			getApiModel: () => this.elements.apiModelSelect.value
		});
	}
	loadSavedSettings()
	{
		const savedModel = StorageService.load('selected_api_model', 'openai');
		if (this.elements.apiModelSelect)
		{
			this.elements.apiModelSelect.value = savedModel;
		}
		const toggleSettings = {
			'cleanupToggle': ['cleanup_enabled', true],
			'noBSToggle': ['no_bs_enabled', false],
			'streamingToggle': ['streaming_enabled', true],
			'translationToggle': ['translation_enabled', false]
		};
		Object.entries(toggleSettings)
			.forEach(([elementId, [storageKey, defaultValue]]) =>
			{
				if (this.elements[elementId])
				{
					const savedValue = StorageService.load(storageKey);
					this.elements[elementId].checked = savedValue !== null ? savedValue === true : defaultValue;
				}
			});
		if (this.elements.languageSelect)
		{
			this.elements.languageSelect.value = StorageService.load('selected_language', 'English');
		}
		if (this.elements.transcribeLanguage)
		{
			this.elements.transcribeLanguage.value = StorageService.load('transcribe_language', 'en');
		}
	}
	loadSavedContent()
	{
		if (this.elements.sourceText)
		{
			this.elements.sourceText.value = StorageService.load('sourceText', '');
			TextService.updateStats(this.elements.sourceText, 'source');
		}
		if (this.elements.targetText)
		{
			this.elements.targetText.value = StorageService.load('targetText', '');
			TextService.updateStats(this.elements.targetText, 'target');
		}
		this.loadPrompts();
	}
	loadPrompts()
	{
		if (!this.elements.promptSelect) return;
		const savedPrompts = StorageService.load('prompts', []);
		this.elements.promptSelect.innerHTML = '';
		CONFIG.UI.STANDARD_PROMPTS.forEach(prompt =>
		{
			const option = document.createElement('option');
			option.value = prompt;
			option.textContent = prompt;
			this.elements.promptSelect.appendChild(option);
		});
		savedPrompts.forEach((prompt, index) =>
		{
			const option = document.createElement('option');
			option.value = prompt;
			option.textContent = `Custom ${index + 1}: ${prompt.substring(0, 30)}...`;
			this.elements.promptSelect.appendChild(option);
		});
		const customOption = document.createElement('option');
		customOption.value = 'custom';
		customOption.textContent = 'Custom prompt';
		this.elements.promptSelect.appendChild(customOption);
		if (this.elements.customPromptContainer)
		{
			this.elements.customPromptContainer.style.display = this.elements.promptSelect.value === 'custom' ? 'block' : 'none';
		}
	}
	setupEventHandlers()
	{
		UIHandlers.setupCompareButton(this.elements);
		UIHandlers.setupSwitchButton(this.elements);
		UIHandlers.setupGenerateButton(this.elements, this.state);
		this.setupPromptHandlers();
		this.setupMarkdownHandler();
		this.setupTranscribeHandler();
		if (this.elements.languageSelect)
		{
			this.elements.languageSelect.addEventListener('change', () =>
			{
				StorageService.save('selected_language', this.elements.languageSelect.value);
			});
		}
	}
	setupPromptHandlers()
	{
		if (!this.elements.promptSelect) return;
		this.elements.promptSelect.addEventListener('change', () =>
		{
			if (this.elements.customPromptContainer)
			{
				this.elements.customPromptContainer.style.display = this.elements.promptSelect.value === 'custom' ? 'block' : 'none';
			}
		});
		if (this.elements.savePromptBtn)
		{
			this.elements.savePromptBtn.addEventListener('click', () =>
			{
				const customPrompt = this.elements.customPromptInput?.value.trim();
				if (!customPrompt)
				{
					alert('Please enter a custom prompt before saving.');
					return;
				}
				const prompts = StorageService.load('prompts', []);
				prompts.push(customPrompt);
				StorageService.save('prompts', prompts);
				this.loadPrompts();
				if (this.elements.customPromptInput)
				{
					this.elements.customPromptInput.value = '';
				}
				alert('Custom prompt saved!');
			});
		}
	}
	setupMarkdownHandler()
	{
		if (!this.elements.renderMarkdownBtn) return;
		this.elements.renderMarkdownBtn.addEventListener('click', () =>
		{
			const sourceMarkdown = this.elements.sourceText?.value || '';
			const targetMarkdown = this.elements.targetText?.value || '';
			document.getElementById('leftColumn')
				.innerHTML = marked.parse(sourceMarkdown);
			document.getElementById('rightColumn')
				.innerHTML = marked.parse(targetMarkdown);
			this.elements.printContainer.innerHTML = marked.parse(targetMarkdown);
			this.renderMath();
		});
	}
	renderMath()
	{
		const selectedRenderer = StorageService.load('selected_renderer', 'katex');
		const elements = [
			document.getElementById('leftColumn'),
			document.getElementById('rightColumn'),
			this.elements.printContainer,
			this.elements.sourceText,
			this.elements.targetText
		];
		elements.forEach(element =>
		{
			if (element)
			{
				if (selectedRenderer === 'katex')
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
				else if (selectedRenderer === 'mathjax3')
				{
					MathJax.typesetPromise([element])
						.catch(err => console.error("MathJax typesetting error:", err));
				}
			}
		});
	}
	setupTranscribeHandler()
	{
		if (!this.elements.transcribeBtn) return;
		this.elements.transcribeBtn.addEventListener('click', async () =>
		{
			if (this.elements.transcribeBtn.dataset.transcribing === 'true')
			{
				if (this.state.transcribeAbortController)
				{
					this.state.transcribeAbortController.abort();
				}
				return;
			}
			try
			{
				const transcriptionModel = StorageService.load('selected_transcription_api_model', 'groq');
				const apiKey = StorageService.load(CONFIG.API.KEYS[transcriptionModel]);
				if (!apiKey)
				{
					throw new Error(`Please enter your ${transcriptionModel} API key.`);
				}
				const file = this.elements.audioFile?.files[0];
				if (!file)
				{
					throw new Error("Please select an audio file.");
				}
				const limits = CONFIG.LIMITS.TRANSCRIPTION.AUDIO[transcriptionModel];
				if (file.size / (1024 * 1024) > limits.size)
				{
					throw new Error(`Audio file exceeds the maximum size of ${limits.size}MB for ${transcriptionModel}.`);
				}
				UIState.setTranscribing(true, this.elements);
				this.state.transcribeAbortController = new AbortController();
				const selectedWhisperModel = StorageService.load(`${transcriptionModel}_whisper_model`, CONFIG.API.MODELS.TRANSCRIPTION[transcriptionModel].default);
				const result = await AiService.transcribe(file, this.elements.transcribeLanguage.value, apiKey, selectedWhisperModel, transcriptionModel, this.state.transcribeAbortController.signal);
				if (this.elements.sourceText)
				{
					this.elements.sourceText.value = result.text;
					TextService.updateStats(this.elements.sourceText, 'source');
					StorageService.save('sourceText', result.text);
				}
			}
			catch (error)
			{
				if (error.name !== 'AbortError')
				{
					console.error('Transcription error:', error);
					alert(error.message);
				}
			}
			finally
			{
				UIState.setTranscribing(false, this.elements);
				this.state.transcribeAbortController = null;
			}
		});
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
	setupErrorHandling()
	{
		window.onerror = (msg, url, lineNo, columnNo, error) =>
		{
			console.error('Global error:',
			{
				msg,
				url,
				lineNo,
				columnNo,
				error
			});
			alert('An unexpected error occurred. Please refresh the page and try again.');
			return false;
		};
		window.addEventListener('beforeunload', () =>
		{
			if (this.elements.sourceText)
			{
				StorageService.save('sourceText', this.elements.sourceText.value);
			}
			if (this.elements.targetText)
			{
				StorageService.save('targetText', this.elements.targetText.value);
			}
		});
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const app = new App();
	app.init()
		.catch(error =>
		{
			console.error('Application initialization error:', error);
		});
});