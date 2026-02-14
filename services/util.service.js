const UtilService = {
	getDetails(provider)
	{
		const customModel = StorageService.load(`${provider}_custom_model`, '');
		if (customModel)
		{
			return {
				name: customModel,
				custom_model: true
			};
		}
		const modelName = StorageService.load(`${provider}_model`, CONFIG.API.MODELS.COMPLETION[provider]?.default);
		let details = CONFIG.API.MODELS.COMPLETION[provider]?.options.find(option => option.name === modelName);
		if (!details && StorageService.load('high_cost_enabled', false) && CONFIG.API.MODELS.COMPLETION_HIGH_COST[provider])
		{
			details = CONFIG.API.MODELS.COMPLETION_HIGH_COST[provider].options.find(option => option.name === modelName);
		}
		return details || null;
	}
};
window.UtilService = UtilService;