const UIHandlers = {
	setupButtonsContainers()
	{
		const defaultButtonsIds = CONFIG.UI.BUTTONS.filter(btn => !btn.defaultHidden)
			.map(btn => btn.id);
		const visibleButtonsIds = StorageService.load('button_visibility', defaultButtonsIds);
		const visibleButtons = CONFIG.UI.BUTTONS.filter(btn => visibleButtonsIds.includes(btn.id));
		['source', 'target'].forEach(type =>
		{
			const container = document.getElementById(`${type}ButtonsContainer`);
			if (!container) return;
			visibleButtons.forEach(btn =>
			{
				if (btn.id === 'load')
				{
					const div = document.createElement('div');
					div.className = 'upload-file';
					const label = document.createElement('label');
					label.htmlFor = `load${this.cap(type)}`;
					label.className = `btn btn-sm ${btn.colorClass} input-file-label`;
					label.textContent = btn.label;
					const input = document.createElement('input');
					input.type = 'file';
					input.id = `load${this.cap(type)}`;
					input.accept = '.epub,.txt,.html,.htm,.css,.xml,.json';
					input.className = 'input-file';
					input.multiple = true;
					div.appendChild(label);
					div.appendChild(input);
					container.appendChild(div);
				}
				else
				{
					const button = document.createElement('button');
					button.className = `btn btn-sm ${btn.colorClass}`;
					button.id = `${btn.id}${this.cap(type)}`;
					button.textContent = btn.label;
					container.appendChild(button);
				}
			});
		});
	},
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
				html: () => this.transform(textArea, type, TextService.format.html),
				url: () => this.transform(textArea, type, TextService.format.url)
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
			document.getElementById('speed-container')
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
				e.target.value = '';
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
			this.switchText(els);
		});
	},
	switchText(els)
	{
		[els.sourceText.value, els.targetText.value] = [els.targetText.value, els.sourceText.value];
		TextService.updateStats(els.sourceText, 'source');
		TextService.updateStats(els.targetText, 'target');
		StorageService.save('sourceText', els.sourceText.value);
		StorageService.save('targetText', els.targetText.value);
	},
	isConverged(sourceText, targetText, previousText)
	{
		if (sourceText === targetText) return true;
		if (targetText === previousText) return true;
		return false;
	},
	calcSpeed(text, secs)
	{
		const tokensEnabled = StorageService.load('tokens_enabled', false) === true;
		if (tokensEnabled)
		{
			const tokens = TextService.countTokens(text);
			return secs > 0 ? Math.round(tokens / secs) : 0;
		}
		const words = TextService.countWords(text);
		const mins = secs / 60;
		return mins > 0 ? Math.round(words / mins) : 0;
	},
	setupGenerateButton(els, state)
	{
		let startTime = null;
		const generateText = async (state) =>
		{
			const provider = StorageService.load('selected_api_model', 'openai');
			const details = UtilService.getDetails(provider);
			const audios = details && details.audio ? Object.values(state.audioUploader.getAudios()) : [];
			if (provider === 'openai' && details && details.modality === 'audio' && audios.length === 0)
			{
				alert('Selected OpenAI audio model requires audio input. Attach at least one audio file.');
				state.abortCtrl.abort();
				return false;
			}
			let prompt = PromptService.getCustomPrompt(els);
			prompt += "\n\n<text>\n" + els.sourceText.value + "\n</text>";
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
			if (!prompt.trim())
			{
				state.abortCtrl.abort();
				return false;
			}
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
					const speed = this.calcSpeed(text, elapsed);
					els.speedDisplay.textContent = speed;
				}
			};
			els.targetText.value = '';
			UIState.showSpeed(els);
			startTime = Date.now();
			const resp = await AiService.generate(prompt, provider, genOptions);
			if (!genOptions.streaming)
			{
				const modelConfig = CONFIG.API.CONFIG.COMPLETION[provider];
				els.targetText.value = modelConfig.extractContent(resp);
				TextService.updateStats(els.targetText, 'target');
				StorageService.save('targetText', els.targetText.value);
			}
			return true;
		};
		els.genTargetBtn.addEventListener('click', async () =>
		{
			if (els.genTargetBtn.dataset.generating === 'true')
			{
				state.abortCtrl?.abort();
				UIState.setGenerating(false, els, state.iterate);
				state.abortCtrl = null;
				return;
			}
			UIState.setGenerating(true, els, state.iterate);
			state.abortCtrl = new AbortController();
			try
			{
				if (state.iterate)
				{
					const maximumIterations = StorageService.load('maximum_iterations', 10);
					let iterationCount = 0;
					let previousText = '';
					while (!state.abortCtrl.signal.aborted && iterationCount < maximumIterations)
					{
						const generateSuccess = await generateText(state);
						if (!generateSuccess || state.abortCtrl.signal.aborted) break;
						iterationCount++;
						if (this.isConverged(els.sourceText.value, els.targetText.value, previousText)) break;
						previousText = els.sourceText.value;
						this.switchText(els);
					}
				}
				else
				{
					await generateText(state);
				}
			}
			finally
			{
				if (!state.abortCtrl.signal.aborted) state.abortCtrl.abort();
				UIState.setGenerating(false, els, state.iterate);
				state.abortCtrl = null;
				startTime = null;
			}
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
			accessibilityToggle: 'accessibility_enabled',
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
					else if (elemId === 'accessibilityToggle')
					{
						UIState.updateAccessibility(value);
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