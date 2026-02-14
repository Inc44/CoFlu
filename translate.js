class TranslateApp
{
	constructor()
	{
		this.els = this.getElements();
		this.state = {
			abortCtrl: null,
			editorAbortCtrl: null,
			optimizedBlob: null,
			optimizedFileName: null,
			translatedBlob: null,
			translatedFileName: null,
			isTranslating: false,
			isGeneratingAll: false,
			isEditorActive: false,
			reqQueue: [],
			lastReqTime: 0,
			editorDocHash: null,
			editorDocFile: null
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
			translateBtn: document.getElementById('translateBtn'),
			editorBtn: document.getElementById('editorBtn'),
			editorSection: document.getElementById('editorSection'),
			editorContainer: document.getElementById('editorContainer'),
			generateAll: document.getElementById('generateAll'),
			clearAll: document.getElementById('clearAll'),
			downloadEdited: document.getElementById('downloadEdited'),
			editorProgress: document.getElementById('editorProgress'),
			editorProgressInner: document.querySelector('#editorProgress .progress-bar'),
			customPromptBox: document.getElementById('customPromptContainer'),
			customPrompt: document.getElementById('customPrompt'),
			promptSelect: document.getElementById('promptSelect'),
			savePromptBtn: document.getElementById('savePrompt'),
			deletePromptBtn: document.getElementById('deletePrompt')
		};
	}
	init()
	{
		this.loadSettings();
		PromptService.loadPrompts(this.els, true);
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
			this.els.langSelect.value = StorageService.load('selected_language', 'English (American)');
		}
		const showDownloadOptimizedButton = StorageService.load('download_optimized_enabled', false) === true;
		if (this.els.optimizeBtn)
		{
			this.els.optimizeBtn.style.display = showDownloadOptimizedButton ? 'block' : 'none';
		}
	}
	getTranslationPrompt(origText)
	{
		const targetLang = this.els.langSelect.value;
		const customPrompt = PromptService.getCustomPrompt(this.els);
		let prompt = customPrompt ? `${customPrompt}\n\n` : '';
		prompt += `${CONFIG.UI.TRANSLATION_PROMPT} ${targetLang}. ${CONFIG.UI.NO_BS_PROMPT}.\n\n${origText}`;
		return prompt;
	}
	setupEvents()
	{
		this.els.apiModel?.addEventListener('change', this.handleApiModelChange.bind(this));
		this.els.downloadBtn?.addEventListener('click', this.downloadFile.bind(this));
		this.els.langSelect?.addEventListener('change', this.handleLangChange.bind(this));
		this.els.optimizeBtn?.addEventListener('click', this.handleOptimizeClick.bind(this));
		this.els.translateBtn?.addEventListener('click', this.handleTranslateClick.bind(this));
		this.els.editorBtn?.addEventListener('click', this.handleEditorToggleChange.bind(this));
		this.els.generateAll?.addEventListener('click', this.handleGenerateAll.bind(this));
		this.els.clearAll?.addEventListener('click', this.handleClearAll.bind(this));
		this.els.downloadEdited?.addEventListener('click', this.handleEditorDownload.bind(this));
		this.els.docFile?.addEventListener('change', this.handleDocFileChange.bind(this));
		window.addEventListener('resize', this.autoResizeAllTextareas.bind(this));
		PromptService.setupPromptEvents(this.els, () => PromptService.loadPrompts(this.els, true));
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
		this.els.translateBtn.style.backgroundColor = isTranslating ? 'var(--red)' : '';
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
	zeroTrim(text)
	{
		return text.replace(/[\u200B-\u200D\uFEFF]/g, '')
			.trim();
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
		const hash = await this.computeFileHash(file);
		const translations = this.loadEditorTranslations(hash);
		this.state.abortCtrl = new AbortController();
		this.showProgress();
		this.hideDownloadBtn();
		this.setTranslateButtonState(true);
		const translatedData = await this.processDocx(file, apiModel, apiKey, translations);
		if (translatedData)
		{
			this.state.translatedBlob = translatedData.blob;
			this.state.translatedFileName = translatedData.fileName;
			this.showDownloadBtn();
			this.downloadFile();
		}
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
	async processDocx(file, apiModel, apiKey, translations = {})
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
		await this.processBatches(batches, xmlDoc, apiModel, apiKey, textElems.length, translations);
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
	async processBatches(batches, xmlDoc, apiModel, apiKey, total, translations = {})
	{
		let processedElems = 0;
		for (const [batchIndex, batch] of batches.entries())
		{
			if (this.state.abortCtrl.signal.aborted)
			{
				return;
			}
			const translatePromises = batch.map(async (elem, elemIndex) =>
			{
				const i = batchIndex * this.batchSize + elemIndex;
				if (translations[i] !== undefined && translations[i] !== '')
				{
					while (elem.firstChild)
					{
						elem.removeChild(elem.firstChild);
					}
					elem.appendChild(xmlDoc.createTextNode(translations[i]));
				}
				else
				{
					await this.translateElement(elem, xmlDoc, apiModel, apiKey);
				}
				processedElems++;
				this.updateProgress(processedElems, total);
			});
			await Promise.all(translatePromises);
		}
	}
	async translateElement(element, xmlDoc, apiModel, apiKey)
	{
		const origText = this.zeroTrim(element.textContent);
		if (!origText) return;
		if (this.isASCIIPrintableNonLettersOnly(origText)) return;
		const prompt = this.getTranslationPrompt(origText);
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
		const resp = await this.rateLimitRequests(apiCall);
		return CONFIG.API.CONFIG.COMPLETION[apiModel].extractContent(resp) || "[Translation Failed]";
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
		this.removeLastRenderedPageBreak(xmlDoc, wNS);
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
	removeLastRenderedPageBreak(xmlDoc, wNS)
	{
		const lastRenderedPageBreaks = Array.from(xmlDoc.getElementsByTagNameNS(wNS, 'lastRenderedPageBreak'));
		for (const lastRenderedPageBreak of lastRenderedPageBreaks)
		{
			if (lastRenderedPageBreak.parentNode) lastRenderedPageBreak.parentNode.removeChild(lastRenderedPageBreak);
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
	containsCJK(text)
	{
		const regex = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
		return regex.test(text);
	}
	getRPrSignature(rPr, wNS, serializer, isLatin)
	{
		if (!rPr) return '';
		const clone = rPr.cloneNode(true);
		const skips = [];
		for (let node = clone.firstChild; node; node = node.nextSibling)
		{
			if (node.nodeType !== 1) continue;
			if (this.isElem(node, wNS, 'lang') || this.isElem(node, wNS, 'rStyle')) skips.push(node);
		}
		skips.forEach(elem => clone.removeChild(elem));
		const rFonts = this.getChild(clone, wNS, 'rFonts');
		if (rFonts && isLatin)
		{
			rFonts.removeAttributeNS(wNS, 'eastAsia');
			if (rFonts.attributes.length === 0)
			{
				clone.removeChild(rFonts);
			}
		}
		if (clone.childNodes.length === 0) return '';
		return serializer.serializeToString(clone);
	}
	isMergeable(child, sibling, wNS, serializer)
	{
		if (!(this.isSimpleRun(child, wNS) && this.isSimpleRun(sibling, wNS))) return false;
		const childPr = this.getChild(child, wNS, 'rPr');
		const siblingPr = this.getChild(sibling, wNS, 'rPr');
		const isLatin = !this.containsCJK(child.textContent) && !this.containsCJK(sibling.textContent);
		const childSignature = this.getRPrSignature(childPr, wNS, serializer, isLatin);
		const siblingSignature = this.getRPrSignature(siblingPr, wNS, serializer, isLatin);
		return childSignature === siblingSignature;
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
	getEditorTranslationsKey(hash)
	{
		return 'editor_translations_' + hash;
	}
	loadEditorTranslations(hash)
	{
		return StorageService.load(this.getEditorTranslationsKey(hash),
		{});
	}
	saveEditorTranslation(hash, index, text)
	{
		const translations = this.loadEditorTranslations(hash);
		translations[index] = text;
		StorageService.save(this.getEditorTranslationsKey(hash), translations);
	}
	clearEditorTranslations(hash)
	{
		StorageService.remove(this.getEditorTranslationsKey(hash));
	}
	async computeFileHash(file)
	{
		const arrayBuffer = await file.arrayBuffer();
		const hashArrayBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
		return Array.from(new Uint8Array(hashArrayBuffer))
			.map(byte => byte.toString(16)
				.padStart(2, '0'))
			.join('');
	}
	autoResizeTextarea(textarea)
	{
		textarea.style.height = 'auto';
		textarea.style.height = textarea.scrollHeight + 'px';
	}
	autoResizeAllTextareas()
	{
		this.els.editorContainer.querySelectorAll('.editor-target')
			.forEach(textarea => this.autoResizeTextarea(textarea));
	}
	setGenerateButtonState(button, isGenerating)
	{
		button.style.minWidth = isGenerating ? button.offsetWidth + 'px' : '';
		button.style.backgroundColor = isGenerating ? 'var(--red) !important' : '';
		button.textContent = isGenerating ? 'Stop' : 'Generate';
	}
	async generateEditorTranslation(index, origText, textarea, button)
	{
		if (button.abortCtrl)
		{
			button.abortCtrl.abort();
			return;
		}
		const apiModel = this.els.apiModel.value;
		const apiKey = StorageService.load(CONFIG.API.KEYS[apiModel]);
		if (!apiKey)
		{
			alert(`Please set your API key for ${apiModel} in settings.`);
			return;
		}
		const abortCtrl = new AbortController();
		button.abortCtrl = abortCtrl;
		this.setGenerateButtonState(button, true);
		const prompt = this.getTranslationPrompt(origText);
		try
		{
			const resp = await AiService.generate(prompt, apiModel,
			{
				abortSignal: abortCtrl.signal
			});
			const translatedText = CONFIG.API.CONFIG.COMPLETION[apiModel].extractContent(resp) || "[Translation Failed]";
			textarea.value = translatedText;
			this.saveEditorTranslation(this.state.editorDocHash, index, translatedText);
			this.autoResizeTextarea(textarea);
		}
		catch (e)
		{
			if (e.name !== 'AbortError')
			{
				console.error('Error translating text:', e);
			}
		}
		finally
		{
			button.abortCtrl = null;
			this.setGenerateButtonState(button, false);
		}
	}
	renderEditor(textElems, translations)
	{
		const container = this.els.editorContainer;
		container.innerHTML = '';
		textElems.forEach((elem, i) =>
		{
			const origText = this.zeroTrim(elem.textContent);
			if (!origText) return;
			if (this.isASCIIPrintableNonLettersOnly(origText)) return;
			const translation = document.createElement('div');
			translation.className = 'editor-translation';
			const number = document.createElement('div');
			number.className = 'text-element-number';
			number.textContent = i;
			const source = document.createElement('div');
			source.className = 'editor-source';
			source.textContent = origText;
			const target = document.createElement('textarea');
			target.className = 'form-control editor-target';
			target.rows = 1;
			target.placeholder = 'Type / Generate Translation';
			target.value = translations[i] !== undefined ? translations[i] : '';
			target.dataset.index = i;
			target.addEventListener('input', () =>
			{
				this.saveEditorTranslation(this.state.editorDocHash, i, target.value);
				this.autoResizeTextarea(target);
			});
			const buttons = document.createElement('div');
			buttons.className = 'editor-buttons';
			const generate = document.createElement('button');
			generate.className = 'btn btn-sm editor-generate';
			generate.textContent = 'Generate';
			generate.addEventListener('click', () => this.generateEditorTranslation(i, origText, target, generate));
			const copy = document.createElement('button');
			copy.className = 'btn btn-sm editor-copy';
			copy.textContent = 'Copy';
			copy.addEventListener('click', () => navigator.clipboard.writeText(target.value));
			const clear = document.createElement('button');
			clear.className = 'btn btn-sm editor-clear';
			clear.textContent = 'Clear';
			clear.addEventListener('click', () =>
			{
				target.value = '';
				this.saveEditorTranslation(this.state.editorDocHash, i, target.value);
				this.autoResizeTextarea(target);
			});
			buttons.appendChild(generate);
			buttons.appendChild(copy);
			buttons.appendChild(clear);
			translation.appendChild(number);
			translation.appendChild(source);
			translation.appendChild(target);
			translation.appendChild(buttons);
			container.appendChild(translation);
		});
	}
	setEditorState(isEditorActive)
	{
		this.els.editorSection.style.display = isEditorActive ? '' : 'none';
		this.els.editorBtn.style.backgroundColor = isEditorActive ? 'var(--red)' : '';
		this.els.editorBtn.textContent = isEditorActive ? 'Close Editor' : 'Open Editor';
		this.state.isEditorActive = isEditorActive;
	}
	async handleDocFileChange()
	{
		if (this.state.isEditorActive && this.els.docFile.files[0])
		{
			await this.loadEditorDocument();
		}
	}
	async handleEditorToggleChange()
	{
		if (this.state.isEditorActive)
		{
			this.setEditorState(false);
			return;
		}
		const file = this.els.docFile.files[0];
		if (!file)
		{
			alert('Please select a DOCX file.');
			return;
		}
		this.setEditorState(true);
		await this.loadEditorDocument();
	}
	async loadEditorDocument()
	{
		const file = this.els.docFile.files[0];
		if (!file) return;
		const hash = await this.computeFileHash(file);
		this.state.editorDocHash = hash;
		this.state.editorDocFile = file;
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
		const translations = this.loadEditorTranslations(hash);
		this.renderEditor(textElems, translations);
		this.autoResizeAllTextareas();
	}
	updateEditorProgress(current, total)
	{
		const percent = Math.round((current / total) * 100);
		this.els.editorProgressInner.style.width = `${percent}%`;
		this.els.editorProgressInner.setAttribute('aria-valuenow', percent);
		this.els.editorProgressInner.textContent = `${percent}%`;
	}
	setGenerateAllButtonState(isGeneratingAll)
	{
		this.els.generateAll.style.backgroundColor = isGeneratingAll ? 'var(--red)' : '';
		this.els.generateAll.textContent = isGeneratingAll ? 'Stop Generating All' : 'Generate All';
		this.els.generateAll.dataset.generatingAll = isGeneratingAll;
		this.state.isGeneratingAll = isGeneratingAll;
	}
	hideEditorProgress()
	{
		this.els.editorProgress.style.display = 'none';
	}
	abortGeneratingAll()
	{
		this.state.editorAbortCtrl?.abort();
		this.setGenerateAllButtonState(false);
		this.hideEditorProgress();
	}
	showEditorProgress()
	{
		this.els.editorProgress.style.display = 'block';
		this.updateEditorProgress(0, 100);
	}
	async processEditorBatches(batches, apiModel, apiKey)
	{
		let processedElems = 0;
		const totalElems = batches.reduce((acc, batch) => acc + batch.length, 0);
		for (const batch of batches)
		{
			if (this.state.editorAbortCtrl.signal.aborted)
			{
				return;
			}
			const translatePromises = batch.map(async (element) =>
			{
				const prompt = this.getTranslationPrompt(element.origText);
				const resp = await AiService.generate(prompt, apiModel,
				{
					abortSignal: this.state.editorAbortCtrl.signal
				});
				const translated = CONFIG.API.CONFIG.COMPLETION[apiModel].extractContent(resp) || "[Translation Failed]";
				element.target.value = translated;
				this.saveEditorTranslation(this.state.editorDocHash, element.index, translated);
				this.autoResizeTextarea(element.target);
				processedElems++;
				this.updateEditorProgress(processedElems, totalElems);
			});
			await Promise.all(translatePromises);
		}
	}
	async handleGenerateAll()
	{
		if (this.state.isGeneratingAll)
		{
			this.abortGeneratingAll();
			return;
		}
		const apiModel = this.els.apiModel.value;
		const apiKey = StorageService.load(CONFIG.API.KEYS[apiModel]);
		if (!apiKey)
		{
			alert(`Please set your API key for ${apiModel} in settings.`);
			return;
		}
		if (!this.state.editorDocHash)
		{
			alert('No document is loaded in the editor.');
			return;
		}
		this.state.editorAbortCtrl = new AbortController();
		this.setGenerateAllButtonState(true);
		this.showEditorProgress();
		const translations = this.els.editorContainer.querySelectorAll('.editor-translation');
		const textElems = [];
		translations.forEach(translation =>
		{
			const source = translation.querySelector('.editor-source');
			const target = translation.querySelector('.editor-target');
			const isEmptyTarget = !target.value.trim();
			if (source && target && isEmptyTarget)
			{
				textElems.push(
				{
					target,
					origText: source.textContent,
					index: parseInt(target.dataset.index, 10)
				});
			}
		});
		const batches = this.createBatches(textElems, this.batchSize);
		await this.processEditorBatches(batches, apiModel, apiKey);
		this.setGenerateAllButtonState(false);
		this.hideEditorProgress();
		this.state.editorAbortCtrl = null;
	}
	handleClearAll()
	{
		this.els.editorContainer.querySelectorAll('.editor-target')
			.forEach(textarea =>
			{
				textarea.value = '';
				this.autoResizeTextarea(textarea);
			});
		if (this.state.editorDocHash)
		{
			this.clearEditorTranslations(this.state.editorDocHash);
		}
	}
	async handleEditorDownload()
	{
		if (!this.state.editorDocFile || !this.state.editorDocHash)
		{
			alert('No document is loaded in the editor.');
			return;
		}
		const translations = this.loadEditorTranslations(this.state.editorDocHash);
		const zip = new JSZip();
		const docxData = await zip.loadAsync(this.state.editorDocFile);
		const docXml = await docxData.file("word/document.xml")
			.async("string");
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(docXml, "application/xml");
		this.optimizeLayout(xmlDoc);
		const wNS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
		const textElems = Array.from(xmlDoc.getElementsByTagNameNS(wNS, 't'));
		textElems.forEach((elem, i) =>
		{
			if (translations[i] !== undefined && translations[i] !== '')
			{
				while (elem.firstChild)
				{
					elem.removeChild(elem.firstChild);
				}
				elem.appendChild(xmlDoc.createTextNode(translations[i]));
			}
		});
		const serializer = new XMLSerializer();
		const modifiedDocXml = serializer.serializeToString(xmlDoc);
		docxData.file("word/document.xml", modifiedDocXml);
		const origName = this.state.editorDocFile.name;
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
		this.downloadBlob(translatedBlob, translatedName);
	}
}
document.addEventListener('DOMContentLoaded', () =>
{
	const translateApp = new TranslateApp();
	translateApp.init();
});