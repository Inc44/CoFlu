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
				groq: document.getElementById('groqModelContainer'),
				sambanova: document.getElementById('sambanovaModelContainer'),
				qwen: document.getElementById('qwenModelContainer')
			},
			modelSelects:
			{
				chatgpt: document.getElementById('chatgptModel'),
				claude: document.getElementById('claudeModel'),
				deepseek: document.getElementById('deepseekModel'),
				gemini: document.getElementById('geminiModel'),
				groq: document.getElementById('groqModel'),
				sambanova: document.getElementById('sambanovaModel'),
				qwen: document.getElementById('qwenModel')
			},
			settingsTextArea: document.getElementById('settingsTextArea'),
			saveSettingsBtn: document.getElementById('saveSettings'),
			reasoningEffortContainer: document.getElementById('reasoningEffortContainer'),
			reasoningEffortSelect: document.getElementById('reasoningEffort'),
			batchSizeInput: document.getElementById('batchSize'),
			batchRPMInput: document.getElementById('batchRPM'),
		};
	}
	init()
	{
		this.loadSettings();
		this.setupEventListeners();
		this.updateModelVisibility(this.elements.apiModelSelect.value);
	}
	loadSettings()
	{
		const savedModel = StorageService.load('selected_api_model', 'chatgpt');
		this.elements.apiModelSelect.value = savedModel;
		this.elements.apiKeyInput.value = StorageService.load(CONFIG.API.KEYS[savedModel], '');
		this.elements.streamingToggle.checked = StorageService.load('streaming_enabled', true);
		this.elements.cleanupToggle.checked = StorageService.load('cleanup_enabled', true);
		this.elements.darkToggle.checked = StorageService.load('dark_enabled', false);
		this.elements.numberedLinesToggle.checked = StorageService.load('numbered_lines_enabled', false);
		this.elements.wideToggle.checked = StorageService.load('wide_enabled', false);
		this.elements.rendererSelect.value = StorageService.load('selected_renderer', 'katex');
		if (this.elements.reasoningEffortSelect)
		{
			this.elements.reasoningEffortSelect.value = StorageService.load('reasoning_effort', 'low');
		}
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
					const savedModelValue = StorageService.load(`${provider}_model`, modelConfig.default);
					modelSelect.value = savedModelValue;
					const selectedModelDetails = modelConfig.options.find(m => m.name === savedModelValue);
					UIState.updateImageUploadVisibility(selectedModelDetails);
					UIState.updateVideoUploadVisibility(selectedModelDetails);
				}
			});
		this.elements.batchSizeInput.value = StorageService.load('translation_batch_size', 10);
		this.elements.batchRPMInput.value = StorageService.load('translation_batch_rpm', 0);
		this.updateModelVisibility(savedModel);
		this.updateApiKeyLabel(savedModel);
		UIState.updateTheme(this.elements.darkToggle.checked);
		UIState.updateLayout(this.elements.wideToggle.checked);
		this.displayCurrentSettings();
	}
	updateModelVisibility(selectedProvider)
	{
		Object.values(this.elements.modelContainers)
			.forEach(container =>
			{
				if (container)
				{
					container.classList.remove('active');
				}
			});
		const selectedContainer = this.elements.modelContainers[selectedProvider];
		if (selectedContainer)
		{
			selectedContainer.classList.add('active');
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
	}
	setupEventListeners()
	{
		this.elements.apiModelSelect.addEventListener('change', () =>
		{
			const selectedModel = this.elements.apiModelSelect.value;
			const selectedSubModel = this.elements.modelSelects[selectedModel].value;
			StorageService.save('selected_api_model', selectedModel);
			this.updateApiKeyLabel(selectedModel);
			this.elements.apiKeyInput.value = StorageService.load(CONFIG.API.KEYS[selectedModel], '');
			this.updateModelVisibility(selectedModel);
			const selectedModelDetails = CONFIG.API.MODELS[selectedModel]?.options.find(m => m.name === selectedSubModel);
			UIState.updateImageUploadVisibility(selectedModelDetails);
			UIState.updateVideoUploadVisibility(selectedModelDetails);
			if (selectedModelDetails && selectedModelDetails.reasoning_effort)
			{
				this.elements.reasoningEffortContainer.style.display = 'block';
			}
			else
			{
				this.elements.reasoningEffortContainer.style.display = 'none';
			}
		});
		if (this.elements.modelSelects)
		{
			Object.entries(this.elements.modelSelects)
				.forEach(([provider, select]) =>
				{
					if (select)
					{
						select.addEventListener('change', () =>
						{
							const selectedModel = this.elements.apiModelSelect ? this.elements.apiModelSelect.value : null;
							const selectedSubModel = select.value;
							StorageService.save(`${provider}_model`, selectedSubModel);
							let selectedModelDetails = selectedModel && CONFIG.API.MODELS[selectedModel] ? CONFIG.API.MODELS[selectedModel].options.find(m => m.name === selectedSubModel) : null;
							UIState.updateImageUploadVisibility(selectedModelDetails);
							UIState.updateVideoUploadVisibility(selectedModelDetails);
							const apiType = this.elements.apiModelSelect.value;
							selectedModelDetails = CONFIG.API.MODELS[apiType].options.find(m => m.name === select.value);
							if (selectedModelDetails && selectedModelDetails.reasoning_effort)
							{
								this.elements.reasoningEffortContainer.style.display = 'block';
							}
							else
							{
								this.elements.reasoningEffortContainer.style.display = 'none';
							}
						});
					}
				});
		}
		this.elements.apiKeyInput.addEventListener('change', () =>
		{
			const apiType = this.elements.apiModelSelect.value;
			const apiKey = this.elements.apiKeyInput.value.trim();
			StorageService.save(CONFIG.API.KEYS[apiType], apiKey);
		});
		this.elements.streamingToggle.addEventListener('change', () =>
		{
			StorageService.save('streaming_enabled', this.elements.streamingToggle.checked);
		});
		this.elements.cleanupToggle.addEventListener('change', () =>
		{
			StorageService.save('cleanup_enabled', this.elements.cleanupToggle.checked);
		});
		this.elements.darkToggle.addEventListener('change', () =>
		{
			UIState.updateTheme(this.elements.darkToggle.checked);
			StorageService.save('dark_enabled', this.elements.darkToggle.checked);
		});
		this.elements.numberedLinesToggle.addEventListener('change', () =>
		{
			StorageService.save('numbered_lines_enabled', this.elements.numberedLinesToggle.checked);
		});
		this.elements.wideToggle.addEventListener('change', () =>
		{
			UIState.updateLayout(this.elements.wideToggle.checked);
			StorageService.save('wide_enabled', this.elements.wideToggle.checked);
		});
		this.elements.rendererSelect.addEventListener('change', () =>
		{
			StorageService.save('selected_renderer', this.elements.rendererSelect.value);
		});
		Object.entries(this.elements.modelSelects)
			.forEach(([provider, select]) =>
			{
				select?.addEventListener('change', () =>
				{
					StorageService.save(`${provider}_model`, select.value);
				});
			});
		if (this.elements.reasoningEffortSelect)
		{
			this.elements.reasoningEffortSelect.addEventListener('change', () =>
			{
				StorageService.save('reasoning_effort', this.elements.reasoningEffortSelect.value);
			});
		}
		this.elements.importSettingsBtn.addEventListener('click', () => this.importSettings());
		this.elements.exportSettingsBtn.addEventListener('click', () => this.exportSettings());
		this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
		this.elements.batchSizeInput.addEventListener('change', () =>
		{
			let batchSize = parseInt(this.elements.batchSizeInput.value, 10);
			if (isNaN(batchSize) || batchSize < 1)
			{
				batchSize = 1;
			}
			else if (batchSize > 60000)
			{
				batchSize = 60000;
			}
			this.elements.batchSizeInput.value = batchSize;
			StorageService.save('translation_batch_size', batchSize);
		});
		this.elements.batchRPMInput.addEventListener('change', () =>
		{
			let rateLimit = parseInt(this.elements.batchRPMInput.value, 10);
			if (isNaN(rateLimit) || rateLimit < 0)
			{
				rateLimit = 0;
			}
			else if (rateLimit > 60000)
			{
				rateLimit = 60000;
			}
			this.elements.batchRPMInput.value = rateLimit;
			StorageService.save('translation_batch_rpm', rateLimit);
		});
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
			selected_api_model: StorageService.load('selected_api_model', 'chatgpt'),
			streaming_enabled: StorageService.load('streaming_enabled', true),
			cleanup_enabled: StorageService.load('cleanup_enabled', true),
			dark_enabled: StorageService.load('dark_enabled', false),
			numbered_lines_enabled: StorageService.load('numbered_lines_enabled', false),
			wide_enabled: StorageService.load('wide_enabled', false),
			selected_renderer: StorageService.load('selected_renderer', 'katex'),
			prompts: StorageService.load('prompts', []),
			selected_language: StorageService.load('selected_language', 'en'),
			transcribe_language: StorageService.load('transcribe_language', 'en'),
			translation_enabled: StorageService.load('translation_enabled', false),
			translation_batch_size: StorageService.load('translation_batch_size', 10),
			translation_batch_rpm: StorageService.load('translation_batch_rpm', 0),
		};
		if (this.elements.reasoningEffortSelect)
		{
			settings.reasoning_effort = StorageService.load('reasoning_effort', 'low');
		}
		Object.entries(CONFIG.API.KEYS)
			.forEach(([provider, key]) =>
			{
				settings[key] = StorageService.load(key, '');
			});
		Object.entries(CONFIG.API.MODELS)
			.forEach(([provider, modelConfig]) =>
			{
				settings[`${provider}_model`] = StorageService.load(`${provider}_model`, modelConfig.default);
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
		this.elements.settingsTextArea.value = settingsJSON;
		const blob = new Blob([settingsJSON],
		{
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'CoFlu.json';
		a.click();
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
						const settings = JSON.parse(e.target.result);
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
						alert('Error importing settings. Please check the file format.');
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
			const settings = JSON.parse(this.elements.settingsTextArea.value);
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
			alert('Error saving settings. Please check the JSON format.');
		}
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const settingsApp = new SettingsApp();
	settingsApp.init();
});