// services/storage.service.js
const StorageService = {
	save(key, value)
	{
		try
		{
			if (typeof value === 'object')
			{
				localStorage.setItem(key, JSON.stringify(value));
			}
			else
			{
				localStorage.setItem(key, value);
			}
			return true;
		}
		catch (error)
		{
			console.error('Error saving to localStorage:', error);
			return false;
		}
	},
	load(key, defaultValue = null)
	{
		try
		{
			const value = localStorage.getItem(key);
			if (value === null) return defaultValue;
			try
			{
				return JSON.parse(value);
			}
			catch
			{
				return value;
			}
		}
		catch (error)
		{
			console.error('Error loading from localStorage:', error);
			return defaultValue;
		}
	},
	remove(key)
	{
		try
		{
			localStorage.removeItem(key);
			return true;
		}
		catch (error)
		{
			console.error('Error removing from localStorage:', error);
			return false;
		}
	}
};
window.StorageService = StorageService;