// translate.js
class TranslateApp
{
	constructor()
	{
		this.elements = this.getElements();
		this.state = {
			abortController: null,
			translatedBlob: null,
			translatedFileName: null,
			requestQueue: [],
			lastRequestTime: 0,
		};
	}
	getElements()
	{
		return {
			apiModelSelect: document.getElementById('apiModel'),
			languageSelect: document.getElementById('language'),
			documentFile: document.getElementById('documentFile'),
			translateBtn: document.getElementById('translateBtn'),
			progressBar: document.getElementById('translateProgress'),
			progressBarInner: document.querySelector('#translateProgress .progress-bar'),
			downloadBtn: document.getElementById('downloadTranslated'),
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
		this.elements.downloadBtn.addEventListener('click', () =>
		{
			this.downloadTranslatedFile();
		});
	}
	updateProgress(current, total)
	{
		const percentage = Math.round((current / total) * 100);
		this.elements.progressBarInner.style.width = `${percentage}%`;
		this.elements.progressBarInner.setAttribute('aria-valuenow', percentage);
		this.elements.progressBarInner.textContent = `${percentage}%`;
		this.elements.progressBarInner.classList.add('progress-bar-animated');
	}
	getBatchSize()
	{
		const batchSize = StorageService.load('translation_batch_size', 10);
		if (isNaN(batchSize) || batchSize < 1)
		{
			return 1;
		}
		else if (batchSize > 100)
		{
			return 100;
		}
		return batchSize;
	}
	downloadTranslatedFile()
	{
		if (this.state.translatedBlob && this.state.translatedFileName)
		{
			const url = URL.createObjectURL(this.state.translatedBlob);
			const downloadLink = document.createElement('a');
			downloadLink.href = url;
			downloadLink.download = this.state.translatedFileName;
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);
			URL.revokeObjectURL(url);
		}
	}
	async rateLimitRequests(apiCall)
	{
		const quotaRateLimit = StorageService.load('translation_batch_rpm', 0);
		if (quotaRateLimit === 0)
		{
			return await apiCall();
		}
		return new Promise((resolve, reject) =>
		{
			this.state.requestQueue.push(
			{
				apiCall,
				resolve,
				reject
			});
			this.processRequestQueue(quotaRateLimit);
		});
	}
	async processRequestQueue(quotaRateLimit)
	{
		if (this.state.requestQueue.length === 0)
		{
			return;
		}
		const now = Date.now();
		const timeSinceLastRequest = now - this.state.lastRequestTime;
		const delayRequired = (60000 / quotaRateLimit) - timeSinceLastRequest;
		if (delayRequired > 0)
		{
			await new Promise(resolve => setTimeout(resolve, delayRequired));
		}
		this.state.lastRequestTime = Date.now();
		const
		{
			apiCall,
			resolve,
			reject
		} = this.state.requestQueue.shift();
		try
		{
			const result = await apiCall();
			resolve(result);
		}
		catch (error)
		{
			reject(error);
		}
		if (this.state.requestQueue.length > 0)
		{
			setTimeout(() => this.processRequestQueue(quotaRateLimit), 0);
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
			this.state.requestQueue = [];
			return;
		}
		const file = this.elements.documentFile.files[0];
		if (!file)
		{
			alert('Please select a DOCX file.');
			return;
		}
		this.elements.downloadBtn.style.display = 'none';
		this.elements.progressBar.style.display = 'block';
		this.updateProgress(0, 100);
		this.elements.progressBarInner.classList.remove('progress-bar-animated');
		const targetLanguage = this.elements.languageSelect.value;
		const apiModel = StorageService.load('selected_api_model', 'chatgpt');
		const apiKey = StorageService.load(CONFIG.API.KEYS[apiModel]);
		if (!apiKey)
		{
			alert(`Please set your API key for ${apiModel} in settings.`);
			UIState.setTranslating(false, this.elements);
			return;
		}
		this.state.abortController = new AbortController();
		const isGemini = apiModel === "gemini";
		UIState.setTranslating(true, this.elements);
		const wordNamespaceURI = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
		try
		{
			const zip = new JSZip();
			const docxData = await zip.loadAsync(file);
			if (!docxData.file("word/document.xml"))
			{
				throw new Error("word/document.xml not found in DOCX. Invalid DOCX file.");
			}
			const documentXmlContent = await docxData.file("word/document.xml")
				.async("string");
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(documentXmlContent, "application/xml");
			const textElements = xmlDoc.getElementsByTagNameNS(wordNamespaceURI, 't');
			if (textElements.length === 0)
			{
				alert('No text elements (<w:t>) found in the document.');
				UIState.setTranslating(false, this.elements);
				return;
			}
			const elements = Array.from(textElements);
			const batchSize = this.getBatchSize();
			const batches = [];
			for (let i = 0; i < elements.length; i += batchSize)
			{
				batches.push(elements.slice(i, i + batchSize));
			}
			let processedElements = 0;
			const totalElements = elements.length;
			for (const batch of batches)
			{
				if (this.state.abortController.signal.aborted)
				{
					throw new DOMException('Aborted', 'AbortError');
				}
				const translationPromises = batch.map(async element =>
				{
					const original_text = element.textContent;
					if (original_text && original_text.trim())
					{
						try
						{
							const prompt = `Translate the following text to ${targetLanguage}. Provide the translation ONLY, without any introductory phrases or additional commentary.\n\n${original_text}`;
							const response = await this.rateLimitRequests(() => AiService.generate(prompt, apiModel,
							{
								abortSignal: this.state.abortController.signal,
							}));
							let translated_text;
							if (isGemini)
							{
								translated_text = response.response?.text?.() || response.candidates?.[0]?.content?.parts?.[0]?.text || "[Translation Failed]";
							}
							else
							{
								translated_text = CONFIG.API.CONFIG[apiModel].extractContent(response);
							}
							if (isGemini)
							{
								await new Promise(resolve => setTimeout(resolve, 1000));
							}
							while (element.firstChild)
							{
								element.removeChild(element.firstChild);
							}
							element.appendChild(xmlDoc.createTextNode(translated_text));
						}
						catch (translationError)
						{
							if (translationError.name === 'AbortError')
							{
								throw translationError;
							}
							console.error('Translation error:', translationError);
							while (element.firstChild)
							{
								element.removeChild(element.firstChild);
							}
							element.appendChild(xmlDoc.createTextNode("[Translation Failed]"));
						}
					}
					processedElements += 1;
					this.updateProgress(processedElements, totalElements);
				});
				await Promise.all(translationPromises);
			}
			const serializer = new XMLSerializer();
			const modifiedDocumentXml = serializer.serializeToString(xmlDoc);
			docxData.file("word/document.xml", modifiedDocumentXml);
			const originalFileName = file.name;
			const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
			const ext = originalFileName.substring(originalFileName.lastIndexOf('.'));
			this.state.translatedFileName = `${baseName} ${targetLanguage}${ext}`;
			this.state.translatedBlob = await docxData.generateAsync(
			{
				type: "blob"
			});
			this.downloadTranslatedFile();
			this.elements.downloadBtn.style.display = 'block';
		}
		catch (error)
		{
			if (error.name !== 'AbortError')
			{
				console.error('DOCX processing error:', error);
				alert(`Error processing DOCX file: ${error.message}`);
			}
		}
		finally
		{
			UIState.setTranslating(false, this.elements);
			this.state.abortController = null;
			this.state.requestQueue = [];
			this.state.lastRequestTime = 0;
		}
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const translateApp = new TranslateApp();
	translateApp.init();
});