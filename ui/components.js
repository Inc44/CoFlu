const UIComponents = {
	AudioUploader: class
	{
		constructor(el, options = {})
		{
			this.el = el;
			this.options = options;
			this.audios = {};
			this.setupEvents();
		}
		setupEvents()
		{
			this.el.addEventListener('change', (e) =>
			{
				this.handleUpload(Array.from(e.target.files));
				this.el.value = '';
			});
		}
		getTotalSize()
		{
			let size = 0;
			for (const filename in this.audios)
			{
				const dataURL = this.audios[filename];
				const base64 = dataURL.split(',')[1];
				const bytes = (base64.length * (3 / 4));
				size += bytes / (1024 * 1024);
			}
			return size;
		}
		async handleUpload(files)
		{
			const apiModel = this.options.getApiModel?.() || 'google';
			const limits = CONFIG.LIMITS.COMPLETION.AUDIO[apiModel];
			if (files.length + Object.keys(this.audios)
				.length > limits.max)
			{
				alert(`Maximum ${limits.max} audios allowed for ${apiModel}`);
				return;
			}
			for (const file of files)
			{
				if (!file.type.startsWith('audio/'))
				{
					alert('Only audio files are allowed.');
					continue;
				}
				const fileSizeMB = file.size / (1024 * 1024);
				if (fileSizeMB > limits.size)
				{
					alert(`Audio ${file.name} exceeds the maximum size of ${limits.size}MB.`);
					continue;
				}
				const totalSize = this.getTotalSize();
				const newSize = totalSize + fileSizeMB;
				if (newSize > 20)
				{
					alert(`Adding this file would exceed the 20MB total size limit.`);
					continue;
				}
				const dataUrl = await this.readAsDataURL(file);
				this.audios[file.name] = dataUrl;
				this.updateDisplay();
			}
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
		updateDisplay()
		{
			if (!this.options.displayElement) return;
			const container = this.options.displayElement;
			container.innerHTML = '';
			Object.entries(this.audios)
				.forEach(([filename, dataURL]) =>
				{
					const audioBox = document.createElement('div');
					audioBox.className = 'audio-container d-flex align-items-center justify-content-between';
					const nameEl = document.createElement('div');
					nameEl.textContent = filename;
					nameEl.classList.add('audio-filename', "me-2");
					const removeBtn = document.createElement('button');
					removeBtn.className = 'btn btn-sm btn-danger remove-audio';
					removeBtn.textContent = 'X';
					removeBtn.onclick = () =>
					{
						delete this.audios[filename];
						this.updateDisplay();
					};
					audioBox.appendChild(nameEl);
					audioBox.appendChild(removeBtn);
					container.appendChild(audioBox);
				});
		}
		getAudios()
		{
			return this.audios;
		}
		clear()
		{
			this.audios = {};
			this.updateDisplay();
		}
	},
	ImageUploader: class
	{
		constructor(el, options = {})
		{
			this.el = el;
			this.options = options;
			this.images = {};
			this.setupEvents();
		}
		setupEvents()
		{
			this.el.addEventListener('change', (e) =>
			{
				this.handleUpload(Array.from(e.target.files));
				this.el.value = '';
			});
		}
		getTotalSize()
		{
			let size = 0;
			for (const filename in this.images)
			{
				const dataURL = this.images[filename];
				const base64 = dataURL.split(',')[1];
				const bytes = (base64.length * (3 / 4));
				size += bytes / (1024 * 1024);
			}
			return size;
		}
		async handleUpload(files)
		{
			const apiModel = this.options.getApiModel?.() || 'openai';
			const limits = CONFIG.LIMITS.COMPLETION.IMAGE[apiModel];
			if (files.length + Object.keys(this.images)
				.length > limits.max)
			{
				alert(`Maximum ${limits.max} images allowed for ${apiModel}`);
				return;
			}
			for (const file of files)
			{
				if (!file.type.startsWith('image/'))
				{
					alert('Only image files are allowed.');
					continue;
				}
				const fileSizeMB = file.size / (1024 * 1024);
				if (fileSizeMB > limits.size)
				{
					alert(`Image ${file.name} exceeds the maximum size of ${limits.size}MB.`);
					continue;
				}
				const totalSize = this.getTotalSize();
				const newSize = totalSize + fileSizeMB;
				if (newSize > 20)
				{
					alert(`Adding this image would exceed the 20MB total size limit.`);
					continue;
				}
				const dataUrl = await this.readAsDataURL(file);
				this.images[file.name] = dataUrl;
				this.updateDisplay();
			}
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
		updateDisplay()
		{
			if (!this.options.displayElement) return;
			const container = this.options.displayElement;
			container.innerHTML = '';
			Object.entries(this.images)
				.forEach(([filename, dataURL]) =>
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
					removeBtn.onclick = () =>
					{
						delete this.images[filename];
						this.updateDisplay();
					};
					imgBox.appendChild(img);
					imgBox.appendChild(removeBtn);
					container.appendChild(imgBox);
				});
		}
		getImages()
		{
			return this.images;
		}
		clear()
		{
			this.images = {};
			this.updateDisplay();
		}
	},
	VideoUploader: class
	{
		constructor(el, options = {})
		{
			this.el = el;
			this.options = options;
			this.videos = {};
			this.setupEvents();
		}
		setupEvents()
		{
			this.el.addEventListener('change', (e) =>
			{
				this.handleUpload(Array.from(e.target.files));
				this.el.value = '';
			});
		}
		getTotalSize()
		{
			let size = 0;
			for (const filename in this.videos)
			{
				const dataURL = this.videos[filename];
				const base64 = dataURL.split(',')[1];
				const bytes = (base64.length * (3 / 4));
				size += bytes / (1024 * 1024);
			}
			return size;
		}
		async handleUpload(files)
		{
			const apiModel = this.options.getApiModel?.() || 'google';
			const limits = CONFIG.LIMITS.COMPLETION.VIDEO[apiModel];
			if (files.length + Object.keys(this.videos)
				.length > limits.max)
			{
				alert(`Maximum ${limits.max} videos allowed for ${apiModel}`);
				return;
			}
			for (const file of files)
			{
				if (!file.type.startsWith('video/'))
				{
					alert('Only video files are allowed.');
					continue;
				}
				const fileSizeMB = file.size / (1024 * 1024);
				if (fileSizeMB > limits.size)
				{
					alert(`Video ${file.name} exceeds the maximum size of ${limits.size}MB.`);
					continue;
				}
				const totalSize = this.getTotalSize();
				const newSize = totalSize + fileSizeMB;
				if (newSize > 20)
				{
					alert(`Adding this video would exceed the 20MB total size limit.`);
					continue;
				}
				const dataUrl = await this.readAsDataURL(file);
				this.videos[file.name] = dataUrl;
				this.updateDisplay();
			}
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
		updateDisplay()
		{
			if (!this.options.displayElement) return;
			const container = this.options.displayElement;
			container.innerHTML = '';
			Object.entries(this.videos)
				.forEach(([filename, dataURL]) =>
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
					removeBtn.onclick = () =>
					{
						delete this.videos[filename];
						this.updateDisplay();
					};
					videoBox.appendChild(video);
					videoBox.appendChild(removeBtn);
					container.appendChild(videoBox);
				});
		}
		getVideos()
		{
			return this.videos;
		}
		clear()
		{
			this.videos = {};
			this.updateDisplay();
		}
	}
};
window.UIComponents = UIComponents;