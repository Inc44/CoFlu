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
			isTranslating: false,
			requestQueue: [],
			lastRequestTime: 0,
		};
		this.batchSize = this.getBatchSize();
		this.exponentialRetry = this.getExponentialRetry();
		this.rateLimit = this.getRateLimit();
	}
	getElements()
	{
		return {
			apiModelSelect: document.getElementById('apiModel'),
			documentFile: document.getElementById('documentFile'),
			downloadBtn: document.getElementById('downloadTranslated'),
			languageSelect: document.getElementById('language'),
			progressBar: document.getElementById('translateProgress'),
			progressBarInner: document.querySelector('#translateProgress .progress-bar'),
			translateBtn: document.getElementById('translateBtn')
		};
	}
	init()
	{
		this.loadSettings();
		this.setupEventListeners();
	}
	loadSettings()
	{
		const savedModel = StorageService.load('selected_api_model', 'openai');
		if (this.elements.apiModelSelect)
		{
			this.elements.apiModelSelect.value = savedModel;
		}
		if (this.elements.languageSelect)
		{
			this.elements.languageSelect.value = StorageService.load('selected_language', 'English');
		}
	}
	setupEventListeners()
	{
		this.elements.apiModelSelect?.addEventListener('change', this.handleApiModelChange.bind(this));
		this.elements.downloadBtn?.addEventListener('click', this.downloadTranslatedFile.bind(this));
		this.elements.languageSelect?.addEventListener('change', this.handleLanguageChange.bind(this));
		this.elements.translateBtn?.addEventListener('click', this.handleTranslateButtonClick.bind(this));
	}
	handleApiModelChange()
	{
		const selectedModel = this.elements.apiModelSelect.value;
		StorageService.save('selected_api_model', selectedModel);
		this.batchSize = this.getBatchSize();
		this.exponentialRetry = this.getExponentialRetry();
		this.rateLimit = this.getRateLimit();
	}
	handleLanguageChange()
	{
		StorageService.save('selected_language', this.elements.languageSelect.value);
	}
	handleTranslateButtonClick()
	{
		if (this.state.isTranslating)
		{
			this.abortTranslation();
		}
		else
		{
			this.startTranslation();
		}
	}
	updateProgress(current, total)
	{
		const percentage = Math.round((current / total) * 100);
		this.elements.progressBarInner.style.width = `${percentage}%`;
		this.elements.progressBarInner.setAttribute('aria-valuenow', percentage);
		this.elements.progressBarInner.textContent = `${percentage}%`;
		this.elements.progressBarInner.classList.add('progress-bar-animated');
	}
	showProgressBar()
	{
		this.elements.progressBar.style.display = 'block';
		this.updateProgress(0, 100);
	}
	hideProgressBar()
	{
		this.elements.progressBar.style.display = 'none';
	}
	showDownloadButton()
	{
		this.elements.downloadBtn.style.display = 'block';
	}
	hideDownloadButton()
	{
		this.elements.downloadBtn.style.display = 'none';
	}
	setTranslateButtonState(isTranslating)
	{
		this.elements.translateBtn.style.backgroundColor = isTranslating ? 'red' : '';
		this.elements.translateBtn.textContent = isTranslating ? 'Stop Translation' : 'Start Translation';
		this.elements.translateBtn.dataset.translating = isTranslating;
		this.state.isTranslating = isTranslating;
	}
	getBatchSize()
	{
		return this.getNumericSetting('translation_batch_size', 10, 1, 60000);
	}
	getRateLimit()
	{
		return this.getNumericSetting('translation_batch_rpm', 0, 0, 60000);
	}
	getExponentialRetry()
	{
		return this.getNumericSetting('exponential_retry', 10, 0);
	}
	getNumericSetting(key, defaultValue, min = null, max = null)
	{
		let value = parseInt(StorageService.load(key, defaultValue), 10);
		if (isNaN(value))
		{
			value = defaultValue;
		}
		if (min !== null && value < min)
		{
			value = min;
		}
		if (max !== null && value > max)
		{
			value = max;
		}
		return value;
	}
	downloadTranslatedFile()
	{
		if (!this.state.translatedBlob || !this.state.translatedFileName)
		{
			console.warn("No translated file available to download.");
			return;
		}
		const url = URL.createObjectURL(this.state.translatedBlob);
		const downloadLink = document.createElement('a');
		downloadLink.href = url;
		downloadLink.download = this.state.translatedFileName;
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
		URL.revokeObjectURL(url);
	}
	async startTranslation()
	{
		const file = this.elements.documentFile.files[0];
		if (!file)
		{
			alert('Please select a DOCX file.');
			return;
		}
		const apiModel = this.elements.apiModelSelect.value;
		const apiKey = StorageService.load(CONFIG.API.KEYS[apiModel]);
		if (!apiKey)
		{
			alert(`Please set your API key for ${apiModel} in settings.`);
			return;
		}
		this.state.abortController = new AbortController();
		this.showProgressBar();
		this.hideDownloadButton();
		this.setTranslateButtonState(true);
		try
		{
			const translatedData = await this.processDocxFile(file, apiModel, apiKey);
			this.state.translatedBlob = translatedData.blob;
			this.state.translatedFileName = translatedData.fileName;
			this.showDownloadButton();
			this.downloadTranslatedFile();
		}
		catch (error)
		{
			if (error.name !== 'AbortError')
			{
				console.error('Translation failed:', error);
				alert(`Translation failed: ${error.message}`);
			}
		}
		finally
		{
			this.setTranslateButtonState(false);
			this.hideProgressBar();
			this.state.abortController = null;
			this.state.requestQueue = [];
			this.state.lastRequestTime = 0;
		}
	}
	abortTranslation()
	{
		this.state.abortController?.abort();
		this.state.requestQueue = [];
		this.state.lastRequestTime = 0;
		this.setTranslateButtonState(false);
		this.hideProgressBar();
		console.log('Translation aborted.');
	}
	async processDocxFile(file, apiModel, apiKey)
	{
		const zip = new JSZip();
		const docxData = await zip.loadAsync(file);
		if (!docxData.file("word/document.xml"))
		{
			throw new Error("Invalid DOCX file: 'word/document.xml' not found.");
		}
		const documentXmlContent = await docxData.file("word/document.xml")
			.async("string");
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(documentXmlContent, "application/xml");
		const textElements = Array.from(xmlDoc.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", 't'));
		if (textElements.length === 0)
		{
			throw new Error("No text elements found in the document.");
		}
		const batches = this.createBatches(textElements, this.batchSize);
		await this.processBatches(batches, xmlDoc, apiModel, apiKey);
		const serializer = new XMLSerializer();
		const modifiedDocumentXml = serializer.serializeToString(xmlDoc);
		docxData.file("word/document.xml", modifiedDocumentXml);
		const originalFileName = file.name;
		const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
		const ext = originalFileName.substring(originalFileName.lastIndexOf('.'));
		const translatedFileName = `${baseName} ${this.elements.languageSelect.value}${ext}`;
		const translatedBlob = await docxData.generateAsync(
		{
			type: "blob",
			compression: "DEFLATE",
			compressionOptions:
			{
				level: 9
			}
		});
		return {
			blob: translatedBlob,
			fileName: translatedFileName
		};
	}
	createBatches(elements, batchSize)
	{
		const batches = [];
		for (let i = 0; i < elements.length; i += batchSize)
		{
			batches.push(elements.slice(i, i + batchSize));
		}
		return batches;
	}
	async processBatches(batches, xmlDoc, apiModel, apiKey)
	{
		let processedElements = 0;
		const totalElements = batches.reduce((acc, batch) => acc + batch.length, 0);
		for (const batch of batches)
		{
			if (this.state.abortController.signal.aborted)
			{
				throw new DOMException('Aborted', 'AbortError');
			}
			const translationPromises = batch.map(async (element) =>
			{
				return this.translateElement(element, xmlDoc, apiModel, apiKey)
					.then(() =>
					{
						processedElements++;
						this.updateProgress(processedElements, totalElements);
					})
			});
			await Promise.all(translationPromises);
		}
	}
	async translateElement(element, xmlDoc, apiModel, apiKey)
	{
		const originalText = element.textContent.trim();
		if (!originalText)
		{
			return;
		}
		const targetLanguage = this.elements.languageSelect.value;
		const prompt = `${CONFIG.UI.TRANSLATION_PROMPT} ${targetLanguage}. ${CONFIG.UI.NO_BS_PROMPT}.\n\n${originalText}`;
		try
		{
			const translatedText = await this.getTranslatedText(prompt, apiModel, apiKey);
			while (element.firstChild)
			{
				element.removeChild(element.firstChild);
			}
			element.appendChild(xmlDoc.createTextNode(translatedText));
		}
		catch (error)
		{
			if (error.name !== 'AbortError')
			{
				console.error('Translation error:', error);
				while (element.firstChild)
				{
					element.removeChild(element.firstChild);
				}
				element.appendChild(xmlDoc.createTextNode("[Translation Failed]"));
			}
			else
			{
				throw error;
			}
		}
	}
	async getTranslatedText(prompt, apiModel, apiKey)
	{
		const apiCall = () => AiService.generate(prompt, apiModel,
		{
			abortSignal: this.state.abortController.signal
		});
		const response = await this.rateLimitRequests(apiCall);
		return CONFIG.API.CONFIG.COMPLETION[apiModel].extractContent(response) || "[Translation Failed]";
	}
	async rateLimitRequests(apiCall)
	{
		if (this.rateLimit === 0)
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
			this.processRequestQueue();
		});
	}
	async processRequestQueue()
	{
		if (this.state.requestQueue.length === 0 || this.state.isTranslating === false)
		{
			return;
		}
		const now = Date.now();
		const timeSinceLastRequest = now - this.state.lastRequestTime;
		const delayRequired = (60000 / this.rateLimit) - timeSinceLastRequest;
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
			setTimeout(() => this.processRequestQueue(), 0);
		}
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const translateApp = new TranslateApp();
	translateApp.init();
});