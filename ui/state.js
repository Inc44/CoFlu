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
	updateTheme(isDarkMode)
	{
		document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
		const darkToggle = document.getElementById('darkToggle');
		if (darkToggle)
		{
			darkToggle.checked = isDarkMode;
		}
	},
	updateLayout(isWideMode)
	{
		if (isWideMode)
		{
			document.documentElement.classList.add('wide');
		}
		else
		{
			document.documentElement.classList.remove('wide');
		}
		const wideToggle = document.getElementById('wideToggle');
		if (wideToggle)
		{
			wideToggle.checked = isWideMode;
		}
	},
	updateAudioUploadVisibility(modelDetails)
	{
		const audioUploadCard = document.querySelector('.card:has(#audioList)');
		if (audioUploadCard)
		{
			audioUploadCard.style.display = modelDetails.audio ? 'block' : 'none';
		}
	},
	updateImageUploadVisibility(modelDetails)
	{
		const imageUploadCard = document.querySelector('.card:has(#imageList)');
		if (imageUploadCard)
		{
			imageUploadCard.style.display = modelDetails.image ? 'block' : 'none';
		}
	},
	updateVideoUploadVisibility(modelDetails)
	{
		const videoUploadCard = document.querySelector('.card:has(#videoList)');
		if (videoUploadCard)
		{
			videoUploadCard.style.display = modelDetails.video ? 'block' : 'none';
		}
	},
	showWPM(elements)
	{
		elements.wpmContainer.style.display = 'inline';
	}
};
window.UIState = UIState;