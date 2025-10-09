const UIHandlers = {
	setupTextAreaHandlers(els)
	{
		['source', 'target'].forEach(type =>
		{
			const textArea = els[`${type}Text`];
			if (!textArea) return;
			textArea.addEventListener('input', () =>
			{
				TextService.updateStats(textArea, type);
				StorageService.save(`${type}Text`, textArea.value);
			});
			const actions = {
				clear: () => this.clearTextArea(textArea, type),
				copy: () => navigator.clipboard.writeText(textArea.value),
				uppercase: () => this.transform(textArea, type, TextService.transform.toUpperCase),
				lowercase: () => this.transform(textArea, type, TextService.transform.toLowerCase),
				dedupe: () => this.transform(textArea, type, TextService.transform.dedupe),
				sort: () => this.transform(textArea, type, TextService.transform.sort),
				unbold: () => this.transform(textArea, type, TextService.transform.unbold),
				unspace: () => this.transform(textArea, type, TextService.transform.unspace),
				retab: () => this.transform(textArea, type, TextService.format.retab),
				latex: () => this.transform(textArea, type, TextService.format.latex),
				html: () => this.transform(textArea, type, TextService.format.html)
			};
			Object.entries(actions)
				.forEach(([id, action]) =>
				{
					document.getElementById(`${id}${this.cap(type)}`)
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
			const provider = StorageService.load('selected_api_model', 'openai');
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
			const details = UtilService.getDetails(provider);
			const audios = details && details.audio ? Object.values(state.audioUploader.getAudios()) : [];
			const files = details && details.file ? state.fileUploader.getFiles() :
			{};
			const images = details && details.image ? Object.values(state.imageUploader.getImages()) : [];
			const videos = details && details.video ? Object.values(state.videoUploader.getVideos()) : [];
			const genOptions = {
				streaming: StorageService.load('streaming_enabled', true),
				audios,
				files,
				images,
				videos,
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
			const response = await AiService.generate(prompt, provider, genOptions);
			if (!genOptions.streaming)
			{
				const modelConfig = CONFIG.API.CONFIG.COMPLETION[provider];
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
		if (!els.apiModel) return;
		els.apiModel.addEventListener('change', () =>
		{
			const provider = els.apiModel.value;
			const details = UtilService.getDetails(provider);
			StorageService.save('selected_api_model', provider);
			if (details)
			{
				UIState.updateUploadsVisibility(details);
			}
		});
	},
	setupSettingsHandlers(els)
	{
		els.apiModel?.addEventListener('change', () =>
		{
			const provider = els.apiModel.value;
			const details = UtilService.getDetails(provider);
			StorageService.save('selected_api_model', provider);
			if (details)
			{
				UIState.updateUploadsVisibility(details);
			}
		});
		if (els.modelSelects)
		{
			Object.entries(els.modelSelects)
				.forEach(([provider, select]) =>
				{
					select?.addEventListener('change', () =>
					{
						els.apiModel.value = provider;
						const provider = provider;
						const details = UtilService.getDetails(provider);
						StorageService.save('selected_api_model', provider);
						if (details)
						{
							UIState.updateUploadsVisibility(details);
						}
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
			wideToggle: 'wide_enabled'
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
	}
};
window.UIHandlers = UIHandlers;