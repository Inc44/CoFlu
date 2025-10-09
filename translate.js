class TranslateApp
{
	constructor()
	{
		this.els = this.getElements();
		this.state = {
			abortCtrl: null,
			translatedBlob: null,
			translatedFileName: null,
			isTranslating: false,
			reqQueue: [],
			lastReqTime: 0
		};
		this.batchSize = this.getNumSetting('translation_batch_size', 10);
		this.expRetry = this.getNumSetting('exponential_retry', 10);
		this.rateLimit = this.getNumSetting('translation_batch_rpm', 0);
	}
	getElements()
	{
		return {
			apiModel: document.getElementById('apiModel'),
			docFile: document.getElementById('documentFile'),
			downloadBtn: document.getElementById('downloadTranslated'),
			langSelect: document.getElementById('language'),
			progressBar: document.getElementById('translateProgress'),
			progressInner: document.querySelector('#translateProgress .progress-bar'),
			translateBtn: document.getElementById('translateBtn')
		};
	}
	init()
	{
		this.loadSettings();
		this.setupEvents();
	}
	loadSettings()
	{
		const savedModel = StorageService.load('selected_api_model', 'openai');
		if (this.els.apiModel)
		{
			this.els.apiModel.value = savedModel;
		}
		if (this.els.langSelect)
		{
			this.els.langSelect.value = StorageService.load('selected_language', 'English');
		}
	}
	setupEvents()
	{
		this.els.apiModel?.addEventListener('change', this.handleApiModelChange.bind(this));
		this.els.downloadBtn?.addEventListener('click', this.downloadFile.bind(this));
		this.els.langSelect?.addEventListener('change', this.handleLangChange.bind(this));
		this.els.translateBtn?.addEventListener('click', this.handleTranslateClick.bind(this));
	}
	handleApiModelChange()
	{
		const model = this.els.apiModel.value;
		StorageService.save('selected_api_model', model);
		this.batchSize = this.getNumSetting('translation_batch_size', 10);
		this.expRetry = this.getNumSetting('exponential_retry', 10);
		this.rateLimit = this.getNumSetting('translation_batch_rpm', 0);
	}
	handleLangChange()
	{
		StorageService.save('selected_language', this.els.langSelect.value);
	}
	handleTranslateClick()
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
		const percent = Math.round((current / total) * 100);
		this.els.progressInner.style.width = `${percent}%`;
		this.els.progressInner.setAttribute('aria-valuenow', percent);
		this.els.progressInner.textContent = `${percent}%`;
		this.els.progressInner.classList.add('progress-bar-animated');
	}
	showProgress()
	{
		this.els.progressBar.style.display = 'block';
		this.updateProgress(0, 100);
	}
	hideProgress()
	{
		this.els.progressBar.style.display = 'none';
	}
	showDownloadBtn()
	{
		this.els.downloadBtn.style.display = 'block';
	}
	hideDownloadBtn()
	{
		this.els.downloadBtn.style.display = 'none';
	}
	setTranslateButtonState(isTranslating)
	{
		this.els.translateBtn.style.backgroundColor = isTranslating ? 'red' : '';
		this.els.translateBtn.textContent = isTranslating ? 'Stop Translation' : 'Start Translation';
		this.els.translateBtn.dataset.translating = isTranslating;
		this.state.isTranslating = isTranslating;
	}
	getNumSetting(key, defValue, min = null, max = null)
	{
		let value = parseInt(StorageService.load(key, defValue), 10);
		if (isNaN(value))
		{
			value = defValue;
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
	downloadFile()
	{
		if (!this.state.translatedBlob || !this.state.translatedFileName)
		{
			return;
		}
		const url = URL.createObjectURL(this.state.translatedBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = this.state.translatedFileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
	async startTranslation()
	{
		const file = this.els.docFile.files[0];
		if (!file)
		{
			alert('Please select a DOCX file.');
			return;
		}
		const apiModel = this.els.apiModel.value;
		const apiKey = StorageService.load(CONFIG.API.KEYS[apiModel]);
		if (!apiKey)
		{
			alert(`Please set your API key for ${apiModel} in settings.`);
			return;
		}
		this.state.abortCtrl = new AbortController();
		this.showProgress();
		this.hideDownloadBtn();
		this.setTranslateButtonState(true);
		const translatedData = await this.processDocx(file, apiModel, apiKey);
		this.state.translatedBlob = translatedData.blob;
		this.state.translatedFileName = translatedData.fileName;
		this.showDownloadBtn();
		this.downloadFile();
		this.setTranslateButtonState(false);
		this.hideProgress();
		this.state.abortCtrl = null;
		this.state.reqQueue = [];
		this.state.lastReqTime = 0;
	}
	abortTranslation()
	{
		this.state.abortCtrl?.abort();
		this.state.reqQueue = [];
		this.state.lastReqTime = 0;
		this.setTranslateButtonState(false);
		this.hideProgress();
	}
	async processDocx(file, apiModel, apiKey)
	{
		const zip = new JSZip();
		const docxData = await zip.loadAsync(file);
		if (!docxData.file("word/document.xml"))
		{
			alert("Invalid DOCX file: 'word/document.xml' not found.");
			return;
		}
		const docXml = await docxData.file("word/document.xml")
			.async("string");
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(docXml, "application/xml");
		const textElems = Array.from(xmlDoc.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", 't'));
		if (textElems.length === 0)
		{
			alert("No text elements found in the document.");
			return;
		}
		const batches = this.createBatches(textElems, this.batchSize);
		await this.processBatches(batches, xmlDoc, apiModel, apiKey);
		const serializer = new XMLSerializer();
		const modifiedDocXml = serializer.serializeToString(xmlDoc);
		docxData.file("word/document.xml", modifiedDocXml);
		const origName = file.name;
		const baseName = origName.substring(0, origName.lastIndexOf('.'));
		const ext = origName.substring(origName.lastIndexOf('.'));
		const translatedName = `${baseName} ${this.els.langSelect.value}${ext}`;
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
			fileName: translatedName
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
		let processedElems = 0;
		const totalElems = batches.reduce((acc, batch) => acc + batch.length, 0);
		for (const batch of batches)
		{
			if (this.state.abortCtrl.signal.aborted)
			{
				return;
			}
			const translatePromises = batch.map(async (element) =>
			{
				return this.translateElement(element, xmlDoc, apiModel, apiKey)
					.then(() =>
					{
						processedElems++;
						this.updateProgress(processedElems, totalElems);
					});
			});
			await Promise.all(translatePromises);
		}
	}
	async translateElement(element, xmlDoc, apiModel, apiKey)
	{
		const origText = element.textContent.trim();
		if (!origText) return;
		const targetLang = this.els.langSelect.value;
		const prompt = `${CONFIG.UI.TRANSLATION_PROMPT} ${targetLang}. ${CONFIG.UI.NO_BS_PROMPT}.\n\n${origText}`;
		const translatedText = await this.getTranslatedText(prompt, apiModel, apiKey);
		while (element.firstChild)
		{
			element.removeChild(element.firstChild);
		}
		element.appendChild(xmlDoc.createTextNode(translatedText));
	}
	async getTranslatedText(prompt, apiModel, apiKey)
	{
		const apiCall = () => AiService.generate(prompt, apiModel,
		{
			abortSignal: this.state.abortCtrl.signal
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
			this.state.reqQueue.push(
			{
				apiCall,
				resolve,
				reject
			});
			this.processQueue();
		});
	}
	async processQueue()
	{
		if (this.state.reqQueue.length === 0 || this.state.isTranslating === false)
		{
			return;
		}
		const now = Date.now();
		const timeSinceLastReq = now - this.state.lastReqTime;
		const delayNeeded = (60000 / this.rateLimit) - timeSinceLastReq;
		if (delayNeeded > 0)
		{
			await new Promise(resolve => setTimeout(resolve, delayNeeded));
		}
		this.state.lastReqTime = Date.now();
		const
		{
			apiCall,
			resolve
		} = this.state.reqQueue.shift();
		const result = await apiCall();
		resolve(result);
		if (this.state.reqQueue.length > 0)
		{
			setTimeout(() => this.processQueue(), 0);
		}
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const translateApp = new TranslateApp();
	translateApp.init();
});