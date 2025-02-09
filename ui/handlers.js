// ui/handlers.js
const UIHandlers = {
	setupTextAreaHandlers(elements)
	{
		['source', 'target'].forEach(type =>
		{
			const textArea = elements[`${type}Text`];
			textArea.addEventListener('input', () =>
			{
				TextService.updateStats(textArea, type);
				StorageService.save(`${type}Text`, textArea.value);
			});
			const actions = {
				[`clear${this.capitalize(type)}`]: () => this.clearTextArea(textArea, type),
				[`copy${this.capitalize(type)}`]: () => navigator.clipboard.writeText(textArea.value),
				[`uppercase${this.capitalize(type)}`]: () => this.transformText(textArea, type, TextService.transform.toUpperCase),
				[`lowercase${this.capitalize(type)}`]: () => this.transformText(textArea, type, TextService.transform.toLowerCase),
				[`dedupe${this.capitalize(type)}`]: () => this.transformText(textArea, type, TextService.transform.dedupe),
				[`sort${this.capitalize(type)}`]: () => this.transformText(textArea, type, TextService.transform.sort),
				[`unbold${this.capitalize(type)}`]: () => this.transformText(textArea, type, TextService.transform.unbold),
				[`unspace${this.capitalize(type)}`]: () => this.transformText(textArea, type, TextService.transform.unspace),
				[`retab${this.capitalize(type)}`]: () => this.transformText(textArea, type, TextService.format.retab),
				[`latex${this.capitalize(type)}`]: () => this.transformText(textArea, type, TextService.format.latex),
				[`html${this.capitalize(type)}`]: () => this.transformText(textArea, type, TextService.format.html),
			};
			Object.entries(actions)
				.forEach(([id, action]) =>
				{
					document.getElementById(id)
						?.addEventListener('click', action);
				});
		});
	},
	capitalize(str)
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
	transformText(textArea, type, transformFunction)
	{
		textArea.value = transformFunction(textArea.value);
		TextService.updateStats(textArea, type);
		StorageService.save(`${type}Text`, textArea.value);
	},
	setupFileUploaders(elements)
	{
		['source', 'target'].forEach(type =>
		{
			const fileInput = document.getElementById(`load${this.capitalize(type)}`);
			fileInput?.addEventListener('change', async (e) =>
			{
				const file = e.target.files[0];
				if (file)
				{
					const content = await TextService.loadFile(file);
					elements[`${type}Text`].value = content;
					TextService.updateStats(elements[`${type}Text`], type);
					StorageService.save(`${type}Text`, content);
				}
			});
		});
	},
	setupCompareButton(elements)
	{
		elements.compareBtn.addEventListener('click', () =>
		{
			const comparison = ComparisonService.compare(elements.sourceText.value, elements.targetText.value);
			const views = ComparisonService.generateViews(comparison.diffs);
			document.getElementById('singleColumnDiff')
				.innerHTML = views.single;
			document.getElementById('leftColumn')
				.innerHTML = views.double.left;
			document.getElementById('rightColumn')
				.innerHTML = views.double.right;
			document.getElementById('levenshtein')
				.textContent = comparison.levenshtein;
			document.getElementById('commonPercentage')
				.textContent = comparison.stats.commonPercentage;
			document.getElementById('differencePercentage')
				.textContent = comparison.stats.differencePercentage;
			document.getElementById('commonSymbols')
				.textContent = comparison.stats.commonSymbols;
			document.getElementById('differenceSymbols')
				.textContent = comparison.stats.differenceSymbols;
		});
	},
	setupSwitchButton(elements)
	{
		elements.switchBtn.addEventListener('click', () =>
		{
			[elements.sourceText.value, elements.targetText.value] = [elements.targetText.value, elements.sourceText.value];
			TextService.updateStats(elements.sourceText, 'source');
			TextService.updateStats(elements.targetText, 'target');
			StorageService.save('sourceText', elements.sourceText.value);
			StorageService.save('targetText', elements.targetText.value);
		});
	},
	calculateWPM(text, timeInSeconds)
	{
		const wordCount = text.trim()
			.split(/\s+/)
			.length;
		const minutes = timeInSeconds / 60;
		return minutes > 0 ? Math.round(wordCount / minutes) : 0;
	},
	setupGenerateButton(elements, state)
	{
		let startTime = null;
		elements.generateTargetBtn.addEventListener('click', async () =>
		{
			if (elements.generateTargetBtn.dataset.generating === 'true')
			{
				state.abortController?.abort();
				return;
			}
			try
			{
				UIState.setGenerating(true, elements);
				state.abortController = new AbortController();
				const model = StorageService.load('selected_api_model', 'chatgpt');
				const selectedPrompt = elements.promptSelect.value;
				const customPrompt = elements.customPromptInput.value;
				let prompt = selectedPrompt === 'custom' ? customPrompt : selectedPrompt;
				prompt += "\n\n" + elements.sourceText.value;
				if (elements.translationToggle.checked)
				{
					const targetLanguage = elements.languageSelect.value;
					prompt = `Translate the following text to ${targetLanguage}\n\n${prompt}`;
				}
				const generationOptions = {
					streaming: StorageService.load('streaming_enabled', true),
					images: Object.values(state.imageUploader.getImages()),
					videos: Object.values(state.videoUploader.getVideos()),
					abortSignal: state.abortController.signal,
					onProgress: (text) =>
					{
						elements.targetText.value = text;
						TextService.updateStats(elements.targetText, 'target');
						StorageService.save('targetText', text);
						elements.targetText.scrollTop = elements.targetText.scrollHeight;
						const elapsedTimeInSeconds = (Date.now() - startTime) / 1000;
						const wpm = this.calculateWPM(text, elapsedTimeInSeconds);
						elements.wpmDisplay.textContent = wpm;
					}
				};
				elements.targetText.value = '';
				UIState.showWPM(elements);
				startTime = Date.now();
				await AiService.generate(prompt, model, generationOptions);
			}
			catch (error)
			{
				if (error.name !== 'AbortError')
				{
					console.error('Generation error:', error);
				}
			}
			finally
			{
				UIState.setGenerating(false, elements);
				state.abortController = null;
				startTime = null;
			}
		});
	},
	setupModelSelectionHandler(elements)
	{
		if (elements.apiModelSelect)
		{
			elements.apiModelSelect.addEventListener('change', () =>
			{
				const selectedModel = elements.apiModelSelect.value;
				const currentModelDetails = CONFIG.API.MODELS[selectedModel]?.options.find(m => m.name === StorageService.load(`${selectedModel}_model`, CONFIG.API.MODELS[selectedModel].default));
				StorageService.save('selected_api_model', selectedModel);
				UIState.updateImageUploadVisibility(currentModelDetails);
				UIState.updateVideoUploadVisibility(currentModelDetails);
			});
		}
	},
	setupSettingsHandlers(elements)
	{
		elements.apiModelSelect?.addEventListener('change', () =>
		{
			const selectedModel = elements.apiModelSelect.value;
			const selectedModelDetails = CONFIG.API.MODELS[selectedModel]?.options.find(m => m.name === elements.modelSelects[selectedModel].value);
			StorageService.save('selected_api_model', selectedModel);
			UIState.updateImageUploadVisibility(selectedModelDetails);
			UIState.updateVideoUploadVisibility(selectedModelDetails);
		});
		if (elements.modelSelects)
		{
			Object.entries(elements.modelSelects)
				.forEach(([provider, select]) =>
				{
					select?.addEventListener('change', () =>
					{
						elements.apiModelSelect.value = provider;
						const selectedModel = provider;
						const selectedModelDetails = CONFIG.API.MODELS[selectedModel]?.options.find(m => m.name === select.value);
						StorageService.save('selected_api_model', selectedModel);
						UIState.updateImageUploadVisibility(selectedModelDetails);
						UIState.updateVideoUploadVisibility(selectedModelDetails);
					});
				});
		}
		const toggleSettings = {
			streamingToggle: 'streaming_enabled',
			translationToggle: 'translation_enabled',
			cleanupToggle: 'cleanup_enabled',
			darkToggle: 'dark_enabled',
			wideToggle: 'wide_enabled',
		};
		Object.entries(toggleSettings)
			.forEach(([elementId, storageKey]) =>
			{
				elements[elementId]?.addEventListener('change', () =>
				{
					const value = elements[elementId].checked;
					if (elementId === 'darkToggle')
					{
						UIState.updateTheme(value);
					}
					else if (elementId === 'wideToggle')
					{
						UIState.updateLayout(value);
					}
					StorageService.save(storageKey, value);
				});
			});
		elements.languageSelect?.addEventListener('change', () =>
		{
			StorageService.save('selected_language', elements.languageSelect.value);
		});
		elements.transcribeLanguage?.addEventListener('change', () =>
		{
			StorageService.save('transcribe_language', elements.transcribeLanguage.value);
		});
	},
};
window.UIHandlers = UIHandlers;