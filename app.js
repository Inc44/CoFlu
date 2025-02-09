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
	}
	getElements()
	{
		return {
			sourceText: document.getElementById('sourceText'),
			targetText: document.getElementById('targetText'),
			compareBtn: document.getElementById('compareBtn'),
			switchBtn: document.getElementById('switchBtn'),
			generateTargetBtn: document.getElementById('generateTarget'),
			renderMarkdownBtn: document.getElementById('renderMarkdownBtn'),
			apiModelSelect: document.getElementById('apiModel'),
			promptSelect: document.getElementById('promptSelect'),
			customPromptContainer: document.getElementById('customPromptContainer'),
			customPromptInput: document.getElementById('customPrompt'),
			savePromptBtn: document.getElementById('savePrompt'),
			transcribeLanguage: document.getElementById('transcribeLanguage'),
			audioFile: document.getElementById('audioFile'),
			transcribeBtn: document.getElementById('transcribeBtn'),
			translationToggle: document.getElementById('translationToggle'),
			languageSelect: document.getElementById('language'),
			imageUploadInput: document.getElementById('imageUploadInput'),
			videoUploadInput: document.getElementById('videoUploadInput'),
			printContainer: document.getElementById('printContainer'),
			streamingToggle: document.getElementById('streamingToggle'),
			cleanupToggle: document.getElementById('cleanupToggle'),
			wideToggle: document.getElementById('wideToggle'),
			wpmContainer: document.getElementById('wpm-container'),
			wpmDisplay: document.getElementById('wpm')
		};
	}
	async init()
	{
		try
		{
			await this.initializeComponents();
			this.loadSavedSettings();
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
		const savedModel = StorageService.load('selected_api_model', 'chatgpt');
		if (this.elements.apiModelSelect)
		{
			this.elements.apiModelSelect.value = savedModel;
		}
		const toggleSettings = {
			'translationToggle': ['translation_enabled', false],
			'streamingToggle': ['streaming_enabled', true],
			'cleanupToggle': ['cleanup_enabled', true],
			'wideToggle': ['wide_enabled', false]
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
		const isWideMode = StorageService.load('wide_enabled') === true;
		const contentElement = document.getElementById('content');
		if (contentElement)
		{
			contentElement.classList.toggle('wide', isWideMode);
		}
		if (this.elements.wideToggle)
		{
			this.elements.wideToggle.checked = isWideMode;
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
		if (this.elements.wideToggle)
		{
			this.elements.wideToggle.addEventListener('change', (e) =>
			{
				const isWide = e.target.checked;
				UIState.updateLayout(isWide);
				StorageService.save('wide_enabled', isWide);
			});
		}
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
			const selectedRenderer = StorageService.load('selected_renderer', 'katex');
			if (selectedRenderer === 'katex')
			{
				this.renderMathWithKatex();
			}
			else if (selectedRenderer === 'mathjax3')
			{
				MathJax.typesetPromise();
			}
		});
	}
	renderMathWithKatex()
	{
		const elements = [
			document.getElementById('leftColumn'),
			document.getElementById('rightColumn'),
			this.elements.printContainer
		];
		elements.forEach(element =>
		{
			if (element)
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
						left: '\\[',
						right: '\\]',
						display: true
					},
					{
						left: '\\(',
						right: '\\)',
						display: false
					}],
					throwOnError: false,
					trust: true,
					strict: false
				});
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
				const apiKey = StorageService.load(CONFIG.API.KEYS.groq);
				if (!apiKey)
				{
					throw new Error("Please enter your Groq API key.");
				}
				const file = this.elements.audioFile?.files[0];
				if (!file)
				{
					throw new Error("Please select an audio file.");
				}
				UIState.setTranscribing(true, this.elements);
				this.state.transcribeAbortController = new AbortController();
				const result = await AiService.transcribe(file, this.elements.transcribeLanguage.value, apiKey);
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
			const currentModelDetails = CONFIG.API.MODELS[currentModel]?.options.find(m => m.name === StorageService.load(`${currentModel}_model`, CONFIG.API.MODELS[currentModel].default));
			if (currentModelDetails)
			{
				UIState.updateImageUploadVisibility(currentModelDetails);
				UIState.updateVideoUploadVisibility(currentModelDetails);
			}
		}
		const isWideMode = StorageService.load('wide_enabled') === true;
		UIState.updateLayout(isWideMode);
		if (this.elements.customPromptContainer && this.elements.promptSelect)
		{
			this.elements.customPromptContainer.style.display = this.elements.promptSelect.value === 'custom' ? 'block' : 'none';
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