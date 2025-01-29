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
				}
			});
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
			StorageService.save('selected_api_model', selectedModel);
			this.updateApiKeyLabel(selectedModel);
			this.elements.apiKeyInput.value = StorageService.load(CONFIG.API.KEYS[selectedModel], '');
			this.updateModelVisibility(selectedModel);
		});
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
	}
	updateApiKeyLabel(model)
	{
		const apiKeyLabel = document.querySelector('label[for="apiKey"]');
		if (apiKeyLabel)
		{
			apiKeyLabel.textContent = CONFIG.UI.API_KEY_LABELS[model] || 'API Key:';
		}
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const settingsApp = new SettingsApp();
	settingsApp.init();
});