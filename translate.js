class TranslateApp
{
	constructor()
	{
		this.els = this.getElements();
		this.state = {
			abortCtrl: null,
			optimizedBlob: null,
			optimizedFileName: null,
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
			optimizeBtn: document.getElementById('downloadOptimized'),
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
		const showDownloadOptimizedButton = StorageService.load('download_optimized_enabled', false) === true;
		if (this.els.optimizeBtn)
		{
			this.els.optimizeBtn.style.display = showDownloadOptimizedButton ? 'block' : 'none';
		}
	}
	setupEvents()
	{
		this.els.apiModel?.addEventListener('change', this.handleApiModelChange.bind(this));
		this.els.downloadBtn?.addEventListener('click', this.downloadFile.bind(this));
		this.els.langSelect?.addEventListener('change', this.handleLangChange.bind(this));
		this.els.optimizeBtn?.addEventListener('click', this.handleOptimizeClick.bind(this));
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
	downloadBlob(blob, fileName)
	{
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
	downloadFile()
	{
		if (!this.state.translatedBlob || !this.state.translatedFileName)
		{
			return;
		}
		this.downloadBlob(this.state.translatedBlob, this.state.translatedFileName);
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
		const details = UtilService.getDetails(apiModel);
		if (apiModel === 'openai' && details && details.modality === 'audio')
		{
			alert('Selected OpenAI audio model requires audio input and cannot be used for DOCX translation. Select a different model.');
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
		this.optimizeLayout(xmlDoc);
		const wNS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
		const textElems = Array.from(xmlDoc.getElementsByTagNameNS(wNS, 't'));
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
		if (this.isASCIIPrintableNonLettersOnly(origText)) return;
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
	async handleOptimizeClick()
	{
		const file = this.els.docFile.files[0];
		if (!file)
		{
			alert('Please select a DOCX file.');
			return;
		}
		const optimizedData = await this.optimizeDocx(file);
		this.state.optimizedBlob = optimizedData.blob;
		this.state.optimizedFileName = optimizedData.fileName;
		this.downloadBlob(this.state.optimizedBlob, this.state.optimizedFileName);
	}
	async optimizeDocx(file)
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
		this.optimizeLayout(xmlDoc);
		const serializer = new XMLSerializer();
		const modifiedDocXml = serializer.serializeToString(xmlDoc);
		docxData.file("word/document.xml", modifiedDocXml);
		const origName = file.name;
		const baseName = origName.substring(0, origName.lastIndexOf('.'));
		const ext = origName.substring(origName.lastIndexOf('.'));
		const optimizedName = `${baseName} optimized${ext}`;
		const optimizedBlob = await docxData.generateAsync(
		{
			type: "blob",
			compression: "DEFLATE",
			compressionOptions:
			{
				level: 9
			}
		});
		return {
			blob: optimizedBlob,
			fileName: optimizedName
		};
	}
	optimizeLayout(xmlDoc)
	{
		const wNS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
		const serializer = new XMLSerializer();
		this.removeProofErr(xmlDoc, wNS);
		const ps = Array.from(xmlDoc.getElementsByTagNameNS(wNS, 'p'));
		for (const p of ps)
		{
			this.collapseAdjacentRunsInParagraph(p, wNS, serializer);
		}
	}
	removeProofErr(xmlDoc, wNS)
	{
		const proofErrs = Array.from(xmlDoc.getElementsByTagNameNS(wNS, 'proofErr'));
		for (const proofErr of proofErrs)
		{
			if (proofErr.parentNode) proofErr.parentNode.removeChild(proofErr);
		}
	}
	collapseAdjacentRunsInParagraph(p, wNS, serializer)
	{
		for (let child = p.firstChild; child; child = child.nextSibling)
		{
			if (!this.isElem(child, wNS, 'r')) continue;
			this.mergeAdjacentRuns(child, wNS);
			for (let sibling = child.nextSibling; sibling && this.isElem(sibling, wNS, 'r') && this.isMergeable(child, sibling, wNS, serializer);)
			{
				const next = sibling.nextSibling;
				this.mergeRuns(child, sibling, wNS);
				p.removeChild(sibling);
				sibling = next;
			}
		}
	}
	isElem(node, wNS, name)
	{
		return node && node.nodeType === 1 && node.namespaceURI === wNS && node.localName === name;
	}
	isMergeable(child, sibling, wNS, serializer)
	{
		const childPr = this.getChild(child, wNS, 'rPr');
		const siblingPr = this.getChild(sibling, wNS, 'rPr');
		if (!(this.isSimpleRun(child, wNS) && this.isSimpleRun(sibling, wNS))) return false;
		if (childPr !== siblingPr) return false;
		return !childPr || serializer.serializeToString(childPr) === serializer.serializeToString(siblingPr);
	}
	getChild(node, wNS, name)
	{
		for (let child = node.firstChild; child; child = child.nextSibling)
		{
			if (this.isElem(child, wNS, name)) return child;
		}
		return null;
	}
	isSimpleRun(run, wNS)
	{
		for (let node = run.firstChild; node; node = node.nextSibling)
		{
			if (node.nodeType !== 1) continue;
			if (!(this.isElem(node, wNS, 'rPr') || this.isElem(node, wNS, 't'))) return false;
		}
		return true;
	}
	mergeRuns(child, sibling, wNS)
	{
		for (let node = sibling.firstChild, next; node; node = next)
		{
			next = node.nextSibling;
			if (this.isElem(node, wNS, 't')) child.appendChild(node);
		}
		this.mergeAdjacentRuns(child, wNS);
	}
	mergeAdjacentRuns(run, wNS)
	{
		const xmlNS = "http://www.w3.org/XML/1998/namespace";
		for (let child = run.firstChild; child; child = child.nextSibling)
		{
			if (!this.isElem(child, wNS, 't')) continue;
			let text = child.textContent || '';
			let preserve = child.getAttributeNS(xmlNS, 'space') === 'preserve';
			for (let sibling = child.nextSibling, next; sibling && this.isElem(sibling, wNS, 't'); sibling = next)
			{
				if (sibling.getAttributeNS(xmlNS, 'space') === 'preserve') preserve = true;
				text += sibling.textContent || '';
				next = sibling.nextSibling;
				run.removeChild(sibling);
			}
			child.textContent = text;
			if (preserve) child.setAttributeNS(xmlNS, 'xml:space', 'preserve');
			else child.removeAttributeNS(xmlNS, 'space');
		}
	}
	isASCIIPrintableNonLettersOnly(text)
	{
		for (let i = 0; i < text.length; i++)
		{
			const code = text.charCodeAt(i);
			if (code < 32 || code > 127) return false;
			const char = text[i];
			if ((char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z')) return false;
		}
		return true;
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const translateApp = new TranslateApp();
	translateApp.init();
});