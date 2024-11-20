document.addEventListener('DOMContentLoaded', () => {
	// DOM element references for various UI components
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
		streamingToggle: document.getElementById('streamingToggle')
	};
	let abortController = null;
	// API key storage keys for different models
	const API_KEYS = {
		chatgpt: 'chatgpt_api_key',
		claude: 'claude_api_key',
		groq: 'groq_api_key'
	};
	// Initialize event listeners for various UI interactions
	initializeEventListeners();
	// Load initial state from localStorage and set up the UI
	loadInitialState();
	/**
	 * Initializes event listeners for various buttons and inputs.
	 */
	function initializeEventListeners() {
		// File input handling for loading source and target text files
		document.getElementById('loadSource').addEventListener('change', (e) => loadFile(e, elements.sourceText));
		document.getElementById('loadTarget').addEventListener('change', (e) => loadFile(e, elements.targetText));
		// Clear buttons for source and target text areas
		document.getElementById('clearSource').addEventListener('click', () => clearText(elements.sourceText));
		document.getElementById('clearTarget').addEventListener('click', () => clearText(elements.targetText));
		// Text transformation buttons (uppercase/lowercase) for source and target text areas
		document.getElementById('uppercaseSource').addEventListener('click', () => transformText(elements.sourceText, 'uppercase'));
		document.getElementById('lowercaseSource').addEventListener('click', () => transformText(elements.sourceText, 'lowercase'));
		document.getElementById('uppercaseTarget').addEventListener('click', () => transformText(elements.targetText, 'uppercase'));
		document.getElementById('lowercaseTarget').addEventListener('click', () => transformText(elements.targetText, 'lowercase'));
		document.getElementById('unboldSource').addEventListener('click', () => unboldText(elements.sourceText));
		document.getElementById('unboldTarget').addEventListener('click', () => unboldText(elements.targetText));
		document.getElementById('latexSource').addEventListener('click', () => fixLatex(elements.sourceText));
		document.getElementById('latexTarget').addEventListener('click', () => fixLatex(elements.targetText));
		// Main functionality buttons: compare, switch, generate, render markdown, and save custom prompt
		elements.compareBtn.addEventListener('click', compareTexts);
		elements.switchBtn.addEventListener('click', switchTexts);
		elements.generateTargetBtn.addEventListener('click', handleGenerateButton);
		elements.renderMarkdownBtn.addEventListener('click', renderMarkdown);
		elements.savePromptBtn.addEventListener('click', saveCustomPrompt);
		// Input event listeners for source and target text areas to update stats and save to localStorage
		elements.sourceText.addEventListener('input', () => {
			updateStats(elements.sourceText, 'source');
			saveToLocalStorage('sourceText', elements.sourceText.value);
		});
		elements.targetText.addEventListener('input', () => {
			updateStats(elements.targetText, 'target');
			saveToLocalStorage('targetText', elements.targetText.value);
		});
		// API model selection change handler to update API key and save the selected model
		elements.apiModelSelect.addEventListener('change', () => {
			const selectedModel = elements.apiModelSelect.value;
			saveToLocalStorage('selected_api_model', selectedModel);
			updateApiKeyLabel();
			loadApiKey(selectedModel);
		});
		// API key input handler to save the API key for the selected model
		elements.apiKeyInput.addEventListener('input', () => {
			const selectedModel = elements.apiModelSelect.value;
			saveApiKey(selectedModel, elements.apiKeyInput.value);
		});
		// Streaming toggle change handler to save the streaming preference
		elements.streamingToggle.addEventListener('change', () => {
			saveToLocalStorage('streaming_enabled', elements.streamingToggle.checked);
		});
	}
	/**
	 * Loads the initial state from localStorage and updates the UI accordingly.
	 */
	function loadInitialState() {
		// Load saved text content for source and target text areas
		elements.sourceText.value = getFromLocalStorage('sourceText') || '';
		elements.targetText.value = getFromLocalStorage('targetText') || '';
		// Load saved API model selection and corresponding API key
		const savedModel = getFromLocalStorage('selected_api_model') || 'chatgpt';
		elements.apiModelSelect.value = savedModel;
		loadApiKey(savedModel);
		// Load streaming toggle state
		elements.streamingToggle.checked = getFromLocalStorage('streaming_enabled') !== 'false';
		// Update UI elements like word/character stats and API key label
		updateStats(elements.sourceText, 'source');
		updateStats(elements.targetText, 'target');
		updateApiKeyLabel();
		// Load saved custom prompts
		loadPrompts();
	}
	/**
	 * Saves the API key for the selected model to localStorage.
	 * @param {string} model - The selected API model.
	 * @param {string} key - The API key to save.
	 */
	function saveApiKey(model, key) {
		const storageKey = API_KEYS[model];
		if (storageKey) {
			saveToLocalStorage(storageKey, key);
		}
	}
	/**
	 * Loads the API key for the selected model from localStorage.
	 * @param {string} model - The selected API model.
	 */
	function loadApiKey(model) {
		const storageKey = API_KEYS[model];
		if (storageKey) {
			elements.apiKeyInput.value = getFromLocalStorage(storageKey) || '';
		}
	}

	function getApiKey(model) {
		const storageKey = API_KEYS[model];
		return storageKey ? getFromLocalStorage(storageKey) : '';
	}
	/**
	 * Updates the label for the API key input field based on the selected API model.
	 */
	function updateApiKeyLabel() {
		const apiModel = elements.apiModelSelect.value;
		const apiKeyLabel = document.querySelector('label[for="apiKey"]');
		const labels = {
			chatgpt: 'OpenAI API Key:',
			claude: 'Anthropic API Key:',
			groq: 'Groq API Key:'
		};
		apiKeyLabel.textContent = labels[apiModel] || 'API Key:';
	}
	/**
	 * Handles the click event of the Generate button,
	 * toggles between generating and stopping the generation.
	 */
	function handleGenerateButton() {
		if (elements.generateTargetBtn.dataset.generating === 'true') {
			// Currently generating, so stop the generation
			stopGeneration();
		} else {
			// Not generating, start generation
			generateTargetText();
		}
	}
	/**
	 * Generates target text using the selected API model and prompt.
	 * Handles both streaming and non-streaming responses.
	 */
	async function generateTargetText() {
		const apiModel = elements.apiModelSelect.value;
		const apiKey = getApiKey(apiModel);
		if (!apiKey) {
			alert("Please enter your API key.");
			return;
		}
		const selectedPrompt = elements.promptSelect.value;
		const customPrompt = elements.customPromptInput.value;
		const prompt = selectedPrompt === 'custom' ? customPrompt : selectedPrompt;
		// Combine the prompt with the source text
		const fullPrompt = prompt + "\n\n" + elements.sourceText.value;
		// Clear the target text area before generating new content
		elements.targetText.value = '';
		try {
			// Change the Generate button to red and update text to 'Stop Generating'
			elements.generateTargetBtn.style.backgroundColor = 'red';
			elements.generateTargetBtn.textContent = 'Stop Generating';
			elements.generateTargetBtn.dataset.generating = 'true';
			// Initialize AbortController to allow stopping the generation
			abortController = new AbortController();
			// Map API models to their respective generation functions
			const generators = {
				chatgpt: generateWithChatGPT,
				claude: generateWithClaude,
				groq: generateWithGroq
			};
			const generator = generators[apiModel];
			if (generator) {
				await generator(apiKey, fullPrompt, abortController);
			}
		} catch (error) {
			if (error.name === 'AbortError') {
				console.log('Generation aborted by the user.');
			} else {
				handleApiError(error, apiModel);
			}
		} finally {
			// Reset the Generate button after generation is complete or stopped
			resetGenerateButton();
		}
	}
	/**
	 * Saves a value to localStorage.
	 * @param {string} key - The key under which to save the value.
	 * @param {string} value - The value to save.
	 */
	function saveToLocalStorage(key, value) {
		try {
			localStorage.setItem(key, value);
		} catch (e) {
			console.error('Error saving to localStorage:', e);
		}
	}
	/**
	 * Retrieves a value from localStorage.
	 * @param {string} key - The key of the value to retrieve.
	 * @returns {string|null} - The retrieved value or null if not found.
	 */
	function getFromLocalStorage(key) {
		try {
			return localStorage.getItem(key);
		} catch (e) {
			console.error('Error reading from localStorage:', e);
			return null;
		}
	}
	/**
	 * Stops the ongoing generation by aborting the fetch request.
	 */
	function stopGeneration() {
		if (abortController) {
			abortController.abort();
		}
	}
	/**
	 * Resets the Generate button to its original state.
	 */
	function resetGenerateButton() {
		elements.generateTargetBtn.style.backgroundColor = '';
		elements.generateTargetBtn.textContent = 'Generate';
		elements.generateTargetBtn.dataset.generating = 'false';
		abortController = null;
	}
	async function generateWithChatGPT(apiKey, fullPrompt, abortController) {
		const requestBody = {
			model: "chatgpt-4o-latest",
			messages: [{
				role: "user",
				content: fullPrompt
			}],
			temperature: 0,
			max_tokens: 16383,
			stream: elements.streamingToggle.checked
		};
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify(requestBody),
			signal: abortController.signal
		});
		await handleResponse(response, 'chatgpt');
	}
	async function generateWithClaude(apiKey, fullPrompt, abortController) {
		const requestBody = {
			model: "claude-3-5-sonnet-20241022",
			messages: [{
				role: "user",
				content: fullPrompt
			}],
			temperature: 0,
			max_tokens: 8192,
			stream: elements.streamingToggle.checked
		};
		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify(requestBody),
			signal: abortController.signal
		});
		await handleResponse(response, 'claude');
	}
	async function generateWithGroq(apiKey, fullPrompt, abortController) {
		const requestBody = {
			messages: [{
				role: "user",
				content: fullPrompt
			}],
			model: "llama-3.2-90b-text-preview",
			temperature: 0,
			max_tokens: 8192,
			stream: elements.streamingToggle.checked
		};
		const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify(requestBody),
			signal: abortController.signal
		});
		await handleResponse(response, 'groq');
	}
	async function handleResponse(response, apiType) {
		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`);
		}
		if (elements.streamingToggle.checked) {
			await handleStreamingResponse(response, apiType);
		} else {
			await handleNonStreamingResponse(response, apiType);
		}
	}
	async function handleStreamingResponse(response, apiType) {
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let accumulatedText = '';
		while (true) {
			const {
				done,
				value
			} = await reader.read();
			if (done) break;
			buffer += decoder.decode(value);
			while (true) {
				const newlineIndex = buffer.indexOf('\n');
				if (newlineIndex === -1) break;
				const line = buffer.slice(0, newlineIndex);
				buffer = buffer.slice(newlineIndex + 1);
				if (line.startsWith('data: ')) {
					const data = line.slice(6);
					if (data === '[DONE]') continue;
					try {
						const parsed = JSON.parse(data);
						let content;
						switch (apiType) {
							case 'chatgpt':
								content = parsed.choices[0]?.delta?.content;
								break;
							case 'claude':
								content = parsed.delta?.text;
								break;
							case 'groq':
								content = parsed.choices[0]?.delta?.content;
								break;
						}
						if (content) {
							accumulatedText += content;
							elements.targetText.value = accumulatedText;
							updateStats(elements.targetText, 'target');
							saveToLocalStorage('targetText', accumulatedText);
							elements.targetText.scrollTop = elements.targetText.scrollHeight;
						}
					} catch (e) {
						console.error('Error parsing streaming JSON:', e);
					}
				}
			}
		}
	}
	async function handleNonStreamingResponse(response, apiType) {
		const data = await response.json();
		let content;
		switch (apiType) {
			case 'chatgpt':
				content = data.choices[0]?.message?.content;
				break;
			case 'claude':
				content = data.content[0]?.text;
				break;
			case 'groq':
				content = data.choices[0]?.message?.content;
				break;
		}
		if (content) {
			elements.targetText.value = content;
			updateStats(elements.targetText, 'target');
			saveToLocalStorage('targetText', content);
			elements.targetText.scrollTop = elements.targetText.scrollHeight;
		}
	}
	/**
	 * Handles file loading for source or target text areas.
	 * @param {Event} event - The file input change event.
	 * @param {HTMLElement} textArea - The text area to load the file content into.
	 */
	function loadFile(event, textArea) {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function(e) {
				textArea.value = e.target.result;
				updateStats(textArea, textArea === elements.sourceText ? 'source' : 'target');
				saveToLocalStorage(textArea === elements.sourceText ? 'sourceText' : 'targetText', textArea.value);
			};
			reader.readAsText(file);
		}
	}
	/**
	 * Clears the content of a text area and updates the stats.
	 * @param {HTMLElement} textArea - The text area to clear.
	 */
	function clearText(textArea) {
		textArea.value = "";
		updateStats(textArea, textArea === elements.sourceText ? 'source' : 'target');
		saveToLocalStorage(textArea === elements.sourceText ? 'sourceText' : 'targetText', '');
	}
	/**
	 * Transforms the text in a text area to uppercase or lowercase.
	 * @param {HTMLElement} textArea - The text area to transform.
	 * @param {string} type - The transformation type ('uppercase' or 'lowercase').
	 */
	function transformText(textArea, type) {
		textArea.value = type === 'uppercase' ? textArea.value.toUpperCase() : textArea.value.toLowerCase();
		updateStats(textArea, textArea === elements.sourceText ? 'source' : 'target');
		saveToLocalStorage(textArea === elements.sourceText ? 'sourceText' : 'targetText', textArea.value);
	}
	/**
	 * Removes bold markdown syntax from text.
	 * @param {HTMLElement} textArea - The text area to transform.
	 */
	function unboldText(textArea) {
		textArea.value = textArea.value.replace(/\*\*/g, '');
		updateStats(textArea, textArea === elements.sourceText ? 'source' : 'target');
		saveToLocalStorage(textArea === elements.sourceText ? 'sourceText' : 'targetText', textArea.value);
	}
	/**
	 * Fixes LaTeX syntax in text.
	 * @param {HTMLElement} textArea - The text area to transform.
	 */
	function fixLatex(textArea) {
		let text = textArea.value;
		// Replace \[ \] with $$ $$ without any spaces
		text = text.replace(/\\[\s\n]*\[([\s\S]*?)\\[\s\n]*\]/g, (match, p1) => {
			return `$$\n${p1.trim()}\n$$`;
		});
		// Replace \( \) with $ $ without any spaces
		text = text.replace(/\\[\s\n]*\(([\s\S]*?)\\[\s\n]*\)/g, (match, p1) => {
			return `$${p1.trim()}$`;
		});
		textArea.value = text;
		updateStats(textArea, textArea === elements.sourceText ? 'source' : 'target');
		saveToLocalStorage(textArea === elements.sourceText ? 'sourceText' : 'targetText', textArea.value);
	}
	/**
	 * Updates the word and character count stats for a text area.
	 * @param {HTMLElement} textArea - The text area to analyze.
	 * @param {string} type - The type of text area ('source' or 'target').
	 */
	function updateStats(textArea, type) {
		const words = textArea.value.trim().split(/\s+/).length;
		const chars = textArea.value.length;
		document.getElementById(`${type}Words`).textContent = words;
		document.getElementById(`${type}Chars`).textContent = chars;
	}
	/**
	 * Switches the content between the source and target text areas.
	 */
	function switchTexts() {
		const temp = elements.sourceText.value;
		elements.sourceText.value = elements.targetText.value;
		elements.targetText.value = temp;
		updateStats(elements.sourceText, 'source');
		updateStats(elements.targetText, 'target');
		saveToLocalStorage('sourceText', elements.sourceText.value);
		saveToLocalStorage('targetText', elements.targetText.value);
	}
	/**
	 * Compares the content of the source and target text areas and displays the differences.
	 */
	function compareTexts() {
		const source = elements.sourceText.value;
		const target = elements.targetText.value;
		const dmp = new diff_match_patch();
		const diffs = dmp.diff_main(source, target);
		dmp.diff_cleanupSemantic(diffs);
		// Display the differences in single and double column views
		document.getElementById('singleColumnDiff').innerHTML = generateSingleColumnDiffView(diffs);
		const [leftColumn, rightColumn] = generateDoubleColumnDiffView(diffs);
		document.getElementById('leftColumn').innerHTML = leftColumn;
		document.getElementById('rightColumn').innerHTML = rightColumn;
		// Update the difference stats
		updateDiffStats(diffs);
		// Calculate and display the Levenshtein distance
		const levenshtein = dmp.diff_levenshtein(diffs);
		document.getElementById('levenshtein').textContent = levenshtein;
	}
	/**
	 * Generates the single-column diff view for the differences between source and target texts.
	 * @param {Array} diffs - The array of differences.
	 * @returns {string} - The HTML string for the single-column diff view.
	 */
	function generateSingleColumnDiffView(diffs) {
		return diffs.map(([type, text]) => {
			const className = type === 0 ? 'diff-equal' : type === -1 ? 'diff-deletion' : 'diff-insertion';
			return `<span class="${className}">${escapeHtml(text)}</span>`;
		}).join('');
	}
	/**
	 * Generates the double-column diff view for the differences between source and target texts.
	 * @param {Array} diffs - The array of differences.
	 * @returns {Array} - An array containing the HTML for the left and right columns.
	 */
	function generateDoubleColumnDiffView(diffs) {
		let leftHtml = '';
		let rightHtml = '';
		diffs.forEach(([type, text]) => {
			const escapedText = escapeHtml(text);
			if (type === 0) {
				leftHtml += `<span class="diff-equal">${escapedText}</span>`;
				rightHtml += `<span class="diff-equal">${escapedText}</span>`;
			} else if (type === -1) {
				leftHtml += `<span class="diff-deletion">${escapedText}</span>`;
			} else if (type === 1) {
				rightHtml += `<span class="diff-insertion">${escapedText}</span>`;
			}
		});
		return [leftHtml, rightHtml];
	}
	/**
	 * Updates the difference stats (added, removed, common symbols) and displays them.
	 * @param {Array} diffs - The array of differences.
	 */
	function updateDiffStats(diffs) {
		let added = 0,
			removed = 0,
			common = 0;
		diffs.forEach(([type, text]) => {
			if (type === 1) added += text.length;
			else if (type === -1) removed += text.length;
			else common += text.length;
		});
		const total = added + removed + common;
		const commonPercentage = (common / total * 100).toFixed(2);
		const differencePercentage = (100 - parseFloat(commonPercentage)).toFixed(2);
		// Update the UI with the calculated stats
		document.getElementById('commonPercentage').textContent = commonPercentage;
		document.getElementById('differencePercentage').textContent = differencePercentage;
		document.getElementById('commonSymbols').textContent = common;
		document.getElementById('differenceSymbols').textContent = added + removed;
	}
	/**
	 * Escapes HTML special characters to prevent XSS attacks.
	 * @param {string} unsafe - The unsafe string to escape.
	 * @returns {string} - The escaped string.
	 */
	function escapeHtml(unsafe) {
		return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	}
	/**
	 * Renders the markdown content from the source and target text areas into the double-column markdown view.
	 */
	function renderMarkdown() {
		const sourceMarkdown = elements.sourceText.value;
		const targetMarkdown = elements.targetText.value;
		const leftHtml = marked.parse(sourceMarkdown);
		const rightHtml = marked.parse(targetMarkdown);
		document.getElementById('leftColumn').innerHTML = leftHtml;
		document.getElementById('rightColumn').innerHTML = rightHtml;
	
		// Trigger MathJax typesetting
		MathJax.typesetPromise();
	}
	/**
	 * Loads saved custom prompts from localStorage and populates the prompt select dropdown.
	 */
	function loadPrompts() {
		const prompts = JSON.parse(getFromLocalStorage('chatgpt_prompts') || '[]');
		elements.promptSelect.innerHTML = `
            <option value="Proofread this text but only fix grammar">Proofread this text but only fix grammar</option>
            <option value="Proofread this text but only fix grammar and Markdown style">Proofread this text but only fix grammar and Markdown style</option>
            <option value="Proofread this text improving clarity and flow">Proofread this text improving clarity and flow</option>
            <option value="Proofread this text, fixing only awkward parts">Proofread this text, fixing only awkward parts</option>
            <option value="Proofread this text">Proofread this text</option>
            <option value="Markdown OCR">Markdown OCR</option>
            <option value="custom">Custom prompt</option>
        `;
		prompts.forEach((prompt, index) => {
			const option = document.createElement('option');
			option.value = prompt;
			option.textContent = `Custom ${index + 1}: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`;
			elements.promptSelect.insertBefore(option, elements.promptSelect.lastElementChild);
		});
		// Show or hide the custom prompt input based on the selected option
		elements.promptSelect.addEventListener('change', function() {
			elements.customPromptContainer.style.display = this.value === 'custom' ? 'block' : 'none';
		});
	}
	/**
	 * Saves a custom prompt entered by the user to localStorage.
	 */
	function saveCustomPrompt() {
		const customPrompt = elements.customPromptInput.value.trim();
		if (customPrompt) {
			const prompts = JSON.parse(getFromLocalStorage('chatgpt_prompts') || '[]');
			prompts.push(customPrompt);
			saveToLocalStorage('chatgpt_prompts', JSON.stringify(prompts));
			loadPrompts();
			elements.customPromptInput.value = '';
			alert('Custom prompt saved!');
		} else {
			alert('Please enter a custom prompt before saving.');
		}
	}
	/**
	 * Handles API errors and displays appropriate error messages to the user.
	 * @param {Error} error - The error object.
	 * @param {string} apiType - The type of API (chatgpt, claude, groq).
	 */
	function handleApiError(error, apiType) {
		let errorMessage = "An error occurred while generating text. ";
		const apiMessages = {
			chatgpt: "Please check your OpenAI API key.",
			claude: "Please check your Anthropic API key.",
			groq: "Please check your Groq API key."
		};
		errorMessage += apiMessages[apiType] || "Please check your API key.";
		if (error.response) {
			errorMessage += `\n\nError ${error.response.status}: ${error.response.statusText}`;
		}
		alert(errorMessage);
		console.error("API Error:", error);
	}
	/**
	 * Validates the API key format based on the selected API model.
	 * @param {string} apiKey - The API key to validate.
	 * @param {string} apiType - The type of API (chatgpt, claude, groq).
	 * @returns {boolean} - True if the API key is valid, false otherwise.
	 */
	function validateApiKey(apiKey, apiType) {
		if (!apiKey) {
			return false;
		}
		// Basic validation patterns for different API keys
		const validationPatterns = {
			chatgpt: /^sk-[A-Za-z0-9]{32,}$/,
			claude: /^sk-ant-[A-Za-z0-9]{32,}$/,
			groq: /^gsk_[A-Za-z0-9]{32,}$/
		};
		const pattern = validationPatterns[apiType];
		return pattern ? pattern.test(apiKey) : true;
	}
	/**
	 * Handles changes to the API key input field and validates the key.
	 */
	function handleApiKeyChange() {
		const apiType = elements.apiModelSelect.value;
		const apiKey = elements.apiKeyInput.value;
		if (apiKey && !validateApiKey(apiKey, apiType)) {
			elements.apiKeyInput.classList.add('invalid');
		} else {
			elements.apiKeyInput.classList.remove('invalid');
			saveApiKey(apiType, apiKey);
		}
	}
	// Add event listener for API key input validation
	elements.apiKeyInput.addEventListener('input', handleApiKeyChange);
	// Save unsaved state to localStorage before the window unloads
	window.addEventListener('beforeunload', (event) => {
		saveToLocalStorage('sourceText', elements.sourceText.value);
		saveToLocalStorage('targetText', elements.targetText.value);
	});
	// Global error handler to catch and handle unexpected errors
	window.onerror = function(msg, url, lineNo, columnNo, error) {
		console.error('Global error:', {
			msg,
			url,
			lineNo,
			columnNo,
			error
		});
		alert('An unexpected error occurred. Please refresh the page and try again.');
		return false;
	};
});