document.addEventListener('DOMContentLoaded', () => {
	const sourceText = document.getElementById('sourceText');
	const targetText = document.getElementById('targetText');
	const compareBtn = document.getElementById('compareBtn');
	const switchBtn = document.getElementById('switchBtn');
	const generateTargetBtn = document.getElementById('generateTarget');
	const apiKeyInput = document.getElementById('apiKey');
	const promptSelect = document.getElementById('promptSelect');
	const customPromptContainer = document.getElementById('customPromptContainer');
	const customPromptInput = document.getElementById('customPrompt');
	const savePromptBtn = document.getElementById('savePrompt');
	const streamingToggle = document.getElementById('streamingToggle');
	document.getElementById('loadSource').addEventListener('change', (e) => loadFile(e, sourceText));
	document.getElementById('loadTarget').addEventListener('change', (e) => loadFile(e, targetText));
	document.getElementById('clearSource').addEventListener('click', () => clearText(sourceText));
	document.getElementById('clearTarget').addEventListener('click', () => clearText(targetText));
	document.getElementById('uppercaseSource').addEventListener('click', () => transformText(sourceText, 'uppercase'));
	document.getElementById('lowercaseSource').addEventListener('click', () => transformText(sourceText, 'lowercase'));
	document.getElementById('uppercaseTarget').addEventListener('click', () => transformText(targetText, 'uppercase'));
	document.getElementById('lowercaseTarget').addEventListener('click', () => transformText(targetText, 'lowercase'));
	compareBtn.addEventListener('click', compareTexts);
	switchBtn.addEventListener('click', switchTexts);
	generateTargetBtn.addEventListener('click', generateTargetText);
	savePromptBtn.addEventListener('click', saveCustomPrompt);
	sourceText.addEventListener('input', () => {
		updateStats(sourceText, 'source');
		saveToLocalStorage('sourceText', sourceText.value);
	});
	targetText.addEventListener('input', () => {
		updateStats(targetText, 'target');
		saveToLocalStorage('targetText', targetText.value);
	});
	apiKeyInput.addEventListener('input', () => {
		saveToLocalStorage('chatgpt_api_key', apiKeyInput.value);
	});
	streamingToggle.addEventListener('change', () => {
		saveToLocalStorage('streaming_enabled', streamingToggle.checked);
	});
	sourceText.value = getFromLocalStorage('sourceText') || '';
	targetText.value = getFromLocalStorage('targetText') || '';
	apiKeyInput.value = getFromLocalStorage('chatgpt_api_key') || '';
	streamingToggle.checked = getFromLocalStorage('streaming_enabled') !== 'false';
	updateStats(sourceText, 'source');
	updateStats(targetText, 'target');
	loadPrompts();

	function loadFile(event, textArea) {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function(e) {
				textArea.value = e.target.result;
				updateStats(textArea, textArea === sourceText ? 'source' : 'target');
				saveToLocalStorage(textArea === sourceText ? 'sourceText' : 'targetText', textArea.value);
			};
			reader.readAsText(file);
		}
	}

	function clearText(textArea) {
		textArea.value = "";
		updateStats(textArea, textArea === sourceText ? 'source' : 'target');
		saveToLocalStorage(textArea === sourceText ? 'sourceText' : 'targetText', '');
	}

	function transformText(textArea, type) {
		textArea.value = type === 'uppercase' ? textArea.value.toUpperCase() : textArea.value.toLowerCase();
		updateStats(textArea, textArea === sourceText ? 'source' : 'target');
		saveToLocalStorage(textArea === sourceText ? 'sourceText' : 'targetText', textArea.value);
	}

	function updateStats(textArea, type) {
		const words = textArea.value.trim().split(/\s+/).length;
		const chars = textArea.value.length;
		document.getElementById(`${type}Words`).textContent = words;
		document.getElementById(`${type}Chars`).textContent = chars;
	}

	function switchTexts() {
		const temp = sourceText.value;
		sourceText.value = targetText.value;
		targetText.value = temp;
		updateStats(sourceText, 'source');
		updateStats(targetText, 'target');
		saveToLocalStorage('sourceText', sourceText.value);
		saveToLocalStorage('targetText', targetText.value);
	}
	async function generateTargetText() {
		const apiKey = apiKeyInput.value;
		if (!apiKey) {
			alert("Please enter your ChatGPT API key.");
			return;
		}
		saveToLocalStorage('chatgpt_api_key', apiKey);
		const selectedPrompt = promptSelect.value;
		const customPrompt = customPromptInput.value;
		const prompt = selectedPrompt === 'custom' ? customPrompt : selectedPrompt;
		const fullPrompt = prompt + "\n\n" + sourceText.value;
		targetText.value = '';
		try {
			const requestBody = {
				model: "chatgpt-4o-latest",
				messages: [{
					role: "user",
					content: fullPrompt
				}],
				temperature: 0,
				max_tokens: 16383,
				stream: streamingToggle.checked
			};
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`
				},
				body: JSON.stringify(requestBody)
			});
			if (streamingToggle.checked) {
				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = '';
				let accumulatedText = '';
				while (true) {
					const { done, value } = await reader.read();
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
								const content = parsed.choices[0]?.delta?.content;
								if (content) {
									accumulatedText += content;
									targetText.value = accumulatedText;
									updateStats(targetText, 'target');
									saveToLocalStorage('targetText', accumulatedText);
									targetText.scrollTop = targetText.scrollHeight;
								}
							} catch (e) {
								console.error('Error parsing JSON:', e);
							}
						}
					}
				}
			} else {
				const data = await response.json();
				const content = data.choices[0]?.message?.content;
				if (content) {
					targetText.value = content;
					updateStats(targetText, 'target');
					saveToLocalStorage('targetText', content);
					targetText.scrollTop = targetText.scrollHeight;
				}
			}
		} catch (error) {
			alert("Failed to generate text. Please check your API key and try again.");
			console.error("Error:", error);
		}
	}

	function compareTexts() {
		const source = sourceText.value;
		const target = targetText.value;
		const dmp = new diff_match_patch();
		const diffs = dmp.diff_main(source, target);
		dmp.diff_cleanupSemantic(diffs);
		const singleColumnDiff = document.getElementById('singleColumnDiff');
		singleColumnDiff.innerHTML = generateSingleColumnDiffView(diffs);
		const [leftColumn, rightColumn] = generateDoubleColumnDiffView(diffs);
		document.getElementById('leftColumn').innerHTML = leftColumn;
		document.getElementById('rightColumn').innerHTML = rightColumn;
		updateDiffStats(diffs);
		const levenshtein = dmp.diff_levenshtein(diffs);
		document.getElementById('levenshtein').textContent = levenshtein;
	}

	function generateSingleColumnDiffView(diffs) {
		let html = '';
		diffs.forEach(([type, text]) => {
			if (type === 0) {
				html += `<span class="diff-equal">${escapeHtml(text)}</span>`;
			} else if (type === -1) {
				html += `<span class="diff-deletion">${escapeHtml(text)}</span>`;
			} else if (type === 1) {
				html += `<span class="diff-insertion">${escapeHtml(text)}</span>`;
			}
		});
		return html;
	}

	function generateDoubleColumnDiffView(diffs) {
		let leftHtml = '';
		let rightHtml = '';
		diffs.forEach(([type, text]) => {
			if (type === 0) {
				leftHtml += `<span class="diff-equal">${escapeHtml(text)}</span>`;
				rightHtml += `<span class="diff-equal">${escapeHtml(text)}</span>`;
			} else if (type === -1) {
				leftHtml += `<span class="diff-deletion">${escapeHtml(text)}</span>`;
			} else if (type === 1) {
				rightHtml += `<span class="diff-insertion">${escapeHtml(text)}</span>`;
			}
		});
		return [leftHtml, rightHtml];
	}

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
		const differencePercentage = (100 - commonPercentage).toFixed(2);
		document.getElementById('commonPercentage').textContent = commonPercentage;
		document.getElementById('differencePercentage').textContent = differencePercentage;
		document.getElementById('commonSymbols').textContent = common;
		document.getElementById('differenceSymbols').textContent = added + removed;
	}

	function escapeHtml(unsafe) {
		return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	}

	function saveToLocalStorage(key, value) {
		localStorage.setItem(key, value);
	}

	function getFromLocalStorage(key) {
		return localStorage.getItem(key);
	}

	function loadPrompts() {
		const prompts = JSON.parse(getFromLocalStorage('chatgpt_prompts') || '[]');
		promptSelect.innerHTML = `
			<option value="Proofread this text but only fix grammar">Proofread this text but only fix grammar</option>
			<option value="Proofread this text improving clarity and flow">Proofread this text improving clarity and flow</option>
			<option value="Proofread this text but only fix grammar and Markdown style">Proofread this text but only fix grammar and Markdown style</option>
			<option value="custom">Custom prompt</option>
		`;
		prompts.forEach((prompt, index) => {
			const option = document.createElement('option');
			option.value = prompt;
			option.textContent = `Custom ${index + 1}: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`;
			promptSelect.insertBefore(option, promptSelect.lastElementChild);
		});
		promptSelect.addEventListener('change', function() {
			if (this.value === 'custom') {
				customPromptContainer.style.display = 'block';
			} else {
				customPromptContainer.style.display = 'none';
			}
		});
	}

	function saveCustomPrompt() {
		const customPrompt = customPromptInput.value.trim();
		if (customPrompt) {
			const prompts = JSON.parse(getFromLocalStorage('chatgpt_prompts') || '[]');
			prompts.push(customPrompt);
			saveToLocalStorage('chatgpt_prompts', JSON.stringify(prompts));
			loadPrompts();
			customPromptInput.value = '';
			alert('Custom prompt saved!');
		} else {
			alert('Please enter a custom prompt before saving.');
		}
	}
});
