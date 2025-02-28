// config.js
window.CONFIG = {
	API:
	{
		KEYS:
		{
			openai: 'openai_api_key',
			anthropic: 'anthropic_api_key',
			deepseek: 'deepseek_api_key',
			google: 'google_api_key',
			x: 'x_api_key',
			groq: 'groq_api_key',
			alibaba: 'alibaba_api_key',
			sambanova: 'sambanova_api_key',
		},
		MODELS:
		{
			COMPLETION:
			{
				openai:
				{
					default: "chatgpt-4o-latest",
					options: [
					{
						name: "o3-mini",
						max_completion_tokens: 200000,
						reasoning_effort: "low",
						image: false
					},
					{
						name: "o1-mini",
						max_completion_tokens: 128000,
						image: false
					},
					{
						name: "o1-mini-2024-09-12",
						max_completion_tokens: 128000,
						image: false
					},
					{
						name: "o3-mini-2025-01-31",
						max_completion_tokens: 200000,
						reasoning_effort: "low",
						image: false
					},
					{
						name: "gpt-4o",
						max_completion_tokens: 16383,
						image: true
					},
					{
						name: "gpt-4o-mini",
						max_completion_tokens: 16383,
						image: true
					},
					{
						name: "gpt-4o-mini-2024-07-18",
						max_completion_tokens: 16383,
						image: true
					},
					{
						name: "gpt-4o-2024-11-20",
						max_completion_tokens: 16383,
						image: true
					},
					{
						name: "gpt-4o-2024-08-06",
						max_completion_tokens: 16383,
						image: true
					},
					{
						name: "gpt-4-1106-preview",
						max_completion_tokens: 4095,
						image: true
					},
					{
						name: "chatgpt-4o-latest",
						max_completion_tokens: 16383,
						image: true
					}]
				},
				anthropic:
				{
					default: "claude-3-7-sonnet-20250219",
					options: [
					{
						name: "claude-3-7-sonnet-20250219",
						max_completion_tokens: 128000,
						thinking: true,
						image: true
					},
					{
						name: "claude-3-5-sonnet-20241022",
						max_completion_tokens: 8192,
						image: true
					},
					{
						name: "claude-3-5-haiku-20241022",
						max_completion_tokens: 8192,
						image: true
					}]
				},
				deepseek:
				{
					default: "deepseek-chat",
					options: [
					{
						name: "deepseek-chat",
						max_completion_tokens: 8192,
						image: false
					},
					{
						name: "deepseek-reasoner",
						max_completion_tokens: 8192,
						image: false
					}]
				},
				google:
				{
					default: "gemini-2.0-pro-exp-02-05",
					options: [
					{
						name: "gemini-exp-1206",
						max_completion_tokens: 8192,
						image: true,
						video: true
					},
					{
						name: "gemini-2.0-flash-001",
						max_completion_tokens: 8192,
						image: true,
						video: true
					},
					{
						name: "gemini-2.0-flash-lite-preview-02-05",
						max_completion_tokens: 8192,
						image: true
					},
					{
						name: "gemini-2.0-pro-exp-02-05",
						max_completion_tokens: 8192,
						image: true
					},
					{
						name: "gemini-2.0-flash-thinking-exp-01-21",
						max_completion_tokens: 65536,
						image: true
					},
					{
						name: "gemini-2.0-flash-exp",
						max_completion_tokens: 8192,
						image: true,
						video: true
					}]
				},
				x:
				{
					default: "grok-2-1212",
					options: [
					{
						name: "grok-2-1212",
						max_completion_tokens: 131072,
						image: false
					},
					{
						name: "grok-2-vision-1212",
						max_completion_tokens: 32768,
						image: true
					},
					{
						name: "grok-3",
						max_completion_tokens: 131072,
						image: false
					},
					{
						name: "grok-beta",
						max_completion_tokens: 131072,
						image: false
					},
					{
						name: "grok-vision-beta",
						max_completion_tokens: 8192,
						image: true
					}]
				},
				groq:
				{
					default: "llama-3.2-90b-vision-preview",
					options: [
					{
						name: "qwen-2.5-32b",
						max_completion_tokens: 131072,
						image: false
					},
					{
						name: "qwen-2.5-coder-32b",
						max_completion_tokens: 131072,
						image: false
					},
					{
						name: "deepseek-r1-distill-qwen-32b",
						max_completion_tokens: 131072,
						image: false
					},
					{
						name: "deepseek-r1-distill-llama-70b",
						max_completion_tokens: 131072,
						image: false
					},
					{
						name: "llama-3.1-8b-instant",
						max_completion_tokens: 8000,
						image: false
					},
					{
						name: "llama-3.2-11b-vision-preview",
						max_completion_tokens: 8192,
						image: true
					},
					{
						name: "llama-3.2-1b-preview",
						max_completion_tokens: 8192,
						image: false
					},
					{
						name: "llama-3.2-3b-preview",
						max_completion_tokens: 8192,
						image: false
					},
					{
						name: "llama-3.2-90b-vision-preview",
						max_completion_tokens: 8192,
						image: true
					},
					{
						name: "llama-3.3-70b-specdec",
						max_completion_tokens: 8192,
						image: false
					},
					{
						name: "llama-3.3-70b-versatile",
						max_completion_tokens: 32768,
						image: false
					},
					{
						name: "mixtral-8x7b-32768",
						max_completion_tokens: 32768,
						image: false
					}]
				},
				alibaba:
				{
					default: "qwen-max",
					options: [
					{
						name: "qwen-max",
						max_completion_tokens: 8192,
						image: false
					},
					{
						name: "qwen-plus",
						max_completion_tokens: 8192,
						image: false
					},
					{
						name: "qwen-turbo",
						max_completion_tokens: 8192,
						image: false
					},
					{
						name: "qwen-vl-max",
						max_completion_tokens: 2048,
						image: true
					},
					{
						name: "qwen-vl-plus",
						max_completion_tokens: 2048,
						image: true
					},
					{
						name: "qwen2.5-vl-72b-instruct",
						max_completion_tokens: 8192,
						image: true
					},
					{
						name: "qwen2.5-vl-7b-instruct",
						max_completion_tokens: 8192,
						image: true
					},
					{
						name: "qwen2.5-vl-3b-instruct",
						max_completion_tokens: 8192,
						image: true
					},
					{
						name: "qwen2.5-7b-instruct-1m",
						max_completion_tokens: 8192,
						image: false
					}]
				},
				sambanova:
				{
					default: "Llama-3.2-90B-Vision-Instruct",
					options: [
					{
						name: "DeepSeek-R1",
						max_completion_tokens: 4096,
						image: false
					},
					{
						name: "DeepSeek-R1-Distill-Llama-70B",
						max_completion_tokens: 32768,
						image: false
					},
					{
						name: "Llama-3.1-Tulu-3-405B",
						max_completion_tokens: 16384,
						image: false
					},
					{
						name: "Meta-Llama-3.1-405B-Instruct",
						max_completion_tokens: 16384,
						image: false
					},
					{
						name: "Meta-Llama-3.1-70B-Instruct",
						max_completion_tokens: 131072,
						image: false
					},
					{
						name: "Meta-Llama-3.1-8B-Instruct",
						max_completion_tokens: 16384,
						image: false
					},
					{
						name: "Meta-Llama-3.3-70B-Instruct",
						max_completion_tokens: 4096,
						image: false
					},
					{
						name: "Qwen2.5-72B-Instruct",
						max_completion_tokens: 16384,
						image: false
					},
					{
						name: "Qwen2.5-Coder-32B-Instruct",
						max_completion_tokens: 16384,
						image: false
					},
					{
						name: "QwQ-32B-Preview",
						max_completion_tokens: 16384,
						image: false
					},
					{
						name: "Meta-Llama-3.2-1B-Instruct",
						max_completion_tokens: 16384,
						image: true
					},
					{
						name: "Meta-Llama-3.2-3B-Instruct",
						max_completion_tokens: 8192,
						image: true
					},
					{
						name: "Llama-3.2-11B-Vision-Instruct",
						max_completion_tokens: 4096,
						image: true
					},
					{
						name: "Llama-3.2-90B-Vision-Instruct",
						max_completion_tokens: 4096,
						image: true
					}]
				}
			},
			TRANSCRIPTION:
			{
				groq:
				{
					default: "whisper-large-v3",
					options: [
					{
						name: "whisper-large-v3"
					},
					{
						name: "whisper-large-v3-turbo"
					}],
				},
				openai:
				{
					default: "whisper-1",
					options: [
					{
						name: "whisper-1"
					}],
				},
			}
		},
		CONFIG:
		{
			COMPLETION:
			{
				openai:
				{
					url: 'https://api.openai.com/v1/chat/completions',
					model: "chatgpt-4o-latest",
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				anthropic:
				{
					url: 'https://api.anthropic.com/v1/messages',
					model: "claude-3-7-sonnet-20250219",
					apiKeyHeader: 'x-api-key',
					apiKeyPrefix: '',
					additionalHeaders:
					{
						'anthropic-version': '2023-06-01',
						'anthropic-beta': 'output-128k-2025-02-19',
						'content-type': 'application/json',
						'anthropic-dangerous-direct-browser-access': 'true'
					},
					extractContent: data =>
					{
						const textParts = [];
						for (const item of data.content)
						{
							switch (item?.type)
							{
								case 'text':
									if (item.text)
									{
										textParts.push(item.text);
									}
									break;
								case 'thinking':
									if (item.thinking)
									{
										textParts.push(item.thinking + "\n");
									}
									break;
							}
						}
						return textParts.join('\n')
							.trim();
					},
					extractStreamContent: data =>
					{
						const delta = data?.delta;
						switch (delta.type)
						{
							case 'text_delta':
								return delta.text;
							case 'thinking_delta':
								return delta.thinking;
							case 'signature_delta':
								return "\n\n";
						}
					}
				},
				deepseek:
				{
					url: 'https://api.deepseek.com/chat/completions',
					model: "deepseek-chat",
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data =>
					{
						const message = data.choices[0].message;
						const textParts = [];
						if (message.reasoning_content)
						{
							textParts.push(message.reasoning_content + "\n");
						}
						if (message.content)
						{
							textParts.push(message.content);
						}
						return textParts.join('\n')
							.trim();
					},
					extractStreamContent: data => data.choices[0]?.delta?.reasoning_content || data.choices[0]?.delta?.content,
				},
				google:
				{
					model: "gemini-2.0-pro-exp-02-05",
					extractContent: data => data.candidates[0]?.content?.parts[0]?.text,
					extractStreamContent: data => data.candidates[0]?.content?.parts[0]?.text,
				},
				x:
				{
					url: 'https://api.x.ai/v1/chat/completions',
					model: "grok-2-1212",
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
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
				alibaba:
				{
					url: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
					model: "qwen-max",
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
			},
			TRANSCRIPTION:
			{
				groq:
				{
					url: 'https://api.groq.com/openai/v1/audio/transcriptions',
					model: "whisper-large-v3",
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer '
				},
				openai:
				{
					url: 'https://api.openai.com/v1/audio/transcriptions',
					model: "whisper-1",
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer '
				}
			}
		}
	},
	LIMITS:
	{
		COMPLETION:
		{
			IMAGE:
			{
				openai:
				{
					max: 100,
					size: 20
				},
				anthropic:
				{
					max: 100,
					size: 5
				},
				deepseek:
				{
					max: 0,
					size: 0
				},
				google:
				{
					max: 100,
					size: 20
				},
				x:
				{
					max: 100,
					size: 10
				},
				groq:
				{
					max: 1,
					size: 3
				},
				alibaba:
				{
					max: 10,
					size: 10
				},
				sambanova:
				{
					max: 1,
					size: 20
				}
			},
			VIDEO:
			{
				openai:
				{
					max: 0,
					size: 0
				},
				anthropic:
				{
					max: 0,
					size: 0
				},
				deepseek:
				{
					max: 0,
					size: 0
				},
				google:
				{
					max: 10,
					size: 15
				},
				x:
				{
					max: 0,
					size: 0
				},
				groq:
				{
					max: 0,
					size: 0
				},
				alibaba:
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
		TRANSCRIPTION:
		{
			AUDIO:
			{
				groq:
				{
					max: 1,
					size: 25
				},
				openai:
				{
					max: 1,
					size: 25
				},
			}
		}
	},
	UI:
	{
		API_KEY_LABELS:
		{
			openai: 'OpenAI API Key:',
			anthropic: 'Anthropic API Key:',
			deepseek: 'DeepSeek API Key:',
			google: 'Google API Key:',
			x: 'X API Key:',
			groq: 'Groq API Key:',
			alibaba: 'Alibaba API Key:',
			sambanova: 'SambaNova API Key:'
		},
		NO_BS_PROMPT: "Provide the result ONLY, without any introductory phrases or additional commentary",
		STANDARD_PROMPTS: ["Proofread this text but only fix grammar", "Proofread this text but only fix grammar and Markdown style", "Proofread this text improving clarity and flow", "Proofread this text fixing only awkward parts", "Proofread this text", "Markdown OCR"],
		TRANSLATION_PROMPT: "Translate the following text to"
	},
	VALIDATION:
	{
		API_KEY_PATTERNS:
		{
			openai: /^sk-[A-Za-z0-9]{32,}$/,
			anthropic: /^sk-ant-[A-Za-z0-9]{32,}$/,
			deepseek: /^sk-[A-Za-z0-9]{32,}$/,
			google: /^AI[A-Za-z0-9-_]{32,}$/,
			x: /^xai-[A-Za-z0-9]{32,}$/,
			groq: /^gsk_[A-Za-z0-9]{32,}$/,
			alibaba: /^sk-[A-Za-z0-9]{32,}$/,
			sambanova: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
		}
	}
};
window.MathJax = {
	tex:
	{
		inlineMath: [
			['$', '$'],
			['\(', '\)']
		],
		displayMath: [
			['$$', '$$'],
			['\[', '\]']
		]
	}
};