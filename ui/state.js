// ui/state.js
const UIState = {
	setGenerating(isGenerating, elements)
	{
		elements.generateTargetBtn.style.backgroundColor = isGenerating ? 'red' : '';
		elements.generateTargetBtn.textContent = isGenerating ? 'Stop Generating' : 'Generate';
		elements.generateTargetBtn.dataset.generating = isGenerating;
	},
	setTranscribing(isTranscribing, elements)
	{
		elements.transcribeBtn.style.backgroundColor = isTranscribing ? 'red' : '';
		elements.transcribeBtn.textContent = isTranscribing ? 'Stop Transcribe' : 'Start Transcribe';
		elements.transcribeBtn.dataset.transcribing = isTranscribing;
	},
	setTranslating(isTranslating, elements)
	{
		elements.translateBtn.style.backgroundColor = isTranslating ? 'red' : '';
		elements.translateBtn.textContent = isTranslating ? 'Stop Translation' : 'Start Translation';
		elements.translateBtn.dataset.translating = isTranslating;
	},
	updateTheme(isDark)
	{
		document.body.dataset.bsTheme = isDark ? 'dark' : 'light';
		const darkToggle = document.getElementById('darkToggle');
		if (darkToggle)
		{
			darkToggle.checked = isDark;
		}
	},
	updateLayout(isWide)
	{
		const contentElement = document.getElementById('content');
		if (contentElement)
		{
			contentElement.classList.toggle('wide', isWide);
		}
		const wideToggle = document.getElementById('wideToggle');
		if (wideToggle)
		{
			wideToggle.checked = isWide;
		}
	},
	updateImageUploadVisibility(modelDetails)
	{
		const imageUploadCard = document.querySelector('.card:has(#imageList)');
		if (imageUploadCard)
		{
			imageUploadCard.style.display = modelDetails && modelDetails.vision ? 'block' : 'none';
		}
	},
	updateVideoUploadVisibility(modelDetails)
	{
		const videoUploadCard = document.querySelector('.card:has(#videoList)');
		if (videoUploadCard)
		{
			videoUploadCard.style.display = modelDetails && modelDetails.vision && modelDetails.name.includes("gemini-2.0") ? 'block' : 'none';
		}
	},
	showWPM(elements)
	{
		elements.wpmContainer.style.display = 'inline';
	}
};
window.UIState = UIState;