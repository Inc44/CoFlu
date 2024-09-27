document.addEventListener('DOMContentLoaded', () => {
	const sourceText = document.getElementById('sourceText');
	const targetText = document.getElementById('targetText');
	const compareBtn = document.getElementById('compareBtn');
	const switchBtn = document.getElementById('switchBtn');
	const generateTargetBtn = document.getElementById('generateTarget');
	const apiKeyInput = document.getElementById('apiKey');
	const promptSelect = document.getElementById('promptSelect');
	const customPromptInput = document.getElementById('customPrompt');
	const savePromptBtn = document.getElementById('savePrompt');
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
	sourceText.value = getFromLocalStorage('sourceText') || '';
	targetText.value = getFromLocalStorage('targetText') || '';
	apiKeyInput.value = getFromLocalStorage('chatgpt_api_key') || '';
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
		try {
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: "gpt-4o",
					messages: [{
						role: "user",
						content: fullPrompt
					}],
					temperature: 0,
					max_tokens: 4000
				})
			});
			const data = await response.json();
			if (data.choices && data.choices[0] && data.choices[0].message) {
				targetText.value = data.choices[0].message.content.trim();
				updateStats(targetText, 'target');
			} else {
				throw new Error("Unexpected response format");
			}
		} catch (error) {
			alert("Failed to generate text. Please check your API key and try again.");
			console.error("Error:", error);
		}
	}

	function compareTexts() {
		const source = sourceText.value;
		const target = targetText.value;
		const levenshtein = calculateLevenshtein(source, target);
		document.getElementById('levenshtein').textContent = levenshtein;
		const commonChars = source.split('').filter((char, index) => char === target[index]).length;
		const totalChars = Math.max(source.length, target.length);
		const commonPercentage = (commonChars / totalChars * 100).toFixed(2);
		const differencePercentage = (100 - commonPercentage).toFixed(2);
		document.getElementById('commonPercentage').textContent = commonPercentage;
		document.getElementById('differencePercentage').textContent = differencePercentage;
		document.getElementById('commonSymbols').textContent = commonChars;
		document.getElementById('differenceSymbols').textContent = totalChars - commonChars;
		const singleColumnDiff = document.getElementById('singleColumnDiff');
		singleColumnDiff.innerHTML = generateSingleColumnDiffView(source, target);
		const [leftColumn,
			rightColumn
		] = generateDoubleColumnDiff(source, target);
		document.getElementById('leftColumn').innerHTML = leftColumn;
		document.getElementById('rightColumn').innerHTML = rightColumn;
	}

	function calculateLevenshtein(a, b) {
		if (a.length === 0) return b.length;
		if (b.length === 0) return a.length;
		const matrix = [];
		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}
		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}
		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i][
						j
					] = matrix[i - 1][
						j - 1
					];
				} else {
					matrix[i][
						j
					] = Math.min(matrix[i - 1]
						[j - 1] + 1, matrix[i]
						[j - 1] + 1, matrix[i - 1]
						[
							j
						] + 1);
				}
			}
		}
		return matrix[b.length][
			a.length
		];
	}

	function generateSingleColumnDiffView(source, target) {
		const diff = Diff.diffChars(source, target);
		let html = '';
		diff.forEach(part => {
			const spanClass = part.added ? 'added' : part.removed ? 'removed' : '';
			html += `<span class="${spanClass}">${escapeHtml(part.value)}</span>`;
		});
		return html;
	}

	function generateDoubleColumnDiff(source, target) {
		const sourceLines = source.split('\n');
		const targetLines = target.split('\n');
		let leftColumn = '';
		let rightColumn = '';
		const maxLines = Math.max(sourceLines.length, targetLines.length);
		for (let i = 0; i < maxLines; i++) {
			const sourceLine = sourceLines[i] || '';
			const targetLine = targetLines[i] || '';
			const lineNumber = i + 1;
			const lineDiff = Diff.diffChars(sourceLine, targetLine);
			let leftLineHtml = '';
			let rightLineHtml = '';
			lineDiff.forEach(part => {
				if (part.added) {
					rightLineHtml += `<span class="added">${escapeHtml(part.value)}</span>`;
					leftLineHtml += ''.repeat(part.value.length);
				} else if (part.removed) {
					leftLineHtml += `<span class="removed">${escapeHtml(part.value)}</span>`;
					rightLineHtml += ''.repeat(part.value.length);
				} else {
					leftLineHtml += escapeHtml(part.value);
					rightLineHtml += escapeHtml(part.value);
				}
			});
			leftColumn += `<div class="line-number">${lineNumber}</div><div class="line">${leftLineHtml}</div>`;
			rightColumn += `<div class="line-number">${lineNumber}</div><div class="line">${rightLineHtml}</div>`;
		}
		return [leftColumn,
			rightColumn
		];
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
				customPromptInput.style.display = 'block';
			} else {
				customPromptInput.style.display = 'none';
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
const Diff = {
	diffChars: function(oldStr, newStr) {
		const matrix = [];
		const m = oldStr.length;
		const n = newStr.length;
		// Initialize the matrix
		for (let i = 0; i <= m; i++) {
			matrix[i] = [i];
		}
		for (let j = 1; j <= n; j++) {
			matrix[0][j] = j;
		}
		// Fill the matrix
		for (let i = 1; i <= m; i++) {
			for (let j = 1; j <= n; j++) {
				if (oldStr[i - 1] === newStr[j - 1]) {
					matrix[i][
						j
					] = matrix[i - 1][
						j - 1
					];
				} else {
					matrix[i][
						j
					] = Math.min(matrix[i - 1]
						[j - 1] + 1, // substitution
						matrix[i]
						[j - 1] + 1, // insertion
						matrix[i - 1]
						[
							j
						] + 1 // deletion
					);
				}
			}
		}
		// Backtrack to find the diff
		const diff = [];
		let i = m,
			j = n;
		while (i > 0 || j > 0) {
			if (i > 0 && j > 0 && oldStr[i - 1] === newStr[j - 1]) {
				diff.unshift({
					value: oldStr[i - 1]
				});
				i--;
				j--;
			} else if (j > 0 && (i === 0 || matrix[i][
					j - 1
				] <= matrix[i - 1][
					j
				])) {
				diff.unshift({
					added: true,
					value: newStr[j - 1]
				});
				j--;
			} else {
				diff.unshift({
					removed: true,
					value: oldStr[i - 1]
				});
				i--;
			}
		}
		return diff;
	}
};
