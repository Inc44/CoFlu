// translate.js
class TranslateApp
{
	constructor()
	{
		this.elements = this.getElements();
		this.state = {
			abortController: null
		};
	}
	getElements()
	{
		return {
			apiModelSelect: document.getElementById('apiModel'),
			languageSelect: document.getElementById('language'),
			documentFile: document.getElementById('documentFile'),
			translateBtn: document.getElementById('translateBtn')
		};
	}
	init()
	{
		this.loadSettings();
		this.setupEventListeners();
		const isDarkMode = StorageService.load('dark_enabled') === true;
		const isWideMode = StorageService.load('wide_enabled') === true;
		UIState.updateTheme(isDarkMode);
		UIState.updateLayout(isWideMode);
	}
	loadSettings()
	{
		const savedModel = StorageService.load('selected_api_model', 'chatgpt');
		if (this.elements.apiModelSelect)
		{
			this.elements.apiModelSelect.value = savedModel;
		}
		if (this.elements.languageSelect)
		{
			this.elements.languageSelect.value = StorageService.load('selected_language', 'en');
		}
	}
	setupEventListeners()
	{
		if (this.elements.apiModelSelect)
		{
			this.elements.apiModelSelect.addEventListener('change', () =>
			{
				const selectedModel = this.elements.apiModelSelect.value;
				StorageService.save('selected_api_model', selectedModel);
			});
		}
		if (this.elements.languageSelect)
		{
			this.elements.languageSelect.addEventListener('change', () =>
			{
				StorageService.save('selected_language', this.elements.languageSelect.value);
			});
		}
		if (this.elements.translateBtn)
		{
			this.elements.translateBtn.addEventListener('click', () =>
			{
				this.translateDocument();
			});
		}
	}
	async translateDocument()
	{
		if (this.elements.translateBtn.dataset.translating === 'true')
		{
			if (this.state.abortController)
			{
				this.state.abortController.abort();
			}
			return;
		}
		const file = this.elements.documentFile.files[0];
		if (!file)
		{
			alert('Please select a DOCX file.');
			return;
		}
		const targetLanguage = this.elements.languageSelect.value;
		const apiModel = this.elements.apiModelSelect.value;
		const apiKey = StorageService.load(CONFIG.API.KEYS[apiModel]);
		if (!apiKey)
		{
			alert(`Please set your API key for ${apiModel} in settings.`);
			return;
		}
		UIState.setTranslating(true, this.elements);
		this.state.abortController = new AbortController();
		try
		{
			const zip = new JSZip();
			const docxData = await zip.loadAsync(file);
			const documentXmlContent = await docxData.file("word/document.xml")
				.async("string");
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(documentXmlContent, "application/xml");
			const wordNamespaceURI = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
			const textElements = xmlDoc.getElementsByTagNameNS(wordNamespaceURI, 't');
			for (let i = 0; i < textElements.length; i++)
			{
				const element = textElements[i];
				let original_text = element.textContent;
				if (original_text && original_text.trim())
				{
					const prompt = `Translate the following text to ${targetLanguage}. Provide the translation ONLY, without any introductory phrases or additional commentary.\n\n${original_text}`;
					try
					{
						const response = await AiService.generate(prompt, apiModel,
						{
							abortSignal: this.state.abortController.signal
						});
						const translated_text = response;
						element.textContent = translated_text;
					}
					catch (translationError)
					{
						if (translationError.name === 'AbortError')
						{
							console.log('Translation aborted by user.');
							return;
						}
						console.error('Translation error:', translationError);
						element.textContent = "[Translation Failed]";
					}
				}
			}
			const serializer = new XMLSerializer();
			const modifiedDocumentXml = serializer.serializeToString(xmlDoc);
			docxData.file("word/document.xml", modifiedDocumentXml);
			const originalFileName = file.name;
			const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
			const ext = originalFileName.substring(originalFileName.lastIndexOf('.'));
			const translatedFileName = `${baseName}_translated_${targetLanguage}${ext}`;
			const translatedBlob = await docxData.generateAsync(
			{
				type: "blob"
			});
			const translatedFileUrl = URL.createObjectURL(translatedBlob);
			const downloadLink = document.createElement('a');
			downloadLink.href = translatedFileUrl;
			downloadLink.download = translatedFileName;
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);
			URL.revokeObjectURL(translatedFileUrl);
		}
		catch (error)
		{
			console.error('DOCX processing error:', error);
			alert('Error processing DOCX file. Please check console for details.');
		}
		finally
		{
			UIState.setTranslating(false, this.elements);
			this.state.abortController = null;
		}
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const translateApp = new TranslateApp();
	translateApp.init();
});