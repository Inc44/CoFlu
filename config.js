// config.js
window.CONFIG = {
	API:
	{
		KEYS:
		{
			chatgpt: 'chatgpt_api_key',
			claude: 'claude_api_key',
			deepseek: 'deepseek_api_key',
			gemini: 'gemini_api_key',
			groq: 'groq_api_key',
			sambanova: 'sambanova_api_key'
		},
		ENDPOINTS:
		{
			chatgpt: 'https://api.openai.com/v1/chat/completions',
			claude: 'https://api.anthropic.com/v1/messages',
			deepseek: 'https://api.deepseek.com/chat/completions',
			gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
			groq: 'https://api.groq.com/openai/v1/chat/completions',
			sambanova: 'https://api.sambanova.ai/v1/chat/completions'
		},
		MODELS:
		{
			chatgpt:
			{
				default: "chatgpt-4o-latest",
				options: [
				{
					name: "chatgpt-4o-latest",
					max_completion_tokens: 16383,
					vision: true
				},
				{
					name: "gpt-4o-2024-11-20",
					max_completion_tokens: 16383,
					vision: true
				},
				{
					name: "gpt-4o-2024-08-06",
					max_completion_tokens: 16383,
					vision: true
				},
				{
					name: "gpt-4o",
					max_completion_tokens: 16383,
					vision: true
				},
				{
					name: "gpt-4o-mini-2024-07-18",
					max_completion_tokens: 16383,
					vision: true
				},
				{
					name: "gpt-4o-mini",
					max_completion_tokens: 16383,
					vision: true
				},
				{
					name: "o3-mini-2025-01-31",
					max_completion_tokens: 200000,
					reasoning_effort: "low",
					vision: false
				},
				{
					name: "o3-mini",
					max_completion_tokens: 200000,
					reasoning_effort: "low",
					vision: false
				}]
			},
			claude:
			{
				default: "claude-3-5-sonnet-20241022",
				options: [
				{
					name: "claude-3-5-sonnet-20241022",
					max_completion_tokens: 8192,
					vision: true
				},
				{
					name: "claude-3-5-haiku-20241022",
					max_completion_tokens: 8192,
					vision: false
				}]
			},
			deepseek:
			{
				default: "deepseek-chat",
				options: [
				{
					name: "deepseek-chat",
					max_completion_tokens: 8192,
					vision: false
				},
				{
					name: "deepseek-reasoner",
					max_completion_tokens: 8192,
					vision: false
				}]
			},
			gemini:
			{
				default: "gemini-exp-1206",
				options: [
				{
					name: "gemini-exp-1206",
					max_completion_tokens: 8192,
					vision: true
				},
				{
					name: "gemini-2.0-flash-thinking-exp-01-21",
					max_completion_tokens: 65536,
					vision: true
				},
				{
					name: "gemini-2.0-flash-exp",
					max_completion_tokens: 8192,
					vision: true
				}]
			},
			groq:
			{
				default: "llama-3.2-90b-vision-preview",
				options: [
				{
					name: "llama-3.2-90b-vision-preview",
					max_completion_tokens: 8192,
					vision: true
				},
				{
					name: "llama-3.2-11b-vision-preview",
					max_completion_tokens: 8192,
					vision: true
				},
				{
					name: "llama-3.3-70b-versatile",
					max_completion_tokens: 32768,
					vision: false
				},
				{
					name: "deepseek-r1-distill-llama-70b",
					max_completion_tokens: 131072,
					vision: false
				}]
			},
			sambanova:
			{
				default: "Llama-3.2-90B-Vision-Instruct",
				options: [
				{
					name: "Llama-3.2-90B-Vision-Instruct",
					max_completion_tokens: 4096,
					vision: true
				},
				{
					name: "Llama-3.2-11B-Vision-Instruct",
					max_completion_tokens: 4096,
					vision: true
				},
				{
					name: "Meta-Llama-3.3-70B-Instruct",
					max_completion_tokens: 4096,
					vision: false
				},
				{
					name: "Meta-Llama-3.1-70B-Instruct",
					max_completion_tokens: 16384,
					vision: false
				},
				{
					name: "Meta-Llama-3.1-405B-Instruct",
					max_completion_tokens: 16384,
					vision: false
				}]
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
			deepseek:
			{
				url: 'https://api.deepseek.com/chat/completions',
				model: "deepseek-chat",
				apiKeyHeader: 'Authorization',
				apiKeyPrefix: 'Bearer ',
				extractContent: data => data.choices[0]?.message?.content,
				extractStreamContent: data => data.choices[0]?.delta?.content
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
			},
			sambanova:
			{
				url: 'https://api.sambanova.ai/v1/chat/completions',
				model: "Llama-3.2-90B-Vision-Instruct",
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
			deepseek:
			{
				max: 0,
				size: 0
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
			},
			sambanova:
			{
				max: 1,
				size: 20
			}
		},
		VIDEO:
		{
			chatgpt:
			{
				max: 0,
				size: 0
			},
			claude:
			{
				max: 0,
				size: 0
			},
			deepseek:
			{
				max: 0,
				size: 0
			},
			gemini:
			{
				max: 1,
				size: 15
			},
			groq:
			{
				max: 0,
				size: 0
			},
			sambanova:
			{
				max: 0,
				size: 0
			}
		}
	},
	UI:
	{
		API_KEY_LABELS:
		{
			chatgpt: 'OpenAI API Key:',
			claude: 'Anthropic API Key:',
			deepseek: 'DeepSeek API Key:',
			gemini: 'Google API Key:',
			groq: 'Groq API Key:',
			sambanova: 'SambaNova API Key:'
		},
		STANDARD_PROMPTS: ["Proofread this text but only fix grammar", "Proofread this text but only fix grammar and Markdown style", "Proofread this text improving clarity and flow", "Proofread this text fixing only awkward parts", "Proofread this text", "Markdown OCR"]
	},
	VALIDATION:
	{
		API_KEY_PATTERNS:
		{
			chatgpt: /^sk-[A-Za-z0-9]{32,}$/,
			claude: /^sk-ant-[A-Za-z0-9]{32,}$/,
			deepseek: /^sk-[A-Za-z0-9]{32,}$/,
			gemini: /^AI[A-Za-z0-9-_]{32,}$/,
			groq: /^gsk_[A-Za-z0-9]{32,}$/,
			sambanova: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
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