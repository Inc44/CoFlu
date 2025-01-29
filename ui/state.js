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
		elements.transcribeBtn.style.backgroundColor = isTranscribing ? 'red' : 'blue';
		elements.transcribeBtn.textContent = isTranscribing ? 'Stop Transcribe' : 'Start Transcribe';
		elements.transcribeBtn.dataset.transcribing = isTranscribing;
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
	}
};
window.UIState = UIState;