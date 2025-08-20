const ComparisonService = {
	EQUAL: 0,
	DEL: -1,
	INS: 1,
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
			stats: this.calcStats(diffs),
			levenshtein: dmp.diff_levenshtein(diffs)
		};
	},
	generateViews(diffs = [])
	{
		const numberedLines = StorageService.load('numbered_lines_enabled', false);
		let single = this.genSingleView(diffs);
		let double = this.genDoubleView(diffs);
		if (numberedLines)
		{
			single = this.addLineNumbers(single);
			double = {
				left: this.addLineNumbers(double.left),
				right: this.addLineNumbers(double.right)
			};
		}
		return {
			single,
			double
		};
	},
	genSingleView(diffs = [])
	{
		const htmlParts = [];
		diffs.forEach(([type, text]) =>
		{
			const className = type === this.EQUAL ? 'diff-equal' : type === this.DEL ? 'diff-deletion' : 'diff-insertion';
			const escText = TextService.format.escape(text);
			htmlParts.push(`<span class="${className}">${escText}</span>`);
		});
		return htmlParts.join('');
	},
	genDoubleView(diffs = [])
	{
		const leftParts = [],
			rightParts = [];
		diffs.forEach(([type, text]) =>
		{
			const escText = TextService.format.escape(text);
			if (type === this.EQUAL)
			{
				leftParts.push(`<span class="diff-equal">${escText}</span>`);
				rightParts.push(`<span class="diff-equal">${escText}</span>`);
			}
			else if (type === this.DEL)
			{
				leftParts.push(`<span class="diff-deletion">${escText}</span>`);
			}
			else if (type === this.INS)
			{
				rightParts.push(`<span class="diff-insertion">${escText}</span>`);
			}
		});
		return {
			left: leftParts.join(''),
			right: rightParts.join('')
		};
	},
	addLineNumbers(html = '')
	{
		let lineNum = 1;
		const lines = html.split('\n');
		let newHtml = '';
		for (let i = 0; i < lines.length; i++)
		{
			if (i > 0)
			{
				newHtml += '\n';
			}
			newHtml += `<span class="line-number">${lineNum}</span>${lines[i]}`;
			lineNum++;
		}
		return newHtml;
	},
	calcStats(diffs = [])
	{
		let added = 0,
			removed = 0,
			common = 0;
		diffs.forEach(([type, text]) =>
		{
			if (type === this.INS) added += text.length;
			else if (type === this.DEL) removed += text.length;
			else if (type === this.EQUAL) common += text.length;
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