const UIState = {
	setGenerating(isGenerating, els, isIterate = false)
	{
		if (isGenerating)
		{
			els.genTargetBtn.textContent = isIterate ? 'Stop Iterating' : 'Stop Generating';
			els.genTargetBtn.style.backgroundColor = 'var(--red) !important';
			els.genTargetBtn.classList.remove('iterate');
		}
		else
		{
			els.genTargetBtn.style.backgroundColor = '';
			if (isIterate)
			{
				els.genTargetBtn.textContent = 'Iterate';
				els.genTargetBtn.classList.add('iterate');
			}
			else
			{
				els.genTargetBtn.textContent = 'Generate';
				els.genTargetBtn.classList.remove('iterate');
			}
		}
		els.genTargetBtn.dataset.generating = isGenerating;
	},
	setTranscribing(isTranscribing, els)
	{
		els.transcribeBtn.style.backgroundColor = isTranscribing ? 'var(--red) !important' : '';
		els.transcribeBtn.textContent = isTranscribing ? 'Stop Transcribe' : 'Start Transcribe';
		els.transcribeBtn.dataset.transcribing = isTranscribing;
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
	updateAccessibility(isEnabled)
	{
		if (isEnabled)
		{
			document.documentElement.classList.add('accessibility');
		}
		else
		{
			document.documentElement.classList.remove('accessibility');
		}
		const accessibilityToggle = document.getElementById('accessibilityToggle');
		if (accessibilityToggle)
		{
			accessibilityToggle.checked = isEnabled;
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
	updateUploadsVisibility(modelDetails)
	{
		this.updateAudioUploadVisibility(modelDetails);
		this.updateFileUploadVisibility(modelDetails);
		this.updateImageUploadVisibility(modelDetails);
		this.updateVideoUploadVisibility(modelDetails);
	},
	showSpeed(els)
	{
		els.speedBox.style.display = 'inline';
	}
};
window.UIState = UIState;