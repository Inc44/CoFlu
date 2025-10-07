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
		const audioRow = document.querySelector('.row:has(#audioList)');
		if (audioRow)
		{
			audioRow.style.display = modelDetails.audio ? '' : 'none';
		}
	},
	updateFileUploadVisibility(modelDetails)
	{
		const fileRow = document.querySelector('.row:has(#fileList)');
		if (fileRow)
		{
			fileRow.style.display = modelDetails.file ? '' : 'none';
		}
	},
	updateImageUploadVisibility(modelDetails)
	{
		const imageRow = document.querySelector('.row:has(#imageList)');
		if (imageRow)
		{
			imageRow.style.display = modelDetails.image ? '' : 'none';
		}
	},
	updateVideoUploadVisibility(modelDetails)
	{
		const videoRow = document.querySelector('.row:has(#videoList)');
		if (videoRow)
		{
			videoRow.style.display = modelDetails.video ? '' : 'none';
		}
	},
	showWPM(els)
	{
		els.wpmBox.style.display = 'inline';
	}
};
window.UIState = UIState;