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
				groq: document.getElementById('groqModelContainer')
			},
			modelSelects:
			{
				chatgpt: document.getElementById('chatgptModel'),
				claude: document.getElementById('claudeModel'),
				deepseek: document.getElementById('deepseekModel'),
				gemini: document.getElementById('geminiModel'),
				groq: document.getElementById('groqModel')
			}
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
				}
			});
		this.updateModelVisibility(savedModel);
		this.updateApiKeyLabel(savedModel);
		UIState.updateTheme(this.elements.darkToggle.checked);
		UIState.updateLayout(this.elements.wideToggle.checked);
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
							const selectedModelDetails = selectedModel && CONFIG.API.MODELS[selectedModel] ? CONFIG.API.MODELS[selectedModel].options.find(m => m.name === selectedSubModel) : null;
							UIState.updateImageUploadVisibility(selectedModelDetails);
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
		this.elements.importSettingsBtn.addEventListener('click', () => this.importSettings());
		this.elements.exportSettingsBtn.addEventListener('click', () => this.exportSettings());
	}
	updateApiKeyLabel(model)
	{
		const apiKeyLabel = document.querySelector('label[for="apiKey"]');
		if (apiKeyLabel)
		{
			apiKeyLabel.textContent = CONFIG.UI.API_KEY_LABELS[model] || 'API Key:';
		}
	}
	exportSettings()
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
			translation_enabled: StorageService.load('translation_enabled', false)
		};
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
		const settingsJSON = JSON.stringify(settings, null, 2);
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
}
document.addEventListener('DOMContentLoaded', () =>
{
	const settingsApp = new SettingsApp();
	settingsApp.init();
});