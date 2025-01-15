// services/comparison.service.js
const ComparisonService = {
	compare(source, target, cleanup = true)
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
	generateViews(diffs)
	{
		return {
			single: this.generateSingleColumnView(diffs),
			double: this.generateDoubleColumnView(diffs)
		};
	},
	generateSingleColumnView(diffs)
	{
		return diffs.map(([type, text]) =>
			{
				const className = type === 0 ? 'diff-equal' : type === -1 ? 'diff-deletion' : 'diff-insertion';
				return `<span class="${className}">${TextService.format.escape(text)}</span>`;
			})
			.join('');
	},
	generateDoubleColumnView(diffs)
	{
		let leftHtml = '',
			rightHtml = '';
		diffs.forEach(([type, text]) =>
		{
			const escapedText = TextService.format.escape(text);
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
		return {
			left: leftHtml,
			right: rightHtml
		};
	},
	calculateStats(diffs)
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