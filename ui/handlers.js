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
				[`clear${type.charAt(0).toUpperCase() + type.slice(1)}`]: () =>
				{
					textArea.value = '';
					TextService.updateStats(textArea, type);
					StorageService.save(`${type}Text`, '');
				},
				[`copy${type.charAt(0).toUpperCase() + type.slice(1)}`]: () => navigator.clipboard.writeText(textArea.value),
				[`uppercase${type.charAt(0).toUpperCase() + type.slice(1)}`]: () =>
				{
					textArea.value = TextService.transform.toUpperCase(textArea.value);
					TextService.updateStats(textArea, type);
					StorageService.save(`${type}Text`, textArea.value);
				},
				[`lowercase${type.charAt(0).toUpperCase() + type.slice(1)}`]: () =>
				{
					textArea.value = TextService.transform.toLowerCase(textArea.value);
					TextService.updateStats(textArea, type);
					StorageService.save(`${type}Text`, textArea.value);
				},
				[`dedupe${type.charAt(0).toUpperCase() + type.slice(1)}`]: () =>
				{
					textArea.value = TextService.transform.dedupe(textArea.value);
					TextService.updateStats(textArea, type);
					StorageService.save(`${type}Text`, textArea.value);
				},
				[`sort${type.charAt(0).toUpperCase() + type.slice(1)}`]: () =>
				{
					textArea.value = TextService.transform.sort(textArea.value);
					TextService.updateStats(textArea, type);
					StorageService.save(`${type}Text`, textArea.value);
				},
				[`unbold${type.charAt(0).toUpperCase() + type.slice(1)}`]: () =>
				{
					textArea.value = TextService.transform.unbold(textArea.value);
					TextService.updateStats(textArea, type);
					StorageService.save(`${type}Text`, textArea.value);
				},
				[`unspace${type.charAt(0).toUpperCase() + type.slice(1)}`]: () =>
				{
					textArea.value = TextService.transform.unspace(textArea.value);
					TextService.updateStats(textArea, type);
					StorageService.save(`${type}Text`, textArea.value);
				},
				[`latex${type.charAt(0).toUpperCase() + type.slice(1)}`]: () =>
				{
					textArea.value = TextService.format.latex(textArea.value);
					TextService.updateStats(textArea, type);
					StorageService.save(`${type}Text`, textArea.value);
				},
				[`html${type.charAt(0).toUpperCase() + type.slice(1)}`]: () =>
				{
					textArea.value = TextService.format.html(textArea.value);
					TextService.updateStats(textArea, type);
					StorageService.save(`${type}Text`, textArea.value);
				}
			};
			Object.entries(actions)
				.forEach(([id, action]) =>
				{
					document.getElementById(id)
						?.addEventListener('click', action);
				});
		});
	},
	setupFileUploaders(elements)
	{
		['source', 'target'].forEach(type =>
		{
			document.getElementById(`load${type.charAt(0).toUpperCase() + type.slice(1)}`)
				?.addEventListener('change', async (e) =>
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
			const temp = elements.sourceText.value;
			elements.sourceText.value = elements.targetText.value;
			elements.targetText.value = temp;
			TextService.updateStats(elements.sourceText, 'source');
			TextService.updateStats(elements.targetText, 'target');
			StorageService.save('sourceText', elements.sourceText.value);
			StorageService.save('targetText', elements.targetText.value);
		});
	},
	setupGenerateButton(elements, state)
	{
		elements.generateTargetBtn.addEventListener('click', async () =>
		{
			if (elements.generateTargetBtn.dataset.generating === 'true')
			{
				if (state.abortController)
				{
					state.abortController.abort();
				}
				return;
			}
			try
			{
				UIState.setGenerating(true, elements);
				state.abortController = new AbortController();
				const model = StorageService.load('selected_api_model', 'chatgpt');
				const selectedPrompt = elements.promptSelect.value;
				const customPrompt = elements.customPromptInput.value;
				const prompt = selectedPrompt === 'custom' ? customPrompt : selectedPrompt;
				let fullPrompt = prompt + "\n\n" + elements.sourceText.value;
				if (elements.translationToggle.checked)
				{
					const targetLanguage = elements.languageSelect.value;
					fullPrompt = `Translate the following text to ${targetLanguage}\n\n${fullPrompt}`;
				}
				elements.targetText.value = '';
				await AiService.generate(fullPrompt, model,
				{
					streaming: StorageService.load('streaming_enabled', true),
					images: Object.values(state.imageUploader.getImages()),
					abortSignal: state.abortController.signal,
					onProgress: (text) =>
					{
						elements.targetText.value = text;
						TextService.updateStats(elements.targetText, 'target');
						StorageService.save('targetText', text);
						elements.targetText.scrollTop = elements.targetText.scrollHeight;
					}
				});
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
		});
		if (elements.modelSelects)
		{
			Object.entries(elements.modelSelects)
				.forEach(([provider, select]) =>
				{
					if (select)
					{
						select.addEventListener('change', () =>
						{
							elements.apiModelSelect.value = provider;
							const selectedModel = provider;
							const selectedModelDetails = CONFIG.API.MODELS[selectedModel]?.options.find(m => m.name === select.value);
							StorageService.save('selected_api_model', selectedModel);
							UIState.updateImageUploadVisibility(selectedModelDetails);
						});
					}
				});
		}
		elements.streamingToggle?.addEventListener('change', () =>
		{
			StorageService.save('streaming_enabled', elements.streamingToggle.checked);
		});
		elements.translationToggle?.addEventListener('change', () =>
		{
			StorageService.save('translation_enabled', elements.translationToggle.checked);
		});
		elements.cleanupToggle?.addEventListener('change', () =>
		{
			StorageService.save('cleanup_enabled', elements.cleanupToggle.checked);
		});
		elements.darkToggle?.addEventListener('change', () =>
		{
			UIState.updateTheme(elements.darkToggle.checked);
			StorageService.save('dark_enabled', elements.darkToggle.checked);
		});
		elements.wideToggle?.addEventListener('change', () =>
		{
			UIState.updateLayout(elements.wideToggle.checked);
			StorageService.save('wide_enabled', elements.wideToggle.checked);
		});
		elements.languageSelect?.addEventListener('change', () =>
		{
			StorageService.save('selected_language', elements.languageSelect.value);
		});
		elements.transcribeLanguage?.addEventListener('change', () =>
		{
			StorageService.save('transcribe_language', elements.transcribeLanguage.value);
		});
	}
};
window.UIHandlers = UIHandlers;