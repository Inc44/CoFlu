// settings.js
class SettingsApp
{
	constructor()
	{
		this.elements = this.getElements();
	}
	getElements()
	{
		return {
			apiModelSelect: document.getElementById('apiModel'),
			apiKeyInput: document.getElementById('apiKey'),
			streamingToggle: document.getElementById('streamingToggle'),
			cleanupToggle: document.getElementById('cleanupToggle'),
			rendererSelect: document.getElementById('renderer'),
			darkToggle: document.getElementById('darkToggle'),
			numberedLinesToggle: document.getElementById('numberedLinesToggle'),
			wideToggle: document.getElementById('wideToggle'),
			importSettingsBtn: document.getElementById('importSettings'),
			exportSettingsBtn: document.getElementById('exportSettings'),
			modelContainers:
			{
				chatgpt: document.getElementById('chatgptModelContainer'),
				claude: document.getElementById('claudeModelContainer'),
				deepseek: document.getElementById('deepseekModelContainer'),
				gemini: document.getElementById('geminiModelContainer'),
				grok: document.getElementById('grokModelContainer'),
				groq: document.getElementById('groqModelContainer'),
				qwen: document.getElementById('qwenModelContainer'),
				sambanova: document.getElementById('sambanovaModelContainer')
			},
			modelSelects:
			{
				chatgpt: document.getElementById('chatgptModel'),
				claude: document.getElementById('claudeModel'),
				deepseek: document.getElementById('deepseekModel'),
				gemini: document.getElementById('geminiModel'),
				grok: document.getElementById('grokModel'),
				groq: document.getElementById('groqModel'),
				qwen: document.getElementById('qwenModel'),
				sambanova: document.getElementById('sambanovaModel')
			},
			settingsTextArea: document.getElementById('settingsTextArea'),
			saveSettingsBtn: document.getElementById('saveSettings'),
			reasoningEffortContainer: document.getElementById('reasoningEffortContainer'),
			reasoningEffortSelect: document.getElementById('reasoningEffort'),
			thinkingBudgetContainer: document.getElementById('thinkingBudgetContainer'),
			thinkingBudgetRange: document.getElementById('thinkingBudgetRange'),
			thinkingBudgetNumber: document.getElementById('thinkingBudgetNumber'),
			languageSelect: document.getElementById('language'),
			batchSizeInput: document.getElementById('batchSize'),
			batchRPMInput: document.getElementById('batchRPM'),
			exponentialRetryInput: document.getElementById('exponentialRetry')
		};
	}
	init()
	{
		this.loadSettings();
		this.setupEventListeners();
		this.updateModelVisibility(this.elements.apiModelSelect.value);
		this.updateThemeAndLayout();
		this.syncThinkingBudgetInputs();
	}
	updateThemeAndLayout()
	{
		UIState.updateTheme(this.elements.darkToggle.checked);
		UIState.updateLayout(this.elements.wideToggle.checked);
	}
	loadSettings()
	{
		this.loadSelectSetting('apiModelSelect', 'selected_api_model', 'chatgpt');
		this.loadInputSetting('apiKeyInput', CONFIG.API.KEYS[this.elements.apiModelSelect.value] || '', this.elements.apiModelSelect.value);
		this.loadCheckboxSetting('streamingToggle', 'streaming_enabled', true);
		this.loadCheckboxSetting('cleanupToggle', 'cleanup_enabled', true);
		this.loadCheckboxSetting('darkToggle', 'dark_enabled', true);
		this.loadCheckboxSetting('numberedLinesToggle', 'numbered_lines_enabled', false);
		this.loadCheckboxSetting('wideToggle', 'wide_enabled', false);
		this.loadSelectSetting('rendererSelect', 'selected_renderer', 'katex');
		if (this.elements.reasoningEffortSelect)
		{
			this.loadSelectSetting('reasoningEffortSelect', 'reasoning_effort', 'low');
		}
		const thinkingBudget = parseInt(StorageService.load('thinking', 0), 10);
		this.elements.thinkingBudgetRange.value = thinkingBudget;
		this.elements.thinkingBudgetNumber.value = thinkingBudget;
		this.loadModelOptions();
		this.loadInputSetting('languageSelect', 'selected_language', 'English');
		this.loadInputSetting('batchSizeInput', 'translation_batch_size', 10, 'number');
		this.loadInputSetting('batchRPMInput', 'translation_batch_rpm', 0, 'number');
		this.loadInputSetting('exponentialRetryInput', 'exponential_retry', 10, 'number');
		this.updateModelVisibility(this.elements.apiModelSelect.value);
		this.updateApiKeyLabel(this.elements.apiModelSelect.value);
		this.displayCurrentSettings();
		this.syncThinkingBudgetInputs();
	}
	loadSelectSetting(elementKey, storageKey, defaultValue)
	{
		if (this.elements[elementKey])
		{
			this.elements[elementKey].value = StorageService.load(storageKey, defaultValue);
		}
	}
	loadInputSetting(elementKey, storageKey, defaultValue, type = 'text')
	{
		if (this.elements[elementKey])
		{
			let value = StorageService.load(storageKey, defaultValue);
			if (type === 'number')
			{
				value = parseInt(value, 10);
				if (isNaN(value))
				{
					value = defaultValue
				}
			}
			this.elements[elementKey].value = value;
		}
	}
	loadCheckboxSetting(elementKey, storageKey, defaultValue)
	{
		if (this.elements[elementKey])
		{
			this.elements[elementKey].checked = StorageService.load(storageKey, defaultValue);
		}
	}
	loadModelOptions()
	{
		Object.entries(CONFIG.API.MODELS)
			.forEach(([provider, modelConfig]) =>
			{
				const modelSelect = this.elements.modelSelects[provider];
				if (modelSelect)
				{
					modelSelect.innerHTML = '';
					modelConfig.options.forEach(model =>
					{
						const option = document.createElement('option');
						option.value = model.name;
						option.textContent = model.name;
						modelSelect.appendChild(option);
					});
					modelSelect.value = StorageService.load(`${provider}_model`, modelConfig.default);
				}
			});
	}
	updateModelVisibility(selectedProvider)
	{
		Object.values(this.elements.modelContainers)
			.forEach(container =>
			{
				container?.classList.remove('active');
			});
		const selectedContainer = this.elements.modelContainers[selectedProvider];
		if (selectedContainer)
		{
			selectedContainer.classList.add('active');
			this.updateReasoningEffortVisibility(selectedProvider);
			this.updateThinkingBudgetVisibility(selectedProvider)
		}
	}
	updateReasoningEffortVisibility(selectedProvider)
	{
		const modelSelect = this.elements.modelSelects[selectedProvider];
		const selectedModelName = modelSelect ? modelSelect.value : null;
		const selectedModelDetails = CONFIG.API.MODELS[selectedProvider]?.options.find(m => m.name === selectedModelName);
		if (selectedModelDetails && selectedModelDetails.reasoning_effort)
		{
			this.elements.reasoningEffortContainer.style.display = 'block';
		}
		else
		{
			this.elements.reasoningEffortContainer.style.display = 'none';
		}
	}
	updateThinkingBudgetVisibility(selectedProvider)
	{
		const modelSelect = this.elements.modelSelects[selectedProvider];
		const selectedModelName = modelSelect ? modelSelect.value : null;
		const selectedModelDetails = CONFIG.API.MODELS[selectedProvider]?.options.find(m => m.name === selectedModelName);
		if (selectedModelDetails && selectedModelDetails.thinking)
		{
			this.elements.thinkingBudgetContainer.style.display = 'block';
		}
		else
		{
			this.elements.thinkingBudgetContainer.style.display = 'none';
		}
	}
	setupEventListeners()
	{
		this.elements.apiModelSelect?.addEventListener('change', this.handleApiModelChange.bind(this));
		this.elements.apiKeyInput?.addEventListener('change', this.handleApiKeyChange.bind(this));
		this.elements.streamingToggle?.addEventListener('change', this.handleToggleChange.bind(this, 'streamingToggle', 'streaming_enabled'));
		this.elements.cleanupToggle?.addEventListener('change', this.handleToggleChange.bind(this, 'cleanupToggle', 'cleanup_enabled'));
		this.elements.darkToggle?.addEventListener('change', this.handleDarkToggleChange.bind(this));
		this.elements.numberedLinesToggle?.addEventListener('change', this.handleToggleChange.bind(this, 'numberedLinesToggle', 'numbered_lines_enabled'));
		this.elements.wideToggle?.addEventListener('change', this.handleWideToggleChange.bind(this));
		this.elements.rendererSelect?.addEventListener('change', this.handleRendererChange.bind(this));
		this.elements.reasoningEffortSelect?.addEventListener('change', this.handleReasoningEffortChange.bind(this));
		this.elements.thinkingBudgetRange?.addEventListener('input', () =>
		{
			this.elements.thinkingBudgetNumber.value = this.elements.thinkingBudgetRange.value;
			this.handleThinkingBudgetChange();
		});
		this.elements.thinkingBudgetNumber?.addEventListener('input', () =>
		{
			this.elements.thinkingBudgetRange.value = this.elements.thinkingBudgetNumber.value;
			this.handleThinkingBudgetChange();
		});
		this.elements.importSettingsBtn?.addEventListener('click', this.importSettings.bind(this));
		this.elements.exportSettingsBtn?.addEventListener('click', this.exportSettings.bind(this));
		this.elements.saveSettingsBtn?.addEventListener('click', this.saveSettings.bind(this));
		this.elements.languageSelect?.addEventListener('change', this.handleLanguageChange.bind(this));
		this.elements.batchSizeInput?.addEventListener('change', this.handleNumericInputChange.bind(this, 'batchSizeInput', 'translation_batch_size', 1, 60000));
		this.elements.batchRPMInput?.addEventListener('change', this.handleNumericInputChange.bind(this, 'batchRPMInput', 'translation_batch_rpm', 0, 60000));
		this.elements.exponentialRetryInput?.addEventListener('change', this.handleNumericInputChange.bind(this, 'exponentialRetryInput', 'exponential_retry', 0));
		Object.entries(this.elements.modelSelects)
			.forEach(([provider, select]) =>
			{
				select?.addEventListener('change', () =>
				{
					const selectedSubModel = select.value;
					StorageService.save(`${provider}_model`, selectedSubModel);
					this.updateReasoningEffortVisibility(provider);
					this.updateThinkingBudgetVisibility(provider);
				});
			});
	}
	handleApiModelChange()
	{
		const selectedModel = this.elements.apiModelSelect.value;
		StorageService.save('selected_api_model', selectedModel);
		this.updateApiKeyLabel(selectedModel);
		this.updateModelVisibility(selectedModel);
		this.elements.apiKeyInput.value = StorageService.load(CONFIG.API.KEYS[selectedModel] || '', '');
	}
	handleApiKeyChange()
	{
		const apiType = this.elements.apiModelSelect.value;
		const apiKey = this.elements.apiKeyInput.value.trim();
		StorageService.save(CONFIG.API.KEYS[apiType], apiKey);
	}
	handleToggleChange(elementKey, storageKey)
	{
		StorageService.save(storageKey, this.elements[elementKey].checked);
	}
	handleDarkToggleChange()
	{
		const isDarkMode = this.elements.darkToggle.checked;
		UIState.updateTheme(isDarkMode);
		StorageService.save('dark_enabled', isDarkMode);
	}
	handleWideToggleChange()
	{
		const isWide = this.elements.wideToggle.checked;
		UIState.updateLayout(isWide);
		StorageService.save('wide_enabled', isWide);
	}
	handleRendererChange()
	{
		StorageService.save('selected_renderer', this.elements.rendererSelect.value);
	}
	handleReasoningEffortChange()
	{
		StorageService.save('reasoning_effort', this.elements.reasoningEffortSelect.value);
	}
	handleThinkingBudgetChange()
	{
		const value = parseInt(this.elements.thinkingBudgetNumber.value, 10);
		StorageService.save('thinking', value);
	}
	handleLanguageChange()
	{
		StorageService.save('selected_language', this.elements.languageSelect.value);
	}
	handleNumericInputChange(elementKey, storageKey, min = null, max = null)
	{
		let value = parseInt(this.elements[elementKey].value, 10);
		if (isNaN(value))
		{
			value = StorageService.load(storageKey, 0);
		}
		if (min !== null && value < min)
		{
			value = min;
		}
		if (max !== null && value > max)
		{
			value = max;
		}
		this.elements[elementKey].value = value;
		StorageService.save(storageKey, value);
	}
	updateApiKeyLabel(model)
	{
		const apiKeyLabel = document.querySelector('label[for="apiKey"]');
		if (apiKeyLabel)
		{
			apiKeyLabel.textContent = CONFIG.UI.API_KEY_LABELS[model] || 'API Key:';
		}
	}
	getCurrentSettings()
	{
		const settings = {
			selected_api_model: this.elements.apiModelSelect.value,
			streaming_enabled: this.elements.streamingToggle.checked,
			cleanup_enabled: this.elements.cleanupToggle.checked,
			dark_enabled: this.elements.darkToggle.checked,
			numbered_lines_enabled: this.elements.numberedLinesToggle.checked,
			wide_enabled: this.elements.wideToggle.checked,
			selected_renderer: this.elements.rendererSelect.value,
			prompts: StorageService.load('prompts', []),
			selected_language: this.elements.languageSelect.value,
			transcribe_language: StorageService.load('transcribe_language', 'en'),
			translation_enabled: StorageService.load('translation_enabled', false),
			translation_batch_size: parseInt(this.elements.batchSizeInput.value, 10),
			translation_batch_rpm: parseInt(this.elements.batchRPMInput.value, 10),
			exponential_retry: parseInt(this.elements.exponentialRetryInput.value, 10),
			thinking: parseInt(this.elements.thinkingBudgetNumber.value, 10)
		};
		if (this.elements.reasoningEffortSelect)
		{
			settings.reasoning_effort = this.elements.reasoningEffortSelect.value;
		}
		Object.entries(CONFIG.API.KEYS)
			.forEach(([provider, key]) =>
			{
				settings[key] = StorageService.load(key, '');
			});
		Object.entries(CONFIG.API.MODELS)
			.forEach(([provider, modelConfig]) =>
			{
				settings[`${provider}_model`] = this.elements.modelSelects[provider].value;
			});
		return settings;
	}
	displayCurrentSettings()
	{
		const settings = this.getCurrentSettings();
		this.elements.settingsTextArea.value = JSON.stringify(settings, null, 2);
	}
	exportSettings()
	{
		const settings = this.getCurrentSettings();
		const settingsJSON = JSON.stringify(settings, null, 2);
		const blob = new Blob([settingsJSON],
		{
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'CoFlu.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
	importSettings()
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
						let settings = e.target.result;
						if (!settings.trim() || settings.trim() === '{}')
						{
							this.clearAllData();
							alert('Data wiped successfully!');
							this.loadSettings();
							return;
						}
						settings = JSON.parse(settings);
						if (typeof settings !== 'object' || settings === null)
						{
							throw new Error('Invalid settings file: Not a JSON object.');
						}
						this.elements.settingsTextArea.value = JSON.stringify(settings, null, 2);
						Object.entries(settings)
							.forEach(([key, value]) =>
							{
								StorageService.save(key, value);
							});
						this.loadSettings();
						alert('Settings imported successfully!');
					}
					catch (error)
					{
						console.error('Error importing settings:', error);
						alert(`Error importing settings: ${error.message}`);
					}
				};
				reader.readAsText(file);
			}
		});
		input.click();
	}
	saveSettings()
	{
		try
		{
			let settingsText = this.elements.settingsTextArea.value;
			if (!settingsText.trim() || settingsText.trim() === '{}')
			{
				this.clearAllData();
				alert('Data wiped successfully!');
				this.loadSettings();
				return;
			}
			const settings = JSON.parse(this.elements.settingsTextArea.value);
			if (typeof settings !== 'object' || settings === null)
			{
				throw new Error('Invalid settings: Not a JSON object.');
			}
			Object.entries(settings)
				.forEach(([key, value]) =>
				{
					StorageService.save(key, value);
				});
			this.loadSettings();
			alert('Settings saved successfully!');
		}
		catch (error)
		{
			console.error('Error saving settings:', error);
			alert(`Error saving settings: ${error.message}`);
		}
	}
	clearAllData()
	{
		localStorage.clear();
	}
	syncThinkingBudgetInputs()
	{
		this.elements.thinkingBudgetNumber.value = this.elements.thinkingBudgetRange.value;
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const settingsApp = new SettingsApp();
	settingsApp.init();
});