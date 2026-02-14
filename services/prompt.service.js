const PromptService = {
	isSavedCustomOption(option)
	{
		return !!(option && option.dataset && option.dataset.customIndex !== undefined);
	},
	loadPrompts(els, includeNoneOption)
	{
		if (!els.promptSelect) return;
		const savedPrompts = StorageService.load('prompts', []);
		els.promptSelect.innerHTML = '';
		if (includeNoneOption)
		{
			const defaultOption = document.createElement('option');
			defaultOption.value = '';
			defaultOption.textContent = 'None';
			els.promptSelect.appendChild(defaultOption);
		}
		CONFIG.UI.STANDARD_PROMPTS.forEach(prompt =>
		{
			const option = document.createElement('option');
			option.value = prompt;
			option.textContent = prompt;
			els.promptSelect.appendChild(option);
		});
		savedPrompts.forEach((prompt, i) =>
		{
			const option = document.createElement('option');
			option.value = prompt;
			option.textContent = `Custom ${i+1}: ${prompt.substring(0, 30)}...`;
			option.dataset.customIndex = i;
			els.promptSelect.appendChild(option);
		});
		const customOption = document.createElement('option');
		customOption.value = 'custom';
		customOption.textContent = 'Custom prompt';
		els.promptSelect.appendChild(customOption);
		if (els.customPromptBox)
		{
			const selectedOption = els.promptSelect.options[els.promptSelect.selectedIndex];
			const isSavedCustom = this.isSavedCustomOption(selectedOption);
			els.customPromptBox.style.display = (els.promptSelect.value === 'custom' || isSavedCustom) ? 'block' : 'none';
			if (isSavedCustom && els.customPrompt)
			{
				els.customPrompt.value = els.promptSelect.value || '';
			}
		}
		if (els.deletePromptBtn)
		{
			const selectedOption = els.promptSelect.options[els.promptSelect.selectedIndex];
			const isSavedCustom = this.isSavedCustomOption(selectedOption);
			els.deletePromptBtn.disabled = !isSavedCustom;
		}
	},
	setupPromptEvents(els, includeNoneOption)
	{
		if (!els.promptSelect) return;
		els.promptSelect.addEventListener('change', () =>
		{
			const selectedOption = els.promptSelect.options[els.promptSelect.selectedIndex];
			const isSavedCustom = this.isSavedCustomOption(selectedOption);
			if (els.customPromptBox)
			{
				els.customPromptBox.style.display = (els.promptSelect.value === 'custom' || isSavedCustom) ? 'block' : 'none';
			}
			if (els.customPrompt)
			{
				if (els.promptSelect.value === 'custom')
				{
					els.customPrompt.value = '';
				}
				else if (isSavedCustom)
				{
					els.customPrompt.value = els.promptSelect.value;
				}
			}
			if (els.deletePromptBtn)
			{
				els.deletePromptBtn.disabled = !isSavedCustom;
			}
		});
		if (els.savePromptBtn)
		{
			els.savePromptBtn.addEventListener('click', () =>
			{
				const text = els.customPrompt?.value.trim();
				if (!text)
				{
					alert('Please enter a custom prompt before saving.');
					return;
				}
				const prompts = StorageService.load('prompts', []);
				const selectedOption = els.promptSelect.options[els.promptSelect.selectedIndex];
				const idxStr = selectedOption?.dataset?.customIndex;
				if (idxStr !== undefined)
				{
					const idx = parseInt(idxStr, 10);
					if (!isNaN(idx) && idx >= 0 && idx < prompts.length)
					{
						prompts[idx] = text;
					}
					else
					{
						prompts.push(text);
					}
				}
				else
				{
					prompts.push(text);
				}
				StorageService.save('prompts', prompts);
				this.loadPrompts(els, includeNoneOption);
				if (els.customPrompt)
				{
					els.customPrompt.value = '';
				}
				if (els.promptSelect)
				{
					els.promptSelect.value = 'custom';
					els.promptSelect.dispatchEvent(new Event('change'));
				}
				alert('Custom prompt saved!');
			});
		}
		if (els.deletePromptBtn)
		{
			els.deletePromptBtn.addEventListener('click', () =>
			{
				const prompts = StorageService.load('prompts', []);
				const selectedOption = els.promptSelect.options[els.promptSelect.selectedIndex];
				const idxStr = selectedOption?.dataset?.customIndex;
				if (idxStr === undefined)
				{
					alert('Please select a saved custom prompt to delete.');
					return;
				}
				const idx = parseInt(idxStr, 10);
				if (isNaN(idx) || idx < 0 || idx >= prompts.length)
				{
					alert('Invalid custom prompt selection.');
					return;
				}
				prompts.splice(idx, 1);
				StorageService.save('prompts', prompts);
				this.loadPrompts(els, includeNoneOption);
				if (els.customPrompt)
				{
					els.customPrompt.value = '';
				}
				if (els.promptSelect)
				{
					els.promptSelect.value = 'custom';
					els.promptSelect.dispatchEvent(new Event('change'));
				}
				alert('Custom prompt deleted!');
			});
		}
	},
	getCustomPrompt(els)
	{
		if (!els.promptSelect) return '';
		const selectedPrompt = els.promptSelect.value;
		const customPrompt = els.customPrompt.value;
		const selectedOption = els.promptSelect.options[els.promptSelect.selectedIndex];
		const isSavedCustom = this.isSavedCustomOption(selectedOption);
		return (selectedPrompt === 'custom' || isSavedCustom) ? customPrompt : selectedPrompt;
	}
};
window.PromptService = PromptService;