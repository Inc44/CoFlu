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
			wideToggle: document.getElementById('wideToggle')
		};
	}
	init()
	{
		this.loadSettings();
		this.setupEventListeners();
	}
	loadSettings()
	{
		const savedModel = StorageService.load('selected_api_model', 'chatgpt');
		this.elements.apiModelSelect.value = savedModel;
		this.elements.apiKeyInput.value = StorageService.load(CONFIG.API.KEYS[savedModel], '');
		this.elements.streamingToggle.checked = StorageService.load('streaming_enabled', true);
		this.elements.cleanupToggle.checked = StorageService.load('cleanup_enabled', true);
		this.elements.darkToggle.checked = StorageService.load('dark_enabled', false);
		this.elements.wideToggle.checked = StorageService.load('wide_enabled', false);
		this.elements.rendererSelect.value = StorageService.load('selected_renderer', 'katex');
		this.updateApiKeyLabel(savedModel);
		UIState.updateTheme(this.elements.darkToggle.checked);
		UIState.updateLayout(this.elements.wideToggle.checked);
	}
	setupEventListeners()
	{
		this.elements.apiModelSelect.addEventListener('change', () =>
		{
			const selectedModel = this.elements.apiModelSelect.value;
			StorageService.save('selected_api_model', selectedModel);
			this.updateApiKeyLabel(selectedModel);
			this.elements.apiKeyInput.value = StorageService.load(CONFIG.API.KEYS[selectedModel], '');
		});
		this.elements.apiKeyInput.addEventListener('change', () =>
		{
			const apiType = this.elements.apiModelSelect.value;
			const apiKey = this.elements.apiKeyInput.value.trim();
			StorageService.save(CONFIG.API.KEYS[apiType], apiKey);
			const isValid = ApiService.validateKey(apiKey, apiType);
			this.elements.apiKeyInput.classList.toggle('invalid', !isValid);
			if (!isValid && apiKey)
			{
				console.warn('API key format may be invalid');
			}
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
		});
		this.elements.wideToggle.addEventListener('change', () =>
		{
			UIState.updateLayout(this.elements.wideToggle.checked);
		});
		this.elements.rendererSelect.addEventListener('change', () =>
		{
			StorageService.save('selected_renderer', this.elements.rendererSelect.value);
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