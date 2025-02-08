// translate.js
class ChatApp
{
	init()
	{
		const isDarkMode = StorageService.load('dark_enabled') === true;
		const isWideMode = StorageService.load('wide_enabled') === true;
		UIState.updateTheme(isDarkMode);
		UIState.updateLayout(isWideMode);
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const chatApp = new ChatApp();
	chatApp.init();
});