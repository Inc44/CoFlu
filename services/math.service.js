const MathService = {
	renderMath(element, renderer)
	{
		if (!element) return;
		const hasKatex = typeof katex !== 'undefined' && typeof renderMathInElement === 'function';
		const hasMathJax = typeof MathJax !== 'undefined' && MathJax && typeof MathJax.typesetPromise === 'function';
		if (renderer === 'katex')
		{
			if (!hasKatex) return;
			renderMathInElement(element,
			{
				delimiters: [
				{
					left: '$$',
					right: '$$',
					display: true
				},
				{
					left: '$',
					right: '$',
					display: false
				},
				{
					left: '\\\[',
					right: '\\\]',
					display: true
				},
				{
					left: '\\\(',
					right: '\\\)',
					display: false
				}],
				throwOnError: false,
				trust: true,
				strict: false
			});
		}
		else if (renderer === 'mathjax4')
		{
			if (!hasMathJax) return;
			MathJax.typesetPromise([element]);
		}
	},
	waitForRenderer(renderer)
	{
		const ready = () =>
		{
			if (renderer === 'katex')
			{
				return typeof katex !== 'undefined' && typeof renderMathInElement === 'function';
			}
			return typeof MathJax !== 'undefined' && MathJax && typeof MathJax.typesetPromise === 'function';
		};
		if (ready()) return Promise.resolve();
		return new Promise(resolve =>
		{
			let i = 0;
			const id = setInterval(() =>
			{
				if (ready() || i++ > 400)
				{
					clearInterval(id);
					resolve();
				}
			}, 25);
		});
	}
};
window.MathService = MathService;