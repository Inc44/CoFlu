// ui/state.js
const UIState = {
	setGenerating(isGenerating, els)
	{
		els.genTargetBtn.style.backgroundColor = isGenerating ? 'red' : '';
		els.genTargetBtn.textContent = isGenerating ? 'Stop Generating' : 'Generate';
		els.genTargetBtn.dataset.generating = isGenerating;
	},
	setTranscribing(isTranscribing, els)
	{
		els.transcribeBtn.style.backgroundColor = isTranscribing ? 'red' : '';
		els.transcribeBtn.textContent = isTranscribing ? 'Stop Transcribe' : 'Start Transcribe';
		els.transcribeBtn.dataset.transcribing = isTranscribing;
	},
	setTranslating(isTranslating, els)
	{
		els.translateBtn.style.backgroundColor = isTranslating ? 'red' : '';
		els.translateBtn.textContent = isTranslating ? 'Stop Translation' : 'Start Translation';
		els.translateBtn.dataset.translating = isTranslating;
	},
	updateTheme(isDark)
	{
		document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
		const darkToggle = document.getElementById('darkToggle');
		if (darkToggle)
		{
			darkToggle.checked = isDark;
		}
	},
	updateLayout(isWide)
	{
		if (isWide)
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
			wideToggle.checked = isWide;
		}
	},
	updateAudioUploadVisibility(modelDetails)
	{
		const audioCard = document.querySelector('.card:has(#audioList)');
		if (audioCard)
		{
			audioCard.style.display = modelDetails.audio ? 'block' : 'none';
		}
	},
	updateImageUploadVisibility(modelDetails)
	{
		const imageCard = document.querySelector('.card:has(#imageList)');
		if (imageCard)
		{
			imageCard.style.display = modelDetails.image ? 'block' : 'none';
		}
	},
	updateVideoUploadVisibility(modelDetails)
	{
		const videoCard = document.querySelector('.card:has(#videoList)');
		if (videoCard)
		{
			videoCard.style.display = modelDetails.video ? 'block' : 'none';
		}
	},
	showWPM(els)
	{
		els.wpmBox.style.display = 'inline';
	}
};
window.UIState = UIState;