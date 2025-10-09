const UIComponents = {};
class BaseUploader
{
	constructor(el, options = {}, cfg = {})
	{
		this.el = el;
		this.options = options;
		this.items = {};
		this.card = document.getElementById(cfg.cardId);
		this.acceptPredicate = cfg.acceptPredicate;
		this.defaultProvider = cfg.defaultProvider;
		this.typeName = cfg.typeName;
		this.setupEvents();
		this.setupDragAndDrop();
		this.setupPaste();
	}
	setupEvents()
	{
		if (!this.el) return;
		this.el.addEventListener('change', (e) =>
		{
			this.handleUpload(Array.from(e.target.files));
			this.el.value = '';
		});
	}
	setupDragAndDrop()
	{
		if (!this.card) return;
		['dragenter', 'dragover'].forEach((eventName) => this.card.addEventListener(eventName, (event) =>
		{
			event.preventDefault();
			this.card.classList.add('dragging');
		}));
		['dragleave', 'drop'].forEach((eventName) => this.card.addEventListener(eventName, (event) =>
		{
			event.preventDefault();
			this.card.classList.remove('dragging');
		}));
		this.card.addEventListener('drop', (event) =>
		{
			if (!event.dataTransfer.files.length) return;
			const files = Array.from(event.dataTransfer.files)
				.filter(file => this.acceptPredicate(file));
			if (files.length === 0) return;
			this.handleUpload(files);
		});
	}
	setupPaste()
	{
		if (!this.card) return;
		document.addEventListener('paste', (event) =>
		{
			if (!event.clipboardData.files.length) return;
			const files = Array.from(event.clipboardData.files)
				.filter(file => this.acceptPredicate(file));
			if (files.length === 0) return;
			event.preventDefault();
			this.handleUpload(files);
		});
	}
	getTotalSize()
	{
		let size = 0;
		for (const filename in this.items)
		{
			const dataURL = this.items[filename];
			const base64 = dataURL.split(',')[1];
			const bytes = (base64.length * (3 / 4));
			size += bytes / (1024 * 1024);
		}
		return size;
	}
	readAsDataURL(file)
	{
		return new Promise(resolve =>
		{
			const reader = new FileReader();
			reader.onload = e => resolve(e.target.result);
			reader.readAsDataURL(file);
		});
	}
	async handleUpload(files)
	{
		const apiModel = this.options.getApiModel?.() || this.defaultProvider;
		const limits = CONFIG.LIMITS.COMPLETION[this.typeName.toUpperCase()][apiModel];
		if (files.length + Object.keys(this.items)
			.length > limits.max)
		{
			alert(`Maximum ${limits.max} ${this.typeName}s allowed for ${apiModel}`);
			return;
		}
		for (const file of files)
		{
			if (!this.acceptPredicate(file))
			{
				alert(`Only ${this.typeName} files are allowed.`);
				continue;
			}
			const fileSizeMB = file.size / (1024 * 1024);
			if (fileSizeMB > limits.size)
			{
				alert(`${this.typeName.charAt(0).toUpperCase() + this.typeName.slice(1)} ${file.name} exceeds the maximum size of ${limits.size}MB.`);
				continue;
			}
			const totalSize = this.getTotalSize();
			const newSize = totalSize + fileSizeMB;
			if (newSize > 20)
			{
				alert(`Adding this ${this.typeName} would exceed the 20MB total size limit.`);
				continue;
			}
			const dataUrl = await this.readAsDataURL(file);
			this.items[file.name] = dataUrl;
			this.updateDisplay();
		}
	}
	updateDisplay()
	{
		if (!this.options.displayElement) return;
		const container = this.options.displayElement;
		container.innerHTML = '';
		Object.entries(this.items)
			.forEach(([filename, dataURL]) =>
			{
				const el = this.createItemElement(filename, dataURL, () =>
				{
					delete this.items[filename];
					this.updateDisplay();
				});
				container.appendChild(el);
			});
	}
	clear()
	{
		this.items = {};
		this.updateDisplay();
	}
}
UIComponents.BaseUploader = BaseUploader;
UIComponents.AudioUploader = class extends BaseUploader
{
	constructor(el, options = {})
	{
		super(el, options,
		{
			cardId: 'audioUploadCard',
			acceptPredicate: file => file.type.startsWith('audio/'),
			defaultProvider: 'google',
			typeName: 'audio'
		});
		this.audios = this.items;
	}
	createItemElement(filename, dataURL, onRemove)
	{
		const audioBox = document.createElement('div');
		audioBox.className = 'audio-container d-flex align-items-center justify-content-between';
		const nameEl = document.createElement('div');
		nameEl.textContent = filename;
		nameEl.classList.add('audio-filename', 'me-2');
		const removeBtn = document.createElement('button');
		removeBtn.className = 'btn btn-sm btn-danger remove-audio';
		removeBtn.textContent = 'X';
		removeBtn.onclick = onRemove;
		audioBox.appendChild(nameEl);
		audioBox.appendChild(removeBtn);
		return audioBox;
	}
	getAudios()
	{
		return this.audios;
	}
};
UIComponents.FileUploader = class extends BaseUploader
{
	constructor(el, options = {})
	{
		super(el, options,
		{
			cardId: 'fileUploadCard',
			acceptPredicate: file => file.type.startsWith('application/pdf'),
			defaultProvider: 'openai',
			typeName: 'file'
		});
		this.files = this.items;
	}
	createItemElement(filename, dataURL, onRemove)
	{
		const fileBox = document.createElement('div');
		fileBox.className = 'file-container d-flex align-items-center justify-content-between';
		const nameEl = document.createElement('div');
		nameEl.textContent = filename;
		nameEl.classList.add('file-filename', 'me-2');
		const removeBtn = document.createElement('button');
		removeBtn.className = 'btn btn-sm btn-danger remove-file';
		removeBtn.textContent = 'X';
		removeBtn.onclick = onRemove;
		fileBox.appendChild(nameEl);
		fileBox.appendChild(removeBtn);
		return fileBox;
	}
	getFiles()
	{
		return this.files;
	}
};
UIComponents.ImageUploader = class extends BaseUploader
{
	constructor(el, options = {})
	{
		super(el, options,
		{
			cardId: 'imageUploadCard',
			acceptPredicate: file => file.type.startsWith('image/'),
			defaultProvider: 'openai',
			typeName: 'image'
		});
		this.images = this.items;
	}
	createItemElement(filename, dataURL, onRemove)
	{
		const imgBox = document.createElement('div');
		imgBox.className = 'image-container';
		const img = document.createElement('img');
		img.src = dataURL;
		img.alt = filename;
		img.title = filename;
		const removeBtn = document.createElement('button');
		removeBtn.className = 'btn btn-sm btn-danger remove-image';
		removeBtn.textContent = 'X';
		removeBtn.onclick = onRemove;
		imgBox.appendChild(img);
		imgBox.appendChild(removeBtn);
		return imgBox;
	}
	getImages()
	{
		return this.images;
	}
};
UIComponents.VideoUploader = class extends BaseUploader
{
	constructor(el, options = {})
	{
		super(el, options,
		{
			cardId: 'videoUploadCard',
			acceptPredicate: file => file.type.startsWith('video/'),
			defaultProvider: 'google',
			typeName: 'video'
		});
		this.videos = this.items;
	}
	createItemElement(filename, dataURL, onRemove)
	{
		const videoBox = document.createElement('div');
		videoBox.className = 'video-container';
		const video = document.createElement('video');
		video.src = dataURL;
		video.controls = false;
		video.muted = true;
		video.loop = true;
		video.pause();
		const removeBtn = document.createElement('button');
		removeBtn.className = 'btn btn-sm btn-danger remove-video';
		removeBtn.textContent = 'X';
		removeBtn.onclick = onRemove;
		videoBox.appendChild(video);
		videoBox.appendChild(removeBtn);
		return videoBox;
	}
	getVideos()
	{
		return this.videos;
	}
};
window.UIComponents = UIComponents;