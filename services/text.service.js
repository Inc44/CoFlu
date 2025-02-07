// services/text.service.js
const TextService = {
	updateStats(textArea, type)
	{
		const words = textArea.value.trim()
			.split(/\s+/)
			.length;
		const chars = textArea.value.length;
		document.getElementById(`${type}Words`)
			.textContent = words;
		document.getElementById(`${type}Chars`)
			.textContent = chars;
	},
	transform:
	{
		toUpperCase(text)
		{
			return text.toUpperCase();
		},
		toLowerCase(text)
		{
			return text.toLowerCase();
		},
		dedupe(text)
		{
			const lines = text.split('\n');
			return [...new Set(lines)].join('\n');
		},
		sort(text)
		{
			const lines = text.split('\n');
			if (lines.length === 1)
			{
				return lines[0].split(/\s+/)
					.sort()
					.join(' ');
			}
			return lines.sort()
				.join('\n');
		},
		unbold(text)
		{
			return text.replace(/\*\*/g, '');
		},
		unspace(text)
		{
			return text.replace(/ +$/gm, '');
		}
	},
	format:
	{
		retab(text)
		{
			const lines = text.split('\n');
			const processedLines = [];
			for (const line of lines)
			{
				const match = line.match(/^(\s*)/);
				if (match)
				{
					const whitespace = match[1];
					const tabMatch = whitespace.match(/^(\t*)/);
					const existingTabs = tabMatch ? tabMatch[0] : '';
					const spaceCount = whitespace.length - existingTabs.length;
					const tabsToAdd = Math.floor(spaceCount / 2);
					const tabString = '\t'.repeat(tabsToAdd);
					const trimmedLine = line.replace(/^(\s+)/, '');
					processedLines.push(existingTabs + tabString + trimmedLine);
				}
				else
				{
					processedLines.push(line);
				}
			}
			return processedLines.join('\n');
		},
		latex(text)
		{
			text = text.replace(/\\[\s\n]*\[([\s\S]*?)\\[\s\n]*\]/g,
				(_, p1) => `$$\n${p1.trim()}\n$$`);
			text = text.replace(/\\[\s\n]*\(([\s\S]*?)\\[\s\n]*\)/g,
				(_, p1) => `$${p1.trim()}$`);
			return text;
		},
		html(text)
		{
			return text.replace(/&nbsp;/g, ' ');
		},
		escape(text)
		{
			return text.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#039;");
		}
	},
	async loadFile(file)
	{
		return new Promise((resolve, reject) =>
		{
			const reader = new FileReader();
			reader.onload = e => resolve(e.target.result);
			reader.onerror = e => reject(e);
			reader.readAsText(file);
		});
	}
};
window.TextService = TextService;