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
	}
};
window.UIComponents = UIComponents;