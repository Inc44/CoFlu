// services/comparison.service.js
const ComparisonService = {
	DIFF_EQUAL: 0,
	DIFF_DELETION: -1,
	DIFF_INSERTION: 1,
	compare(source = '', target = '', cleanup = true)
	{
		const dmp = new diff_match_patch();
		const diffs = dmp.diff_main(source, target);
		if (cleanup && StorageService.load('cleanup_enabled', true))
		{
			dmp.diff_cleanupSemantic(diffs);
		}
		return {
			diffs,
			stats: this.calculateStats(diffs),
			levenshtein: dmp.diff_levenshtein(diffs)
		};
	},
	generateViews(diffs = [])
	{
		const numberedLinesEnabled = StorageService.load('numbered_lines_enabled', false);
		let single = this.generateSingleColumnView(diffs);
		let double = this.generateDoubleColumnView(diffs);
		if (numberedLinesEnabled)
		{
			single = this.postProcessAddLineNumbers(single);
			double = {
				left: this.postProcessAddLineNumbers(double.left),
				right: this.postProcessAddLineNumbers(double.right)
			};
		}
		return {
			single,
			double
		};
	},
	generateSingleColumnView(diffs = [])
	{
		const htmlParts = [];
		diffs.forEach(([type, text]) =>
		{
			const className = type === this.DIFF_EQUAL ? 'diff-equal' : type === this.DIFF_DELETION ? 'diff-deletion' : 'diff-insertion';
			const escapedText = TextService.format.escape(text);
			htmlParts.push(`<span class="${className}">${escapedText}</span>`);
		});
		return htmlParts.join('');
	},
	generateDoubleColumnView(diffs = [])
	{
		const leftParts = [],
			rightParts = [];
		diffs.forEach(([type, text]) =>
		{
			const escapedText = TextService.format.escape(text);
			if (type === this.DIFF_EQUAL)
			{
				leftParts.push(`<span class="diff-equal">${escapedText}</span>`);
				rightParts.push(`<span class="diff-equal">${escapedText}</span>`);
			}
			else if (type === this.DIFF_DELETION)
			{
				leftParts.push(`<span class="diff-deletion">${escapedText}</span>`);
			}
			else if (type === this.DIFF_INSERTION)
			{
				rightParts.push(`<span class="diff-insertion">${escapedText}</span>`);
			}
		});
		return {
			left: leftParts.join(''),
			right: rightParts.join('')
		};
	},
	postProcessAddLineNumbers(html = '')
	{
		let lineNumber = 1;
		const lines = html.split('\n');
		let newHtml = '';
		for (let i = 0; i < lines.length; i++)
		{
			if (i > 0)
			{
				newHtml += '\n';
			}
			newHtml += `<span class="line-number">${lineNumber}</span>${lines[i]}`;
			lineNumber++;
		}
		return newHtml;
	},
	calculateStats(diffs = [])
	{
		let added = 0,
			removed = 0,
			common = 0;
		diffs.forEach(([type, text]) =>
		{
			if (type === this.DIFF_INSERTION) added += text.length;
			else if (type === this.DIFF_DELETION) removed += text.length;
			else if (type === this.DIFF_EQUAL) common += text.length;
		});
		const total = added + removed + common;
		if (total === 0)
		{
			return {
				commonPercentage: "100.00",
				differencePercentage: "0.00",
				commonSymbols: 0,
				differenceSymbols: 0
			};
		}
		return {
			commonPercentage: (common / total * 100)
				.toFixed(2),
			differencePercentage: ((added + removed) / total * 100)
				.toFixed(2),
			commonSymbols: common,
			differenceSymbols: added + removed
		};
	}
};
window.ComparisonService = ComparisonService;