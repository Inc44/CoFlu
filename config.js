// config.js
window.CONFIG = {
	API:
	{
		KEYS:
		{
			chatgpt: 'chatgpt_api_key',
			claude: 'claude_api_key',
			gemini: 'gemini_api_key',
			groq: 'groq_api_key'
		},
		ENDPOINTS:
		{
			chatgpt: 'https://api.openai.com/v1/chat/completions',
			claude: 'https://api.anthropic.com/v1/messages',
			gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
			groq: 'https://api.groq.com/openai/v1/chat/completions'
		},
		MODELS:
		{
			chatgpt:
			{
				default: "chatgpt-4o-latest",
				options: ["chatgpt-4o-latest", "gpt-4o-2024-11-20", "gpt-4o-2024-08-06", "gpt-4o", "gpt-4o-mini-2024-07-18", "gpt-4o-mini"]
			},
			claude:
			{
				default: "claude-3-5-sonnet-20241022",
				options: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"]
			},
			gemini:
			{
				default: "gemini-exp-1206",
				options: ["gemini-exp-1206", "gemini-2.0-flash-thinking-exp-1219", "gemini-2.0-flash-exp"]
			},
			groq:
			{
				default: "llama-3.2-90b-vision-preview",
				options: ["llama-3.2-90b-vision-preview", "llama-3.2-11b-vision-preview"]
			}
		},
		CONFIG:
		{
			chatgpt:
			{
				url: 'https://api.openai.com/v1/chat/completions',
				model: "chatgpt-4o-latest",
				apiKeyHeader: 'Authorization',
				apiKeyPrefix: 'Bearer ',
				extractContent: data => data.choices[0]?.message?.content,
				extractStreamContent: data => data.choices[0]?.delta?.content
			},
			claude:
			{
				url: 'https://api.anthropic.com/v1/messages',
				model: "claude-3-5-sonnet-20241022",
				apiKeyHeader: 'x-api-key',
				apiKeyPrefix: '',
				additionalHeaders:
				{
					'anthropic-version': '2023-06-01',
					'content-type': 'application/json',
					'anthropic-dangerous-direct-browser-access': 'true'
				},
				extractContent: data => data.content[0]?.text,
				extractStreamContent: data => data.delta?.text
			},
			gemini:
			{
				model: "gemini-exp-1206",
				extractContent: data => data.response.text() || data.response.candidates[0]?.output,
				extractStreamContent: chunk => chunk.text()
			},
			groq:
			{
				url: 'https://api.groq.com/openai/v1/chat/completions',
				model: "llama-3.2-90b-vision-preview",
				apiKeyHeader: 'Authorization',
				apiKeyPrefix: 'Bearer ',
				extractContent: data => data.choices[0]?.message?.content,
				extractStreamContent: data => data.choices[0]?.delta?.content
			}
		}
	},
	LIMITS:
	{
		IMAGE:
		{
			chatgpt:
			{
				max: 100,
				size: 20
			},
			claude:
			{
				max: 100,
				size: 5
			},
			gemini:
			{
				max: 100,
				size: 20
			},
			groq:
			{
				max: 1,
				size: 3
			}
		}
	},
	UI:
	{
		API_KEY_LABELS:
		{
			chatgpt: 'OpenAI API Key:',
			claude: 'Anthropic API Key:',
			gemini: 'Google API Key:',
			groq: 'Groq API Key:'
		},
		STANDARD_PROMPTS: ["Proofread this text but only fix grammar", "Proofread this text but only fix grammar and Markdown style", "Proofread this text improving clarity and flow", "Proofread this text, fixing only awkward parts", "Proofread this text", "Markdown OCR"]
	},
	VALIDATION:
	{
		API_KEY_PATTERNS:
		{
			chatgpt: /^sk-[A-Za-z0-9]{32,}$/,
			claude: /^sk-ant-[A-Za-z0-9]{32,}$/,
			gemini: /^AI[A-Za-z0-9-_]{32,}$/,
			groq: /^gsk_[A-Za-z0-9]{32,}$/
		}
	}
};
window.MathJax = {
	tex:
	{
		inlineMath: [
			['$', '$'],
			['\\(', '\\)']
		],
		displayMath: [
			['$$', '$$'],
			['\\[', '\\]']
		]
	}
};