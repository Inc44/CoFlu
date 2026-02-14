(function()
{
	const storedDarkMode = localStorage.getItem('dark_enabled');
	const isDarkMode = storedDarkMode === 'true' || (storedDarkMode === null && true);
	document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
	const storedWideMode = localStorage.getItem('wide_enabled');
	const isWideMode = storedWideMode === 'true' || (storedWideMode === null && false);
	if (isWideMode)
	{
		document.documentElement.classList.add('wide');
	}
	const storedAccessibilityMode = localStorage.getItem('accessibility_enabled');
	const isAccessibilityMode = storedAccessibilityMode === 'true' || (storedAccessibilityMode === null && false);
	if (isAccessibilityMode)
	{
		document.documentElement.classList.add('accessibility');
	}
})();