// ui/components.js
const UIComponents = {
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
		async handleImageUpload(files)
		{
			const apiModel = this.options.getApiModel?.() || 'chatgpt';
			const limits = CONFIG.LIMITS.IMAGE[apiModel];
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
		async handleVideoUpload(files)
		{
			const apiModel = this.options.getApiModel?.() || 'gemini';
			const limits = CONFIG.LIMITS.VIDEO[apiModel];
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