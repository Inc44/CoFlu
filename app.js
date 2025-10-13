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
			this.els.langSelect.value = StorageService.load('selected_language', 'English');
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
		this.loadPrompts();
	}
	loadPrompts()
	{
		if (!this.els.promptSelect) return;
		const savedPrompts = StorageService.load('prompts', []);
		this.els.promptSelect.innerHTML = '';
		CONFIG.UI.STANDARD_PROMPTS.forEach(prompt =>
		{
			const option = document.createElement('option');
			option.value = prompt;
			option.textContent = prompt;
			this.els.promptSelect.appendChild(option);
		});
		savedPrompts.forEach((prompt, i) =>
		{
			const option = document.createElement('option');
			option.value = prompt;
			option.textContent = `Custom ${i+1}: ${prompt.substring(0, 30)}...`;
			option.dataset.customIndex = i;
			this.els.promptSelect.appendChild(option);
		});
		const customOption = document.createElement('option');
		customOption.value = 'custom';
		customOption.textContent = 'Custom prompt';
		this.els.promptSelect.appendChild(customOption);
		if (this.els.customPromptBox)
		{
			const selectedOption = this.els.promptSelect.options[this.els.promptSelect.selectedIndex];
			const isSavedCustom = selectedOption && selectedOption.dataset && selectedOption.dataset.customIndex !== undefined;
			this.els.customPromptBox.style.display = (this.els.promptSelect.value === 'custom' || isSavedCustom) ? 'block' : 'none';
			if (isSavedCustom && this.els.customPrompt)
			{
				this.els.customPrompt.value = this.els.promptSelect.value || '';
			}
		}
		if (this.els.deletePromptBtn)
		{
			const selectedOption = this.els.promptSelect.options[this.els.promptSelect.selectedIndex];
			const isSavedCustom = selectedOption && selectedOption.dataset && selectedOption.dataset.customIndex !== undefined;
			this.els.deletePromptBtn.disabled = !isSavedCustom;
		}
	}
	setupEvents()
	{
		UIHandlers.setupCompareButton(this.els);
		UIHandlers.setupSwitchButton(this.els);
		UIHandlers.setupGenerateButton(this.els, this.state);
		this.setupPromptEvents();
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
	setupPromptEvents()
	{
		if (!this.els.promptSelect) return;
		this.els.promptSelect.addEventListener('change', () =>
		{
			const selectedOption = this.els.promptSelect.options[this.els.promptSelect.selectedIndex];
			const isSavedCustom = selectedOption && selectedOption.dataset && selectedOption.dataset.customIndex !== undefined;
			if (this.els.customPromptBox)
			{
				this.els.customPromptBox.style.display = (this.els.promptSelect.value === 'custom' || isSavedCustom) ? 'block' : 'none';
			}
			if (this.els.customPrompt)
			{
				if (this.els.promptSelect.value === 'custom')
				{
					this.els.customPrompt.value = '';
				}
				else if (isSavedCustom)
				{
					this.els.customPrompt.value = this.els.promptSelect.value;
				}
			}
			if (this.els.deletePromptBtn)
			{
				this.els.deletePromptBtn.disabled = !isSavedCustom;
			}
		});
		if (this.els.savePromptBtn)
		{
			this.els.savePromptBtn.addEventListener('click', () =>
			{
				const text = this.els.customPrompt?.value.trim();
				if (!text)
				{
					alert('Please enter a custom prompt before saving.');
					return;
				}
				const prompts = StorageService.load('prompts', []);
				const selectedOption = this.els.promptSelect.options[this.els.promptSelect.selectedIndex];
				const idxStr = selectedOption?.dataset?.customIndex;
				if (idxStr !== undefined)
				{
					const idx = parseInt(idxStr, 10);
					if (!isNaN(idx) && idx >= 0 && idx < prompts.length)
					{
						prompts[idx] = text;
					}
					else
					{
						prompts.push(text);
					}
				}
				else
				{
					prompts.push(text);
				}
				StorageService.save('prompts', prompts);
				this.loadPrompts();
				if (this.els.customPrompt)
				{
					this.els.customPrompt.value = '';
				}
				if (this.els.promptSelect)
				{
					this.els.promptSelect.value = 'custom';
					this.els.promptSelect.dispatchEvent(new Event('change'));
				}
				alert('Custom prompt saved!');
			});
		}
		if (this.els.deletePromptBtn)
		{
			this.els.deletePromptBtn.addEventListener('click', () =>
			{
				const prompts = StorageService.load('prompts', []);
				const selectedOption = this.els.promptSelect.options[this.els.promptSelect.selectedIndex];
				const idxStr = selectedOption?.dataset?.customIndex;
				if (idxStr === undefined)
				{
					alert('Please select a saved custom prompt to delete.');
					return;
				}
				const idx = parseInt(idxStr, 10);
				if (isNaN(idx) || idx < 0 || idx >= prompts.length)
				{
					alert('Invalid custom prompt selection.');
					return;
				}
				prompts.splice(idx, 1);
				StorageService.save('prompts', prompts);
				this.loadPrompts();
				if (this.els.customPrompt)
				{
					this.els.customPrompt.value = '';
				}
				if (this.els.promptSelect)
				{
					this.els.promptSelect.value = 'custom';
					this.els.promptSelect.dispatchEvent(new Event('change'));
				}
				alert('Custom prompt deleted!');
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
		const hasKatex = typeof katex !== 'undefined' && typeof renderMathInElement === 'function';
		const hasMathJax = typeof MathJax !== 'undefined' && MathJax && typeof MathJax.typesetPromise === 'function';
		const elements = [
			document.getElementById('leftColumn'),
			document.getElementById('rightColumn'),
			this.els.printBox,
			this.els.sourceText,
			this.els.targetText
		];
		elements.forEach(el =>
		{
			if (!el) return;
			if (renderer === 'katex')
			{
				if (!hasKatex) return;
				renderMathInElement(el,
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
			else if (renderer === 'mathjax4')
			{
				if (!hasMathJax) return;
				MathJax.typesetPromise([el]);
			}
		});
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
			if (file.size / (1024 * 1024) > limits.size)
			{
				alert(`Audio file exceeds the maximum size of ${limits.size}MB for ${transModel}.`);
				return;
			}
			UIState.setTranscribing(true, this.els);
			this.state.transcribeAbortCtrl = new AbortController();
			const whisperModel = StorageService.load(`${transModel}_whisper_model`, CONFIG.API.MODELS.TRANSCRIPTION[transModel].default);
			const result = await AiService.transcribe(file, this.els.transcribeLang.value, apiKey, whisperModel, transModel, this.state.transcribeAbortCtrl.signal);
			if (this.els.sourceText && result?.text !== undefined)
			{
				this.els.sourceText.value = result.text;
				TextService.updateStats(this.els.sourceText, 'source');
				StorageService.save('sourceText', result.text);
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