// settings.js
class SettingsApp
{
	constructor()
	{
		this.els = this.getElements();
	}
	getElements()
	{
		return {
			apiKey: document.getElementById('apiKey'),
			apiModel: document.getElementById('apiModel'),
			batchRPM: document.getElementById('batchRPM'),
			batchSize: document.getElementById('batchSize'),
			cleanupToggle: document.getElementById('cleanupToggle'),
			darkToggle: document.getElementById('darkToggle'),
			expRetry: document.getElementById('exponentialRetry'),
			exportBtn: document.getElementById('exportSettings'),
			highCostToggle: document.getElementById('highCostToggle'),
			importBtn: document.getElementById('importSettings'),
			langSelect: document.getElementById('language'),
			noBSToggle: document.getElementById('noBSToggle'),
			numberedLinesToggle: document.getElementById('numberedLinesToggle'),
			reasoningBox: document.getElementById('reasoningEffortContainer'),
			reasoningEffort: document.getElementById('reasoningEffort'),
			rendererSelect: document.getElementById('renderer'),
			saveBtn: document.getElementById('saveSettings'),
			settingsText: document.getElementById('settingsTextArea'),
			streamToggle: document.getElementById('streamingToggle'),
			thinkingBox: document.getElementById('thinkingBudgetContainer'),
			thinkingNum: document.getElementById('thinkingBudgetNumber'),
			thinkingRange: document.getElementById('thinkingBudgetRange'),
			transcribeLang: document.getElementById('transcribeLanguage'),
			transcribeModel: document.getElementById('transcriptionApiModel'),
			wideToggle: document.getElementById('wideToggle'),
			whisperBoxes:
			{
				openai: document.getElementById('openaiWhisperModelContainer'),
				groq: document.getElementById('groqWhisperModelContainer'),
			},
			whisperModels:
			{
				openai: document.getElementById('openaiWhisperModel'),
				groq: document.getElementById('groqWhisperModel'),
			},
			modelBoxes:
			{
				openai: document.getElementById('openaiModelContainer'),
				anthropic: document.getElementById('anthropicModelContainer'),
				deepseek: document.getElementById('deepseekModelContainer'),
				google: document.getElementById('googleModelContainer'),
				x: document.getElementById('xModelContainer'),
				groq: document.getElementById('groqModelContainer'),
				lambda: document.getElementById('lambdaModelContainer'),
				openrouter: document.getElementById('openrouterModelContainer'),
				alibaba: document.getElementById('alibabaModelContainer'),
				sambanova: document.getElementById('sambanovaModelContainer'),
				together: document.getElementById('togetherModelContainer')
			},
			modelSelects:
			{
				openai: document.getElementById('openaiModel'),
				anthropic: document.getElementById('anthropicModel'),
				deepseek: document.getElementById('deepseekModel'),
				google: document.getElementById('googleModel'),
				x: document.getElementById('xModel'),
				groq: document.getElementById('groqModel'),
				lambda: document.getElementById('lambdaModel'),
				openrouter: document.getElementById('openrouterModel'),
				alibaba: document.getElementById('alibabaModel'),
				sambanova: document.getElementById('sambanovaModel'),
				together: document.getElementById('togetherModel')
			},
		};
	}
	init()
	{
		this.loadSettings();
		this.setupEvents();
		this.updateModelVisibility(this.els.apiModel.value);
		this.updateTranscribeModelVisibility(this.els.transcribeModel.value);
		this.updateThemeAndLayout();
		this.syncThinkingInputs();
	}
	updateThemeAndLayout()
	{
		UIState.updateTheme(this.els.darkToggle.checked);
		UIState.updateLayout(this.els.wideToggle.checked);
	}
	loadSettings()
	{
		this.loadCheckbox('cleanupToggle', 'cleanup_enabled', true);
		this.loadCheckbox('darkToggle', 'dark_enabled', true);
		this.loadCheckbox('highCostToggle', 'high_cost_enabled', false);
		this.loadCheckbox('noBSToggle', 'no_bs_enabled', false);
		this.loadCheckbox('numberedLinesToggle', 'numbered_lines_enabled', false);
		this.loadCheckbox('streamToggle', 'streaming_enabled', true);
		this.loadCheckbox('wideToggle', 'wide_enabled', false);
		this.loadInput('apiKey', CONFIG.API.KEYS[this.els.apiModel.value] || '', this.els.apiModel.value);
		this.loadInput('batchRPM', 'translation_batch_rpm', 0, 'number');
		this.loadInput('batchSize', 'translation_batch_size', 10, 'number');
		this.loadInput('expRetry', 'exponential_retry', 10, 'number');
		this.loadInput('langSelect', 'selected_language', 'English');
		this.loadInput('transcribeLang', 'transcribe_language', 'en');
		this.loadSelect('apiModel', 'selected_api_model', 'openai');
		this.loadSelect('rendererSelect', 'selected_renderer', 'katex');
		this.loadSelect('transcribeModel', 'selected_transcription_api_model', 'groq');
		if (this.els.reasoningEffort)
		{
			this.loadSelect('reasoningEffort', 'reasoning_effort', 'low');
		}
		const thinkingBudget = parseInt(StorageService.load('thinking', 0), 10);
		this.els.thinkingRange.value = thinkingBudget;
		this.els.thinkingNum.value = thinkingBudget;
		this.loadModelOptions();
		this.loadWhisperOptions();
		this.updateModelVisibility(this.els.apiModel.value);
		this.updateTranscribeModelVisibility(this.els.transcribeModel.value);
		this.updateApiKeyLabel(this.els.apiModel.value);
		this.displaySettings();
		this.syncThinkingInputs();
	}
	loadSelect(elemKey, storeKey, defValue)
	{
		if (this.els[elemKey])
		{
			this.els[elemKey].value = StorageService.load(storeKey, defValue);
		}
	}
	loadInput(elemKey, storeKey, defValue, type = 'text')
	{
		if (this.els[elemKey])
		{
			let value = StorageService.load(storeKey, defValue);
			if (type === 'number')
			{
				value = parseInt(value, 10);
				if (isNaN(value))
				{
					value = defValue;
				}
			}
			this.els[elemKey].value = value;
		}
	}
	loadCheckbox(elemKey, storeKey, defValue)
	{
		if (this.els[elemKey])
		{
			this.els[elemKey].checked = StorageService.load(storeKey, defValue);
		}
	}
	loadModelOptions()
	{
		const isHighCostEnabled = StorageService.load('high_cost_enabled', false);
		Object.entries(CONFIG.API.MODELS.COMPLETION)
			.forEach(([provider, config]) =>
			{
				const modelSelect = this.els.modelSelects[provider];
				if (!modelSelect) return;
				modelSelect.innerHTML = '';
				this.addModelsToSelect(modelSelect, config.options);
				if (isHighCostEnabled && CONFIG.API.MODELS.COMPLETION_HIGH_COST[provider])
				{
					const highCostConfig = CONFIG.API.MODELS.COMPLETION_HIGH_COST[provider];
					this.addModelsToSelect(modelSelect, highCostConfig.options, true);
				}
				modelSelect.value = StorageService.load(`${provider}_model`, config.default);
			});
	}
	addModelsToSelect(select, models, isHighCost = false)
	{
		models.forEach(model =>
		{
			const option = document.createElement('option');
			option.value = model.name;
			option.textContent = isHighCost ? `${model.name} ($15+/1M)` : model.name;
			if (isHighCost)
			{
				option.className = 'high-cost-model';
			}
			select.appendChild(option);
		});
	}
	loadWhisperOptions()
	{
		Object.entries(CONFIG.API.MODELS.TRANSCRIPTION)
			.forEach(([provider, config]) =>
			{
				const modelSelect = this.els.whisperModels[provider];
				if (!modelSelect) return;
				modelSelect.innerHTML = '';
				config.options.forEach(model =>
				{
					const option = document.createElement('option');
					option.value = model.name;
					option.textContent = model.name;
					modelSelect.appendChild(option);
				});
				modelSelect.value = StorageService.load(`${provider}_whisper_model`, config.default);
			});
	}
	updateModelVisibility(provider)
	{
		Object.values(this.els.modelBoxes)
			.forEach(box =>
			{
				if (box) box.classList.remove('active');
			});
		const selectedBox = this.els.modelBoxes[provider];
		if (selectedBox)
		{
			selectedBox.classList.add('active');
			this.updateReasoningVisibility(provider);
			this.updateThinkingVisibility(provider);
		}
	}
	updateTranscribeModelVisibility(provider)
	{
		Object.values(this.els.whisperBoxes)
			.forEach(box =>
			{
				box.style.display = 'none';
			});
		const selectedBox = this.els.whisperBoxes[provider];
		if (selectedBox)
		{
			selectedBox.style.display = 'block';
		}
	}
	updateReasoningVisibility(provider)
	{
		const modelSelect = this.els.modelSelects[provider];
		const modelName = modelSelect ? modelSelect.value : null;
		const modelDetails = this.getModelDetails(provider, modelName);
		this.els.reasoningBox.style.display = (modelDetails && modelDetails.reasoning_effort) ? 'block' : 'none';
	}
	updateThinkingVisibility(provider)
	{
		const modelSelect = this.els.modelSelects[provider];
		const modelName = modelSelect ? modelSelect.value : null;
		const modelDetails = this.getModelDetails(provider, modelName);
		this.els.thinkingBox.style.display = (modelDetails && modelDetails.thinking) ? 'block' : 'none';
	}
	getModelDetails(provider, modelName)
	{
		let modelDetails = CONFIG.API.MODELS.COMPLETION[provider]?.options.find(m => m.name === modelName);
		if (!modelDetails && StorageService.load('high_cost_enabled', false) && CONFIG.API.MODELS.COMPLETION_HIGH_COST[provider])
		{
			modelDetails = CONFIG.API.MODELS.COMPLETION_HIGH_COST[provider].options.find(m => m.name === modelName);
		}
		return modelDetails;
	}
	setupEvents()
	{
		this.els.apiKey?.addEventListener('change', this.handleApiKeyChange.bind(this));
		this.els.apiModel?.addEventListener('change', this.handleApiModelChange.bind(this));
		this.els.batchRPM?.addEventListener('change', this.handleNumericChange.bind(this, 'batchRPM', 'translation_batch_rpm', 0, 60000));
		this.els.batchSize?.addEventListener('change', this.handleNumericChange.bind(this, 'batchSize', 'translation_batch_size', 1, 60000));
		this.els.cleanupToggle?.addEventListener('change', this.handleToggleChange.bind(this, 'cleanupToggle', 'cleanup_enabled'));
		this.els.darkToggle?.addEventListener('change', this.handleDarkToggleChange.bind(this));
		this.els.expRetry?.addEventListener('change', this.handleNumericChange.bind(this, 'expRetry', 'exponential_retry', 0));
		this.els.exportBtn?.addEventListener('click', this.exportSettings.bind(this));
		this.els.highCostToggle?.addEventListener('change', this.handleHighCostToggleChange.bind(this));
		this.els.importBtn?.addEventListener('click', this.importSettings.bind(this));
		this.els.langSelect?.addEventListener('change', this.handleLangChange.bind(this));
		this.els.noBSToggle?.addEventListener('change', this.handleToggleChange.bind(this, 'noBSToggle', 'no_bs_enabled'));
		this.els.numberedLinesToggle?.addEventListener('change', this.handleToggleChange.bind(this, 'numberedLinesToggle', 'numbered_lines_enabled'));
		this.els.reasoningEffort?.addEventListener('change', this.handleReasoningChange.bind(this));
		this.els.rendererSelect?.addEventListener('change', this.handleRendererChange.bind(this));
		this.els.saveBtn?.addEventListener('click', this.saveSettings.bind(this));
		this.els.streamToggle?.addEventListener('change', this.handleToggleChange.bind(this, 'streamToggle', 'streaming_enabled'));
		this.els.transcribeLang?.addEventListener('change', this.handleTranscribeLangChange.bind(this));
		this.els.transcribeModel?.addEventListener('change', this.handleTranscribeModelChange.bind(this));
		this.els.wideToggle?.addEventListener('change', this.handleWideToggleChange.bind(this));
		this.setupThinkingEvents();
		this.setupModelSelectEvents();
		this.setupWhisperModelEvents();
	}
	setupThinkingEvents()
	{
		this.els.thinkingRange?.addEventListener('input', () =>
		{
			this.els.thinkingNum.value = this.els.thinkingRange.value;
			this.handleThinkingChange();
		});
		this.els.thinkingNum?.addEventListener('input', () =>
		{
			this.els.thinkingRange.value = this.els.thinkingNum.value;
			this.handleThinkingChange();
		});
	}
	setupModelSelectEvents()
	{
		Object.entries(this.els.modelSelects)
			.forEach(([provider, select]) =>
			{
				select?.addEventListener('change', () =>
				{
					const selectedModel = select.value;
					StorageService.save(`${provider}_model`, selectedModel);
					this.updateReasoningVisibility(provider);
					this.updateThinkingVisibility(provider);
				});
			});
	}
	setupWhisperModelEvents()
	{
		Object.entries(this.els.whisperModels)
			.forEach(([provider, select]) =>
			{
				select?.addEventListener('change', () =>
				{
					const selectedModel = select.value;
					StorageService.save(`${provider}_whisper_model`, selectedModel);
				});
			});
	}
	handleApiModelChange()
	{
		const model = this.els.apiModel.value;
		StorageService.save('selected_api_model', model);
		this.updateApiKeyLabel(model);
		this.updateModelVisibility(model);
		this.els.apiKey.value = StorageService.load(CONFIG.API.KEYS[model] || '', '');
	}
	handleTranscribeModelChange()
	{
		const model = this.els.transcribeModel.value;
		StorageService.save('selected_transcription_api_model', model);
		this.updateTranscribeModelVisibility(model);
	}
	handleApiKeyChange()
	{
		const apiType = this.els.apiModel.value;
		const apiKey = this.els.apiKey.value.trim();
		StorageService.save(CONFIG.API.KEYS[apiType], apiKey);
	}
	handleToggleChange(elemKey, storeKey)
	{
		StorageService.save(storeKey, this.els[elemKey].checked);
	}
	handleDarkToggleChange()
	{
		const isDark = this.els.darkToggle.checked;
		UIState.updateTheme(isDark);
		StorageService.save('dark_enabled', isDark);
	}
	handleWideToggleChange()
	{
		const isWide = this.els.wideToggle.checked;
		UIState.updateLayout(isWide);
		StorageService.save('wide_enabled', isWide);
	}
	handleHighCostToggleChange()
	{
		const isHighCostEnabled = this.els.highCostToggle.checked;
		StorageService.save('high_cost_enabled', isHighCostEnabled);
		this.loadModelOptions();
		const provider = this.els.apiModel.value;
		this.updateReasoningVisibility(provider);
		this.updateThinkingVisibility(provider);
	}
	handleRendererChange()
	{
		StorageService.save('selected_renderer', this.els.rendererSelect.value);
	}
	handleReasoningChange()
	{
		StorageService.save('reasoning_effort', this.els.reasoningEffort.value);
	}
	handleThinkingChange()
	{
		const value = parseInt(this.els.thinkingNum.value, 10);
		StorageService.save('thinking', value);
	}
	handleLangChange()
	{
		StorageService.save('selected_language', this.els.langSelect.value);
	}
	handleTranscribeLangChange()
	{
		StorageService.save('transcribe_language', this.els.transcribeLang.value);
	}
	handleNumericChange(elemKey, storeKey, min = null, max = null)
	{
		let value = parseInt(this.els[elemKey].value, 10);
		if (isNaN(value))
		{
			value = StorageService.load(storeKey, 0);
		}
		if (min !== null && value < min)
		{
			value = min;
		}
		if (max !== null && value > max)
		{
			value = max;
		}
		this.els[elemKey].value = value;
		StorageService.save(storeKey, value);
	}
	updateApiKeyLabel(model)
	{
		const apiKeyLabel = document.querySelector('label[for="apiKey"]');
		if (apiKeyLabel)
		{
			apiKeyLabel.textContent = CONFIG.UI.API_KEY_LABELS[model] || 'API Key:';
		}
	}
	getSettings()
	{
		const settings = {
			cleanup_enabled: this.els.cleanupToggle.checked,
			dark_enabled: this.els.darkToggle.checked,
			exponential_retry: parseInt(this.els.expRetry.value, 10),
			high_cost_enabled: this.els.highCostToggle.checked,
			no_bs_enabled: this.els.noBSToggle.checked,
			numbered_lines_enabled: this.els.numberedLinesToggle.checked,
			prompts: StorageService.load('prompts', []),
			selected_api_model: this.els.apiModel.value,
			selected_language: this.els.langSelect.value,
			selected_renderer: this.els.rendererSelect.value,
			selected_transcription_api_model: this.els.transcribeModel.value,
			streaming_enabled: this.els.streamToggle.checked,
			thinking: parseInt(this.els.thinkingNum.value, 10),
			transcribe_language: this.els.transcribeLang.value,
			translation_batch_rpm: parseInt(this.els.batchRPM.value, 10),
			translation_batch_size: parseInt(this.els.batchSize.value, 10),
			translation_enabled: StorageService.load('translation_enabled', false),
			wide_enabled: this.els.wideToggle.checked
		};
		if (this.els.reasoningEffort)
		{
			settings.reasoning_effort = this.els.reasoningEffort.value;
		}
		this.addAPIKeySettings(settings);
		this.addModelSettings(settings);
		this.addWhisperSettings(settings);
		return settings;
	}
	addAPIKeySettings(settings)
	{
		Object.entries(CONFIG.API.KEYS)
			.forEach(([provider, key]) =>
			{
				settings[key] = StorageService.load(key, '');
			});
	}
	addModelSettings(settings)
	{
		Object.entries(CONFIG.API.MODELS.COMPLETION)
			.forEach(([provider, config]) =>
			{
				settings[`${provider}_model`] = this.els.modelSelects[provider].value;
			});
	}
	addWhisperSettings(settings)
	{
		Object.entries(CONFIG.API.MODELS.TRANSCRIPTION)
			.forEach(([provider, config]) =>
			{
				settings[`${provider}_whisper_model`] = this.els.whisperModels[provider].value;
			});
	}
	displaySettings()
	{
		const settings = this.getSettings();
		this.els.settingsText.value = JSON.stringify(settings, null, 2);
	}
	exportSettings()
	{
		const settings = this.getSettings();
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
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (e) =>
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
					alert('Invalid settings file: Not a JSON object.');
					return;
				}
				this.els.settingsText.value = JSON.stringify(settings, null, 2);
				Object.entries(settings)
					.forEach(([key, value]) =>
					{
						StorageService.save(key, value);
					});
				this.loadSettings();
				alert('Settings imported successfully!');
			};
			reader.readAsText(file);
		});
		input.click();
	}
	saveSettings()
	{
		let settingsText = this.els.settingsText.value;
		if (!settingsText.trim() || settingsText.trim() === '{}')
		{
			this.clearAllData();
			alert('Data wiped successfully!');
			this.loadSettings();
			return;
		}
		const settings = JSON.parse(settingsText);
		if (typeof settings !== 'object' || settings === null)
		{
			alert('Invalid settings: Not a JSON object.');
			return;
		}
		Object.entries(settings)
			.forEach(([key, value]) =>
			{
				StorageService.save(key, value);
			});
		this.loadSettings();
		alert('Settings saved successfully!');
	}
	clearAllData()
	{
		localStorage.clear();
	}
	syncThinkingInputs()
	{
		this.els.thinkingNum.value = this.els.thinkingRange.value;
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const settingsApp = new SettingsApp();
	settingsApp.init();
});