// ui/handlers.js
const UIHandlers = {
	setupTextAreaHandlers(els)
	{
		['source', 'target'].forEach(type =>
		{
			const textArea = els[`${type}Text`];
			textArea.addEventListener('input', () =>
			{
				TextService.updateStats(textArea, type);
				StorageService.save(`${type}Text`, textArea.value);
			});
			const actions = {
				[`clear${this.cap(type)}`]: () => this.clearTextArea(textArea, type),
				[`copy${this.cap(type)}`]: () => navigator.clipboard.writeText(textArea.value),
				[`uppercase${this.cap(type)}`]: () => this.transform(textArea, type, TextService.transform.toUpperCase),
				[`lowercase${this.cap(type)}`]: () => this.transform(textArea, type, TextService.transform.toLowerCase),
				[`dedupe${this.cap(type)}`]: () => this.transform(textArea, type, TextService.transform.dedupe),
				[`sort${this.cap(type)}`]: () => this.transform(textArea, type, TextService.transform.sort),
				[`unbold${this.cap(type)}`]: () => this.transform(textArea, type, TextService.transform.unbold),
				[`unspace${this.cap(type)}`]: () => this.transform(textArea, type, TextService.transform.unspace),
				[`retab${this.cap(type)}`]: () => this.transform(textArea, type, TextService.format.retab),
				[`latex${this.cap(type)}`]: () => this.transform(textArea, type, TextService.format.latex),
				[`html${this.cap(type)}`]: () => this.transform(textArea, type, TextService.format.html),
			};
			Object.entries(actions)
				.forEach(([id, action]) =>
				{
					document.getElementById(id)
						?.addEventListener('click', action);
				});
		});
	},
	cap(str)
	{
		return str.charAt(0)
			.toUpperCase() + str.slice(1);
	},
	clearTextArea(textArea, type)
	{
		textArea.value = '';
		TextService.updateStats(textArea, type);
		StorageService.save(`${type}Text`, '');
		if (type === 'target')
		{
			document.getElementById('wpm-container')
				.style.display = 'none';
		}
	},
	transform(textArea, type, fn)
	{
		textArea.value = fn(textArea.value);
		TextService.updateStats(textArea, type);
		StorageService.save(`${type}Text`, textArea.value);
	},
	setupFileUploaders(els)
	{
		['source', 'target'].forEach(type =>
		{
			const fileInput = document.getElementById(`load${this.cap(type)}`);
			fileInput?.addEventListener('change', async (e) =>
			{
				const file = e.target.files[0];
				if (file)
				{
					const content = await TextService.loadFile(file);
					els[`${type}Text`].value = content;
					TextService.updateStats(els[`${type}Text`], type);
					StorageService.save(`${type}Text`, content);
				}
			});
		});
	},
	setupCompareButton(els)
	{
		els.compareBtn.addEventListener('click', () =>
		{
			const compare = ComparisonService.compare(els.sourceText.value, els.targetText.value);
			const views = ComparisonService.generateViews(compare.diffs);
			document.getElementById('singleColumnDiff')
				.innerHTML = views.single;
			document.getElementById('leftColumn')
				.innerHTML = views.double.left;
			document.getElementById('rightColumn')
				.innerHTML = views.double.right;
			document.getElementById('levenshtein')
				.textContent = compare.levenshtein;
			document.getElementById('commonPercentage')
				.textContent = compare.stats.commonPercentage;
			document.getElementById('differencePercentage')
				.textContent = compare.stats.differencePercentage;
			document.getElementById('commonSymbols')
				.textContent = compare.stats.commonSymbols;
			document.getElementById('differenceSymbols')
				.textContent = compare.stats.differenceSymbols;
		});
	},
	setupSwitchButton(els)
	{
		els.switchBtn.addEventListener('click', () =>
		{
			[els.sourceText.value, els.targetText.value] = [els.targetText.value, els.sourceText.value];
			TextService.updateStats(els.sourceText, 'source');
			TextService.updateStats(els.targetText, 'target');
			StorageService.save('sourceText', els.sourceText.value);
			StorageService.save('targetText', els.targetText.value);
		});
	},
	calcWPM(text, secs)
	{
		const words = text.trim()
			.split(/\s+/)
			.length;
		const mins = secs / 60;
		return mins > 0 ? Math.round(words / mins) : 0;
	},
	setupGenerateButton(els, state)
	{
		let startTime = null;
		els.genTargetBtn.addEventListener('click', async () =>
		{
			if (els.genTargetBtn.dataset.generating === 'true')
			{
				state.abortCtrl?.abort();
				UIState.setGenerating(false, els);
				state.abortCtrl = null;
				return;
			}
			UIState.setGenerating(true, els);
			state.abortCtrl = new AbortController();
			const model = StorageService.load('selected_api_model', 'openai');
			const selectedPrompt = els.promptSelect.value;
			const customPrompt = els.customPrompt.value;
			let prompt = selectedPrompt === 'custom' ? customPrompt : selectedPrompt;
			prompt += "\n\n" + els.sourceText.value;
			if (els.translateToggle.checked)
			{
				const targetLang = els.langSelect.value;
				prompt = `${CONFIG.UI.TRANSLATION_PROMPT} ${targetLang}.\n\n${prompt}`;
			}
			if (StorageService.load('no_bs_enabled', false))
			{
				prompt = `${CONFIG.UI.NO_BS_PROMPT}.\n\n${prompt}`;
			}
			if (StorageService.load('no_bs_plus_enabled', false))
			{
				prompt = `${CONFIG.UI.NO_BS_PLUS_PROMPT}.\n\n${prompt}`;
			}
			if (!prompt.trim()) return;
			const genOptions = {
				streaming: StorageService.load('streaming_enabled', true),
				audios: Object.values(state.audioUploader.getAudios()),
				images: Object.values(state.imageUploader.getImages()),
				videos: Object.values(state.videoUploader.getVideos()),
				abortSignal: state.abortCtrl.signal,
				onProgress: (text) =>
				{
					els.targetText.value = text;
					TextService.updateStats(els.targetText, 'target');
					StorageService.save('targetText', text);
					els.targetText.scrollTop = els.targetText.scrollHeight;
					const elapsed = (Date.now() - startTime) / 1000;
					const wpm = this.calcWPM(text, elapsed);
					els.wpmDisplay.textContent = wpm;
				}
			};
			els.targetText.value = '';
			UIState.showWPM(els);
			startTime = Date.now();
			const response = await AiService.generate(prompt, model, genOptions);
			if (!genOptions.streaming)
			{
				const modelConfig = CONFIG.API.CONFIG.COMPLETION[model];
				els.targetText.value = modelConfig.extractContent(response);
				TextService.updateStats(els.targetText, 'target');
				StorageService.save('targetText', els.targetText.value);
			}
			UIState.setGenerating(false, els);
			state.abortCtrl = null;
			startTime = null;
		});
	},
	setupModelSelectionHandler(els)
	{
		if (els.apiModel)
		{
			els.apiModel.addEventListener('change', () =>
			{
				const model = els.apiModel.value;
				const modelName = StorageService.load(`${model}_model`, CONFIG.API.MODELS.COMPLETION[model].default);
				let details = CONFIG.API.MODELS.COMPLETION[model]?.options.find(m => m.name === modelName);
				if (!details && StorageService.load('high_cost_enabled', false) && CONFIG.API.MODELS.COMPLETION_HIGH_COST[model])
				{
					details = CONFIG.API.MODELS.COMPLETION_HIGH_COST[model].options.find(m => m.name === modelName);
				}
				StorageService.save('selected_api_model', model);
				if (details)
				{
					UIState.updateAudioUploadVisibility(details);
					UIState.updateImageUploadVisibility(details);
					UIState.updateVideoUploadVisibility(details);
				}
			});
		}
	},
	setupSettingsHandlers(els)
	{
		els.apiModel?.addEventListener('change', () =>
		{
			const model = els.apiModel.value;
			const details = CONFIG.API.MODELS.COMPLETION[model]?.options.find(m => m.name === els.modelSelects[model].value);
			StorageService.save('selected_api_model', model);
			UIState.updateAudioUploadVisibility(details);
			UIState.updateImageUploadVisibility(details);
			UIState.updateVideoUploadVisibility(details);
		});
		if (els.modelSelects)
		{
			Object.entries(els.modelSelects)
				.forEach(([provider, select]) =>
				{
					select?.addEventListener('change', () =>
					{
						els.apiModel.value = provider;
						const model = provider;
						const details = CONFIG.API.MODELS.COMPLETION[model]?.options.find(m => m.name === select.value);
						StorageService.save('selected_api_model', model);
						UIState.updateAudioUploadVisibility(details);
						UIState.updateImageUploadVisibility(details);
						UIState.updateVideoUploadVisibility(details);
					});
				});
		}
		const toggles = {
			cleanupToggle: 'cleanup_enabled',
			darkToggle: 'dark_enabled',
			noBSToggle: 'no_bs_enabled',
			noBSPlusToggle: 'no_bs_plus_enabled',
			streamToggle: 'streaming_enabled',
			translateToggle: 'translation_enabled',
			wideToggle: 'wide_enabled',
		};
		Object.entries(toggles)
			.forEach(([elemId, storeKey]) =>
			{
				els[elemId]?.addEventListener('change', () =>
				{
					const value = els[elemId].checked;
					if (elemId === 'darkToggle')
					{
						UIState.updateTheme(value);
					}
					else if (elemId === 'wideToggle')
					{
						UIState.updateLayout(value);
					}
					StorageService.save(storeKey, value);
				});
			});
		els.langSelect?.addEventListener('change', () =>
		{
			StorageService.save('selected_language', els.langSelect.value);
		});
		els.transcribeLang?.addEventListener('change', () =>
		{
			StorageService.save('transcribe_language', els.transcribeLang.value);
		});
	},
};
window.UIHandlers = UIHandlers;