document.addEventListener('DOMContentLoaded', () =>
{
	const elements = {
		sourceText: document.getElementById('sourceText'),
		targetText: document.getElementById('targetText'),
		compareBtn: document.getElementById('compareBtn'),
		switchBtn: document.getElementById('switchBtn'),
		generateTargetBtn: document.getElementById('generateTarget'),
		renderMarkdownBtn: document.getElementById('renderMarkdownBtn'),
		apiModelSelect: document.getElementById('apiModel'),
		apiKeyInput: document.getElementById('apiKey'),
		promptSelect: document.getElementById('promptSelect'),
		customPromptContainer: document.getElementById('customPromptContainer'),
		customPromptInput: document.getElementById('customPrompt'),
		savePromptBtn: document.getElementById('savePrompt'),
		streamingToggle: document.getElementById('streamingToggle'),
		transcribeLanguage: document.getElementById('transcribeLanguage'),
		audioFile: document.getElementById('audioFile'),
		transcribeBtn: document.getElementById('transcribeBtn'),
	};
	const API_KEYS = {
		chatgpt: 'chatgpt_api_key',
		claude: 'claude_api_key',
		gemini: 'gemini_api_key',
		groq: 'groq_api_key'
	};
	let abortController = null;
	let transcribeAbortController = null;
	const apiConfig = {
		chatgpt:
		{
			url: 'https://api.openai.com/v1/chat/completions',
			model: "chatgpt-4o-latest",
			apiKeyHeader: 'Authorization',
			apiKeyPrefix: 'Bearer ',
			extractContent: data => data.choices[0]?.message?.content,
			extractStreamContent: data => data.choices[0]?.delta?.content
		},
		claude:
		{
			url: 'https://api.anthropic.com/v1/messages',
			model: "claude-3-5-sonnet-20241022",
			apiKeyHeader: 'x-api-key',
			apiKeyPrefix: '',
			additionalHeaders:
			{
				'anthropic-version': '2023-06-01'
			},
			extractContent: data => data.content[0]?.text,
			extractStreamContent: data => data.delta?.text
		},
		gemini:
		{
			generate: generateWithGemini,
			extractContent: data => data.response.text() || data.response.candidates[0]?.output,
			extractStreamContent: chunk => chunk.text()
		},
		groq:
		{
			url: 'https://api.groq.com/openai/v1/chat/completions',
			model: "llama-3.2-90b-vision-preview",
			apiKeyHeader: 'Authorization',
			apiKeyPrefix: 'Bearer ',
			extractContent: data => data.choices[0]?.message?.content,
			extractStreamContent: data => data.choices[0]?.delta?.content
		}
	};
	const standardPrompts = ["Proofread this text but only fix grammar", "Proofread this text but only fix grammar and Markdown style", "Proofread this text improving clarity and flow", "Proofread this text, fixing only awkward parts", "Proofread this text", "Markdown OCR"];
	const apiKeyLabels = {
		chatgpt: 'OpenAI API Key:',
		claude: 'Anthropic API Key:',
		gemini: 'Google API Key:',
		groq: 'Groq API Key:'
	};

	function initializeEventListeners()
	{
		['source', 'target'].forEach(type => setupTextareaEvents(type, elements[`${type}Text`]));
		setupButtonClickEvents();
		['loadSource', 'loadTarget'].forEach(id =>
		{
			const type = id === 'loadSource' ? 'source' : 'target';
			document.getElementById(id)
				.addEventListener('change', (e) => handleFileUpload(e, elements[`${type}Text`], type))
		});
		elements.apiModelSelect.addEventListener('change', handleApiModelChange);
		elements.apiKeyInput.addEventListener('input', handleApiKeyChange);
		elements.streamingToggle.addEventListener('change', handleStreamingToggleChange);
		elements.transcribeBtn.addEventListener('click', handleTranscribeButton);
	}

	function setupTextareaEvents(type, textArea)
	{
		textArea.addEventListener('input', () => handleTextareaInput(textArea, type));
	}

	function handleTextareaInput(textArea, type)
	{
		updateStats(textArea, type);
		saveText(type, textArea.value);
	}

	function saveText(type, text)
	{
		saveToLocalStorage(`${type}Text`, text)
	}

	function setupButtonClickEvents()
	{
		const buttonActions = {
			'clearSource': () => clearText(elements.sourceText, 'source'),
			'clearTarget': () => clearText(elements.targetText, 'target'),
			'uppercaseSource': () => transformText(elements.sourceText, 'uppercase', 'source'),
			'lowercaseSource': () => transformText(elements.sourceText, 'lowercase', 'source'),
			'uppercaseTarget': () => transformText(elements.targetText, 'uppercase', 'target'),
			'lowercaseTarget': () => transformText(elements.targetText, 'lowercase', 'target'),
			'unboldSource': () => unboldText(elements.sourceText, 'source'),
			'unboldTarget': () => unboldText(elements.targetText, 'target'),
			'latexSource': () => fixLatex(elements.sourceText, 'source'),
			'latexTarget': () => fixLatex(elements.targetText, 'target'),
		};
		Object.keys(buttonActions)
			.forEach(id =>
			{
				document.getElementById(id)
					.addEventListener('click', buttonActions[id])
			});
		elements.compareBtn.addEventListener('click', compareTexts);
		elements.switchBtn.addEventListener('click', switchTexts);
		elements.generateTargetBtn.addEventListener('click', handleGenerateButton);
		elements.renderMarkdownBtn.addEventListener('click', renderMarkdown);
		elements.savePromptBtn.addEventListener('click', saveCustomPrompt);
	}

	function handleApiModelChange()
	{
		const selectedModel = elements.apiModelSelect.value;
		saveToLocalStorage('selected_api_model', selectedModel);
		updateApiKeyLabel();
		loadApiKey(selectedModel);
	}

	function handleApiKeyChange()
	{
		const apiType = elements.apiModelSelect.value;
		const apiKey = elements.apiKeyInput.value;
		validateApiKey(apiKey, apiType);
		saveApiKey(apiType, apiKey);
	}

	function handleStreamingToggleChange()
	{
		saveToLocalStorage('streaming_enabled', elements.streamingToggle.checked);
	}

	function loadInitialState()
	{
		elements.sourceText.value = getFromLocalStorage('sourceText') || '';
		elements.targetText.value = getFromLocalStorage('targetText') || '';
		const savedModel = getFromLocalStorage('selected_api_model') || 'chatgpt';
		elements.apiModelSelect.value = savedModel;
		loadApiKey(savedModel);
		elements.streamingToggle.checked = getFromLocalStorage('streaming_enabled') !== 'false';
		updateStats(elements.sourceText, 'source');
		updateStats(elements.targetText, 'target');
		updateApiKeyLabel();
		loadPrompts();
	}

	function saveToLocalStorage(key, value)
	{
		try
		{
			localStorage.setItem(key, value);
		}
		catch (e)
		{
			console.error('Error saving to localStorage:', e);
		}
	}

	function getFromLocalStorage(key)
	{
		try
		{
			return localStorage.getItem(key);
		}
		catch (e)
		{
			console.error('Error reading from localStorage:', e);
			return null;
		}
	}

	function saveApiKey(model, key)
	{
		const storageKey = API_KEYS[model];
		if (storageKey)
		{
			saveToLocalStorage(storageKey, key);
		}
	}

	function loadApiKey(model)
	{
		const storageKey = API_KEYS[model];
		if (storageKey)
		{
			elements.apiKeyInput.value = getFromLocalStorage(storageKey) || '';
		}
	}

	function getApiKey(model)
	{
		const storageKey = API_KEYS[model];
		return storageKey ? getFromLocalStorage(storageKey) || '' : '';
	}

	function updateApiKeyLabel()
	{
		const apiModel = elements.apiModelSelect.value;
		const apiKeyLabel = document.querySelector('label[for="apiKey"]');
		apiKeyLabel.textContent = apiKeyLabels[apiModel] || 'API Key:';
	}

	function handleGenerateButton()
	{
		elements.generateTargetBtn.dataset.generating === 'true' ? stopGeneration() : generateTargetText();
	}
	async function generateTargetText()
	{
		const apiModel = elements.apiModelSelect.value;
		const apiKey = getApiKey(apiModel);
		if (!apiKey)
		{
			alert("Please enter your API key.");
			return;
		}
		const selectedPrompt = elements.promptSelect.value;
		const customPrompt = elements.customPromptInput.value;
		const prompt = selectedPrompt === 'custom' ? customPrompt : selectedPrompt;
		const fullPrompt = prompt + "\n\n" + elements.sourceText.value;
		elements.targetText.value = '';
		try
		{
			setGeneratingButtonState(true);
			abortController = new AbortController();
			if (apiModel === 'gemini')
			{
				await apiConfig.gemini.generate(apiKey, fullPrompt, abortController)
			}
			else
			{
				const config = apiConfig[apiModel]
				const requestBody = {
					model: config.model,
					messages: [
					{
						role: "user",
						content: fullPrompt
					}],
					temperature: 0,
					max_tokens: apiModel === 'claude' || apiModel === 'groq' ? 8192 : 16383,
					stream: elements.streamingToggle.checked
				};
				const headers = {
					'Content-Type': 'application/json',
					[config.apiKeyHeader]: config.apiKeyPrefix + apiKey,
					...config.additionalHeaders
				};
				const response = await fetch(config.url,
				{
					method: 'POST',
					headers,
					body: JSON.stringify(requestBody),
					signal: abortController.signal
				});
				await handleResponse(response, apiModel);
			}
		}
		catch (error)
		{
			if (error.name !== 'AbortError')
			{
				handleApiError(error, apiModel);
			}
		}
		finally
		{
			setGeneratingButtonState(false);
			abortController = null;
		}
	}
	async function handleTranscribeButton()
	{
		if (elements.transcribeBtn.dataset.transcribing === 'true')
		{
			stopTranscription();
		}
		else
		{
			startTranscription();
		}
	}
	async function startTranscription()
	{
		const apiKey = getApiKey('groq');
		if (!apiKey)
		{
			alert("Please enter your Groq API key.");
			return;
		}
		const file = elements.audioFile.files[0];
		if (!file)
		{
			alert("Please select an audio file.");
			return;
		}
		const language = elements.transcribeLanguage.value;
		try
		{
			setTranscribingButtonState(true);
			transcribeAbortController = new AbortController();
			const formData = new FormData();
			formData.append('file', file);
			formData.append('model', 'whisper-large-v3');
			formData.append('temperature', '0');
			formData.append('language', language);
			formData.append('response_format', 'verbose_json');
			const response = await fetch(apiConfig.groq.url.replace('chat/completions', 'audio/transcriptions'),
			{
				method: 'POST',
				headers:
				{
					[apiConfig.groq.apiKeyHeader]: apiConfig.groq.apiKeyPrefix + apiKey,
				},
				body: formData,
				signal: transcribeAbortController.signal,
			});
			if (!response.ok)
			{
				throw new Error(`Transcription failed with status ${response.status}`);
			}
			const data = await response.json();
			elements.sourceText.value = data.text;
			updateStats(elements.sourceText, 'source');
			saveText('source', elements.sourceText.value);
		}
		catch (error)
		{
			if (error.name !== 'AbortError')
			{
				handleApiError(error, 'groq');
			}
		}
		finally
		{
			setTranscribingButtonState(false);
			transcribeAbortController = null;
		}
	}

	function stopTranscription()
	{
		if (transcribeAbortController)
		{
			transcribeAbortController.abort();
		}
	}

	function setTranscribingButtonState(isTranscribing)
	{
		elements.transcribeBtn.style.backgroundColor = isTranscribing ? 'red' : 'blue';
		elements.transcribeBtn.textContent = isTranscribing ? 'Stop Transcribe' : 'Start Transcribe';
		elements.transcribeBtn.dataset.transcribing = isTranscribing;
	}

	function setGeneratingButtonState(isGenerating)
	{
		elements.generateTargetBtn.style.backgroundColor = isGenerating ? 'red' : '';
		elements.generateTargetBtn.textContent = isGenerating ? 'Stop Generating' : 'Generate';
		elements.generateTargetBtn.dataset.generating = isGenerating;
	}
	async function handleResponse(response, apiModel)
	{
		if (!response.ok)
		{
			throw new Error(`API request failed with status ${response.status}`);
		}
		const config = apiConfig[apiModel]
		if (elements.streamingToggle.checked)
		{
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			let accumulatedText = '';
			while (true)
			{
				const
				{
					done,
					value
				} = await reader.read();
				if (done) break;
				buffer += decoder.decode(value);
				const lines = buffer.split('\n');
				for (const line of lines)
				{
					if (line.startsWith('data: '))
					{
						const data = line.slice(6);
						if (data === '[DONE]') continue;
						try
						{
							const parsed = JSON.parse(data);
							const content = config.extractStreamContent(parsed);
							if (content)
							{
								accumulatedText += content;
								elements.targetText.value = accumulatedText;
								updateStats(elements.targetText, 'target');
								saveText('target', accumulatedText);
								elements.targetText.scrollTop = elements.targetText.scrollHeight;
							}
						}
						catch (e)
						{
							console.error('Error parsing streaming JSON:', e);
						}
					}
				}
				buffer = lines.pop() || '';
			}
		}
		else
		{
			const data = await response.json();
			const content = config.extractContent(data)
			if (content)
			{
				elements.targetText.value = content;
				updateStats(elements.targetText, 'target');
				saveText('target', content);
				elements.targetText.scrollTop = elements.targetText.scrollHeight;
			}
		}
	}

	function stopGeneration()
	{
		if (abortController)
		{
			abortController.abort();
		}
	}
	async function generateWithGemini(apiKey, fullPrompt, abortController)
	{
		const
		{
			GoogleGenerativeAI
		} = await import("@google/generative-ai");
		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel(
		{
			model: "gemini-exp-1121"
		});
		const generationConfig = {
			temperature: 0,
			maxOutputTokens: 8192
		};
		try
		{
			if (elements.streamingToggle.checked)
			{
				const response = await model.generateContentStream(fullPrompt, [generationConfig]);
				let accumulatedText = '';
				for await (const chunk of response.stream)
				{
					if (abortController.signal.aborted) throw new DOMException('Aborted', 'AbortError')
					const content = apiConfig.gemini.extractStreamContent(chunk);
					accumulatedText += content;
					elements.targetText.value = accumulatedText;
					updateStats(elements.targetText, 'target');
					saveText('target', accumulatedText);
					elements.targetText.scrollTop = elements.targetText.scrollHeight;
				}
			}
			else
			{
				const response = await model.generateContent(fullPrompt, [generationConfig]);
				const content = apiConfig.gemini.extractContent(response);
				elements.targetText.value = content;
				updateStats(elements.targetText, 'target');
				saveText('target', content);
				elements.targetText.scrollTop = elements.targetText.scrollHeight;
			}
		}
		catch (error)
		{
			if (error.name === 'AbortError')
			{
				throw error;
			}
			console.error('Gemini API Error:', error);
			throw new Error(`Gemini API error: ${error.message}`);
		}
	}

	function handleFileUpload(event, textArea, type)
	{
		const file = event.target.files[0];
		if (file)
		{
			const reader = new FileReader();
			reader.onload = (e) =>
			{
				textArea.value = e.target.result;
				updateStats(textArea, type);
				saveText(type, textArea.value);
			};
			reader.readAsText(file);
		}
	}

	function clearText(textArea, type)
	{
		textArea.value = "";
		updateStats(textArea, type);
		saveText(type, '');
	}

	function transformText(textArea, type, storageType)
	{
		textArea.value = type === 'uppercase' ? textArea.value.toUpperCase() : textArea.value.toLowerCase();
		updateStats(textArea, storageType);
		saveText(storageType, textArea.value);
	}

	function unboldText(textArea, type)
	{
		textArea.value = textArea.value.replace(/\*\*/g, '');
		handleTextareaInput(textArea, type);
	}

	function fixLatex(textArea, type)
	{
		let text = textArea.value;
		text = text.replace(/\\[\s\n]*\[([\s\S]*?)\\[\s\n]*\]/g, (match, p1) => `$$\n${p1.trim()}\n$$`);
		text = text.replace(/\\[\s\n]*\(([\s\S]*?)\\[\s\n]*\)/g, (match, p1) => `$${p1.trim()}$`);
		textArea.value = text;
		handleTextareaInput(textArea, type);
	}

	function updateStats(textArea, type)
	{
		const words = textArea.value.trim()
			.split(/\s+/)
			.length;
		const chars = textArea.value.length;
		document.getElementById(`${type}Words`)
			.textContent = words;
		document.getElementById(`${type}Chars`)
			.textContent = chars;
	}

	function switchTexts()
	{
		const temp = elements.sourceText.value;
		elements.sourceText.value = elements.targetText.value;
		elements.targetText.value = temp;
		updateStats(elements.sourceText, 'source');
		updateStats(elements.targetText, 'target');
		saveText('source', elements.sourceText.value)
		saveText('target', elements.targetText.value)
	}

	function compareTexts()
	{
		const source = elements.sourceText.value;
		const target = elements.targetText.value;
		const dmp = new diff_match_patch();
		const diffs = dmp.diff_main(source, target);
		dmp.diff_cleanupSemantic(diffs);
		document.getElementById('singleColumnDiff')
			.innerHTML = generateSingleColumnDiffView(diffs);
		const [leftColumn, rightColumn] = generateDoubleColumnDiffView(diffs);
		document.getElementById('leftColumn')
			.innerHTML = leftColumn;
		document.getElementById('rightColumn')
			.innerHTML = rightColumn;
		updateDiffStats(diffs);
		const levenshtein = dmp.diff_levenshtein(diffs);
		document.getElementById('levenshtein')
			.textContent = levenshtein;
	}

	function generateSingleColumnDiffView(diffs)
	{
		return diffs.map(([type, text]) =>
			{
				const className = type === 0 ? 'diff-equal' : type === -1 ? 'diff-deletion' : 'diff-insertion';
				return `<span class="${className}">${escapeHtml(text)}</span>`;
			})
			.join('');
	}

	function generateDoubleColumnDiffView(diffs)
	{
		let leftHtml = '';
		let rightHtml = '';
		diffs.forEach(([type, text]) =>
		{
			const escapedText = escapeHtml(text);
			if (type === 0)
			{
				leftHtml += `<span class="diff-equal">${escapedText}</span>`;
				rightHtml += `<span class="diff-equal">${escapedText}</span>`;
			}
			else if (type === -1)
			{
				leftHtml += `<span class="diff-deletion">${escapedText}</span>`;
			}
			else if (type === 1)
			{
				rightHtml += `<span class="diff-insertion">${escapedText}</span>`;
			}
		});
		return [leftHtml, rightHtml];
	}

	function updateDiffStats(diffs)
	{
		let added = 0,
			removed = 0,
			common = 0;
		diffs.forEach(([type, text]) =>
		{
			if (type === 1) added += text.length;
			else if (type === -1) removed += text.length;
			else common += text.length;
		});
		const total = added + removed + common;
		const commonPercentage = (common / total * 100)
			.toFixed(2);
		const differencePercentage = (100 - parseFloat(commonPercentage))
			.toFixed(2);
		document.getElementById('commonPercentage')
			.textContent = commonPercentage;
		document.getElementById('differencePercentage')
			.textContent = differencePercentage;
		document.getElementById('commonSymbols')
			.textContent = common;
		document.getElementById('differenceSymbols')
			.textContent = added + removed;
	}

	function escapeHtml(unsafe)
	{
		return unsafe.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	function renderMarkdown()
	{
		const sourceMarkdown = elements.sourceText.value;
		const targetMarkdown = elements.targetText.value;
		document.getElementById('leftColumn')
			.innerHTML = marked.parse(sourceMarkdown);
		document.getElementById('rightColumn')
			.innerHTML = marked.parse(targetMarkdown);
		MathJax.typesetPromise();
	}

	function loadPrompts()
	{
		const prompts = JSON.parse(getFromLocalStorage('prompts') || '[]');
		elements.promptSelect.innerHTML = standardPrompts.map(prompt => `<option value="${prompt}">${prompt}</option>`)
			.join('') + '<option value="custom">Custom prompt</option>';
		prompts.forEach((prompt, index) =>
		{
			const option = document.createElement('option');
			option.value = prompt;
			option.textContent = `Custom ${index + 1}: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`;
			elements.promptSelect.insertBefore(option, elements.promptSelect.lastElementChild);
		});
		elements.promptSelect.addEventListener('change', () =>
		{
			elements.customPromptContainer.style.display = elements.promptSelect.value === 'custom' ? 'block' : 'none';
		});
	}

	function saveCustomPrompt()
	{
		const customPrompt = elements.customPromptInput.value.trim();
		if (customPrompt)
		{
			const prompts = JSON.parse(getFromLocalStorage('prompts') || '[]');
			prompts.push(customPrompt);
			saveToLocalStorage('prompts', JSON.stringify(prompts));
			loadPrompts();
			elements.customPromptInput.value = '';
			alert('Custom prompt saved!');
		}
		else
		{
			alert('Please enter a custom prompt before saving.');
		}
	}

	function handleApiError(error, apiType)
	{
		const baseErrorMessage = "An error occurred while generating text. ";
		const apiErrorMessages = {
			chatgpt: "Please check your OpenAI API key and ensure your request respects OpenAI rate limits.",
			claude: "Please check your Anthropic API key and ensure your request respects Anthropic rate limits.",
			gemini: "Please check your Google API key and ensure your request respects Google rate limits.",
			groq: "Please check your Groq API key and ensure your request respects Groq rate limits."
		};
		const errorMessage = baseErrorMessage + (apiErrorMessages[apiType] || "Please check your API key and request parameters.");
		if (error.response && error.response.status)
		{
			alert(`${errorMessage}\n\nStatus: ${error.response.status}`);
		}
		else if (error.message)
		{
			alert(`${errorMessage}\n\nMessage: ${error.message}`);
		}
		else
		{
			alert(errorMessage)
		}
		console.error("API Error:", error);
	}

	function validateApiKey(apiKey, apiType)
	{
		if (!apiKey) return false;
		const validationPatterns = {
			chatgpt: /^sk-[A-Za-z0-9]{32,}$/,
			claude: /^sk-ant-[A-Za-z0-9]{32,}$/,
			gemini: /^AI[A-Za-z0-9-_]{32,}$/,
			groq: /^gsk_[A-Za-z0-9]{32,}$/
		};
		const pattern = validationPatterns[apiType];
		const isValid = pattern ? pattern.test(apiKey) : true;
		elements.apiKeyInput.classList.toggle('invalid', !isValid);
		return isValid;
	}
	window.addEventListener('beforeunload', () =>
	{
		saveText('source', elements.sourceText.value)
		saveText('target', elements.targetText.value)
	});
	window.onerror = (msg, url, lineNo, columnNo, error) =>
	{
		console.error('Global error:',
		{
			msg,
			url,
			lineNo,
			columnNo,
			error
		});
		alert('An unexpected error occurred. Please refresh the page and try again.');
		return false;
	};
	initializeEventListeners();
	loadInitialState();
});