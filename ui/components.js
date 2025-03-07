// ui/components.js
const UIComponents = {
	AudioUploader: class
	{
		constructor(element, options = {})
		{
			this.element = element;
			this.options = options;
			this.uploadedAudios = {};
			this.setupEventListeners();
		}
		setupEventListeners()
		{
			this.element.addEventListener('change', (e) =>
			{
				this.handleAudioUpload(Array.from(e.target.files));
				this.element.value = '';
			});
		}
		getTotalSize()
		{
			let totalSize = 0;
			for (const filename in this.uploadedAudios)
			{
				const dataURL = this.uploadedAudios[filename];
				const byteString = atob(dataURL.split(',')[1]);
				const sizeInBytes = byteString.length;
				totalSize += sizeInBytes / (1024 * 1024);
			}
			return totalSize;
		}
		async handleAudioUpload(files)
		{
			const apiModel = this.options.getApiModel?.() || 'google';
			const limits = CONFIG.LIMITS.COMPLETION.AUDIO[apiModel];
			if (files.length + Object.keys(this.uploadedAudios)
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
				if (apiModel === 'google')
				{
					const currentTotalSize = this.getTotalSize();
					const potentialTotalSize = currentTotalSize + fileSizeMB;
					if (potentialTotalSize > 20)
					{
						alert(`Adding this image would exceed the 20MB total size limit for Gemini requests.`);
						continue;
					}
				}
				try
				{
					const dataUrl = await this.readFileAsDataURL(file);
					this.uploadedAudios[file.name] = dataUrl;
					this.updateAudioDisplay();
				}
				catch (error)
				{
					console.error('Error loading audio:', error);
				}
			}
		}
		readFileAsDataURL(file)
		{
			return new Promise((resolve, reject) =>
			{
				const reader = new FileReader();
				reader.onload = e => resolve(e.target.result);
				reader.onerror = e => reject(e);
				reader.readAsDataURL(file);
			});
		}
		updateAudioDisplay()
		{
			if (!this.options.displayElement) return;
			const container = this.options.displayElement;
			container.innerHTML = '';
			Object.entries(this.uploadedAudios)
				.forEach(([filename, dataURL]) =>
				{
					const audioContainer = document.createElement('div');
					audioContainer.className = 'audio-container';
					const audio = document.createElement('audio');
					audio.src = dataURL;
					audio.controls = false;
					audio.muted = true;
					audio.loop = true;
					audio.pause();
					const removeButton = document.createElement('button');
					removeButton.className = 'btn btn-sm btn-danger remove-audio';
					removeButton.textContent = 'X';
					removeButton.onclick = () =>
					{
						delete this.uploadedAudios[filename];
						this.updateAudioDisplay();
					};
					audioContainer.appendChild(audio);
					audioContainer.appendChild(removeButton);
					container.appendChild(audioContainer);
				});
		}
		getAudios()
		{
			return this.uploadedAudios;
		}
		clear()
		{
			this.uploadedAudios = {};
			this.updateAudioDisplay();
		}
	},
	ImageUploader: class
	{
		constructor(element, options = {})
		{
			this.element = element;
			this.options = options;
			this.uploadedImages = {};
			this.setupEventListeners();
		}
		setupEventListeners()
		{
			this.element.addEventListener('change', (e) =>
			{
				this.handleImageUpload(Array.from(e.target.files));
				this.element.value = '';
			});
		}
		getTotalSize()
		{
			let totalSize = 0;
			for (const filename in this.uploadedImages)
			{
				const dataURL = this.uploadedImages[filename];
				const byteString = atob(dataURL.split(',')[1]);
				const sizeInBytes = byteString.length;
				totalSize += sizeInBytes / (1024 * 1024);
			}
			return totalSize;
		}
		async handleImageUpload(files)
		{
			const apiModel = this.options.getApiModel?.() || 'openai';
			const limits = CONFIG.LIMITS.COMPLETION.IMAGE[apiModel];
			if (files.length + Object.keys(this.uploadedImages)
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
				if (apiModel === 'google')
				{
					const currentTotalSize = this.getTotalSize();
					const potentialTotalSize = currentTotalSize + fileSizeMB;
					if (potentialTotalSize > 20)
					{
						alert(`Adding this image would exceed the 20MB total size limit for Gemini requests.`);
						continue;
					}
				}
				try
				{
					const dataUrl = await this.readFileAsDataURL(file);
					this.uploadedImages[file.name] = dataUrl;
					this.updateImageDisplay();
				}
				catch (error)
				{
					console.error('Error loading image:', error);
				}
			}
		}
		readFileAsDataURL(file)
		{
			return new Promise((resolve, reject) =>
			{
				const reader = new FileReader();
				reader.onload = e => resolve(e.target.result);
				reader.onerror = e => reject(e);
				reader.readAsDataURL(file);
			});
		}
		updateImageDisplay()
		{
			if (!this.options.displayElement) return;
			const container = this.options.displayElement;
			container.innerHTML = '';
			Object.entries(this.uploadedImages)
				.forEach(([filename, dataURL]) =>
				{
					const imageContainer = document.createElement('div');
					imageContainer.className = 'image-container';
					const img = document.createElement('img');
					img.src = dataURL;
					img.alt = filename;
					img.title = filename;
					const removeButton = document.createElement('button');
					removeButton.className = 'btn btn-sm btn-danger remove-image';
					removeButton.textContent = 'X';
					removeButton.onclick = () =>
					{
						delete this.uploadedImages[filename];
						this.updateImageDisplay();
					};
					imageContainer.appendChild(img);
					imageContainer.appendChild(removeButton);
					container.appendChild(imageContainer);
				});
		}
		getImages()
		{
			return this.uploadedImages;
		}
		clear()
		{
			this.uploadedImages = {};
			this.updateImageDisplay();
		}
	},
	VideoUploader: class
	{
		constructor(element, options = {})
		{
			this.element = element;
			this.options = options;
			this.uploadedVideos = {};
			this.setupEventListeners();
		}
		setupEventListeners()
		{
			this.element.addEventListener('change', (e) =>
			{
				this.handleVideoUpload(Array.from(e.target.files));
				this.element.value = '';
			});
		}
		getTotalSize()
		{
			let totalSize = 0;
			for (const filename in this.uploadedVideos)
			{
				const dataURL = this.uploadedVideos[filename];
				const byteString = atob(dataURL.split(',')[1]);
				const sizeInBytes = byteString.length;
				totalSize += sizeInBytes / (1024 * 1024);
			}
			return totalSize;
		}
		async handleVideoUpload(files)
		{
			const apiModel = this.options.getApiModel?.() || 'google';
			const limits = CONFIG.LIMITS.COMPLETION.VIDEO[apiModel];
			if (files.length + Object.keys(this.uploadedVideos)
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
				if (apiModel === 'google')
				{
					const currentTotalSize = this.getTotalSize();
					const potentialTotalSize = currentTotalSize + fileSizeMB;
					if (potentialTotalSize > 20)
					{
						alert(`Adding this video would exceed the 20MB total size limit for Gemini requests.`);
						continue;
					}
				}
				try
				{
					const dataUrl = await this.readFileAsDataURL(file);
					this.uploadedVideos[file.name] = dataUrl;
					this.updateVideoDisplay();
				}
				catch (error)
				{
					console.error('Error loading video:', error);
				}
			}
		}
		readFileAsDataURL(file)
		{
			return new Promise((resolve, reject) =>
			{
				const reader = new FileReader();
				reader.onload = e => resolve(e.target.result);
				reader.onerror = e => reject(e);
				reader.readAsDataURL(file);
			});
		}
		updateVideoDisplay()
		{
			if (!this.options.displayElement) return;
			const container = this.options.displayElement;
			container.innerHTML = '';
			Object.entries(this.uploadedVideos)
				.forEach(([filename, dataURL]) =>
				{
					const videoContainer = document.createElement('div');
					videoContainer.className = 'video-container';
					const video = document.createElement('video');
					video.src = dataURL;
					video.controls = false;
					video.muted = true;
					video.loop = true;
					video.pause();
					const removeButton = document.createElement('button');
					removeButton.className = 'btn btn-sm btn-danger remove-video';
					removeButton.textContent = 'X';
					removeButton.onclick = () =>
					{
						delete this.uploadedVideos[filename];
						this.updateVideoDisplay();
					};
					videoContainer.appendChild(video);
					videoContainer.appendChild(removeButton);
					container.appendChild(videoContainer);
				});
		}
		getVideos()
		{
			return this.uploadedVideos;
		}
		clear()
		{
			this.uploadedVideos = {};
			this.updateVideoDisplay();
		}
	}
};
window.UIComponents = UIComponents;