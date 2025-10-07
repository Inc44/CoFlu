const StorageService = {
	save(key, value)
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
	},
	load(key, defValue = null)
	{
		const value = localStorage.getItem(key);
		if (value === null) return defValue;
		if (value === 'true') return true;
		if (value === 'false') return false;
		if (typeof defValue === 'object' && defValue !== null && (value.startsWith('{') || value.startsWith('[')))
		{
			try
			{
				return JSON.parse(value);
			}
			catch (e)
			{
				return value;
			}
		}
		return value;
	},
	remove(key)
	{
		localStorage.removeItem(key);
		return true;
	}
};
window.StorageService = StorageService;