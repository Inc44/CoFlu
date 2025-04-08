// config.js
window.CONFIG = {
	API:
	{
		KEYS:
		{
			cerebras: 'cerebras_api_key',
			openai: 'openai_api_key',
			chutes: 'chutes_api_key',
			anthropic: 'anthropic_api_key',
			deepinfra: 'deepinfra_api_key',
			deepseek: 'deepseek_api_key',
			google: 'google_api_key',
			x: 'x_api_key',
			groq: 'groq_api_key',
			hyperbolic: 'hyperbolic_api_key',
			lambda: 'lambda_api_key',
			minimax: 'minimax_api_key',
			ollama: 'ollama_api_key',
			openrouter: 'openrouter_api_key',
			perplexity: 'perplexity_api_key',
			alibaba: 'alibaba_api_key',
			sambanova: 'sambanova_api_key',
			together: 'together_api_key'
		},
		MODELS:
		{
			COMPLETION:
			{
				cerebras:
				{
					default: "llama-3.3-70b",
					options: [
					{
						name: "llama3.1-8b",
						max_tokens: 8192,
						image: false
					},
					{
						name: "llama-3.3-70b",
						max_tokens: 8192,
						image: false
					},
					{
						name: "deepseek-r1-distill-llama-70b",
						max_tokens: 8192,
						image: false
					}]
				},
				openai:
				{
					default: "o3-mini",
					options: [
					{
						name: "o3-mini",
						max_tokens: 100000,
						reasoning_effort: "low",
						image: false
					},
					{
						name: "o1-mini",
						max_tokens: 65536,
						image: false
					},
					{
						name: "o1-mini-2024-09-12",
						max_tokens: 65536,
						image: false
					},
					{
						name: "o3-mini-2025-01-31",
						max_tokens: 100000,
						reasoning_effort: "low",
						image: false
					},
					{
						name: "gpt-4o",
						max_tokens: 16383,
						image: true
					},
					{
						name: "gpt-4o-mini",
						max_tokens: 16383,
						image: true
					},
					{
						name: "gpt-4o-audio-preview",
						max_tokens: 2048,
						audio: true,
						image: false,
						modality: "audio"
					},
					{
						name: "gpt-4o-mini-audio-preview-2024-12-17",
						max_tokens: 2048,
						audio: true,
						image: true,
						modality: "audio"
					},
					{
						name: "gpt-4o-mini-audio-preview",
						max_tokens: 2048,
						audio: true,
						image: true,
						modality: "audio"
					},
					{
						name: "gpt-4o-mini-2024-07-18",
						max_tokens: 16383,
						image: true
					},
					{
						name: "gpt-4o-audio-preview-2024-12-17",
						max_tokens: 2048,
						audio: true,
						image: false,
						modality: "audio"
					},
					{
						name: "gpt-4o-audio-preview-2024-10-01",
						max_tokens: 2048,
						audio: true,
						image: false,
						modality: "audio"
					},
					{
						name: "gpt-4o-2024-11-20",
						max_tokens: 16383,
						image: true
					},
					{
						name: "gpt-4o-2024-08-06",
						max_tokens: 16383,
						image: true
					},
					{
						name: "gpt-3.5-turbo-16k",
						max_tokens: 16385,
						image: false
					},
					{
						name: "gpt-3.5-turbo-1106",
						max_tokens: 4096,
						image: false
					},
					{
						name: "gpt-3.5-turbo-1106",
						max_tokens: 4096,
						image: false
					},
					{
						name: "gpt-3.5-turbo",
						max_tokens: 4096,
						image: false
					}]
				},
				chutes:
				{
					default: "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1",
					options: [
					{
						name: "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1",
						max_tokens: 131072,
						image: false
					}]
				},
				anthropic:
				{
					default: "claude-3-5-haiku-20241022",
					options: [
					{
						name: "claude-3-5-haiku-20241022",
						max_tokens: 8192,
						image: true
					}]
				},
				deepinfra:
				{
					default: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
					options: [
					{
						name: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
						max_tokens: 1048576,
						image: true
					},
					{
						name: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
						max_tokens: 327680,
						image: true
					}],
				},
				deepseek:
				{
					default: "deepseek-chat",
					options: [
					{
						name: "deepseek-chat",
						max_tokens: 8192,
						image: false
					},
					{
						name: "deepseek-reasoner",
						max_tokens: 8192,
						image: false
					}]
				},
				google:
				{
					default: "gemini-2.5-pro-preview-03-25",
					options: [
					{
						name: "gemini-exp-1206",
						max_tokens: 8192,
						audio: true,
						image: true,
						video: true
					},
					{
						name: "gemini-2.5-pro-preview-03-25",
						max_tokens: 65536,
						audio: true,
						image: true,
						video: true,
						search: true
					},
					{
						name: "gemini-2.5-pro-exp-03-25",
						max_tokens: 65536,
						audio: true,
						image: true,
						video: true,
						search: true
					},
					{
						name: "gemini-2.0-flash-001",
						max_tokens: 8192,
						audio: true,
						image: true,
						video: true,
						search: true
					},
					{
						name: "gemini-2.0-flash-exp-image-generation",
						max_tokens: 8192,
						audio: true,
						image: true,
						video: true,
						modality: "image"
					},
					{
						name: "gemini-2.0-flash-lite-001",
						max_tokens: 8192,
						audio: true,
						image: true
					},
					{
						name: "gemini-2.0-pro-exp-02-05",
						max_tokens: 8192,
						audio: true,
						image: true
					},
					{
						name: "gemini-2.0-flash-thinking-exp-01-21",
						max_tokens: 65536,
						audio: true,
						image: true
					},
					{
						name: "gemini-2.0-flash-exp",
						max_tokens: 8192,
						audio: true,
						image: true,
						video: true
					},
					{
						name: "gemma-3-1b-it",
						max_tokens: 8192,
						image: false
					},
					{
						name: "gemma-3-4b-it",
						max_tokens: 8192,
						image: true
					},
					{
						name: "gemma-3-12b-it",
						max_tokens: 8192,
						image: true
					},
					{
						name: "gemma-3-27b-it",
						max_tokens: 8192,
						image: true
					},
					{
						name: "gemma-2-2b-it",
						max_tokens: 8192,
						image: false
					},
					{
						name: "gemma-2-9b-it",
						max_tokens: 8192,
						image: false
					},
					{
						name: "gemma-2-27b-it",
						max_tokens: 8192,
						image: false
					}]
				},
				x:
				{
					default: "grok-2-1212",
					options: [
					{
						name: "grok-2-1212",
						max_tokens: 131072,
						image: false
					},
					{
						name: "grok-2-vision-1212",
						max_tokens: 32768,
						image: true
					},
					{
						name: "grok-3",
						max_tokens: 131072,
						image: false
					},
					{
						name: "grok-beta",
						max_tokens: 131072,
						image: false
					},
					{
						name: "grok-vision-beta",
						max_tokens: 8192,
						image: true
					}]
				},
				groq:
				{
					default: "meta-llama/llama-4-scout-17b-16e-instruct",
					options: [
					{
						name: "qwen-2.5-32b",
						max_tokens: 131072,
						image: false
					},
					{
						name: "qwen-2.5-coder-32b",
						max_tokens: 131072,
						image: false
					},
					{
						name: "deepseek-r1-distill-qwen-32b",
						max_tokens: 131072,
						image: false
					},
					{
						name: "deepseek-r1-distill-llama-70b",
						max_tokens: 131072,
						image: false
					},
					{
						name: "llama-3.1-8b-instant",
						max_tokens: 8000,
						image: false
					},
					{
						name: "llama-3.2-11b-vision-preview",
						max_tokens: 8192,
						image: true
					},
					{
						name: "llama-3.2-1b-preview",
						max_tokens: 8192,
						image: false
					},
					{
						name: "llama-3.2-3b-preview",
						max_tokens: 8192,
						image: false
					},
					{
						name: "llama-3.2-90b-vision-preview",
						max_tokens: 8192,
						image: true
					},
					{
						name: "llama-3.3-70b-specdec",
						max_tokens: 8192,
						image: false
					},
					{
						name: "llama-3.3-70b-versatile",
						max_tokens: 32768,
						image: false
					},
					{
						name: "meta-llama/llama-4-scout-17b-16e-instruct",
						max_tokens: 8192,
						image: true
					},
					{
						name: "meta-llama/llama-4-maverick-17b-128e-instruct",
						max_tokens: 8192,
						image: true
					},
					{
						name: "mixtral-8x7b-32768",
						max_tokens: 32768,
						image: false
					}]
				},
				hyperbolic:
				{
					default: "",
					options: [
					{
						name: ""
					}],
				},
				lambda:
				{
					default: "hermes3-405b",
					options: [
					{
						name: "hermes3-405b",
						max_tokens: 131072,
						image: false
					}]
				},
				minimax:
				{
					default: "",
					options: [
					{
						name: ""
					}],
				},
				ollama:
				{
					default: "",
					options: [
					{
						name: ""
					}],
				},
				openrouter:
				{
					default: "openrouter/quasar-alpha",
					options: [
					{
						name: "cognitivecomputations/dolphin3.0-mistral-24b:free",
						max_tokens: 32768,
						image: false
					},
					{
						name: "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
						max_tokens: 32768,
						image: false
					},
					{
						name: "deepseek/deepseek-r1-distill-llama-8b",
						max_tokens: 32000,
						image: false
					},
					{
						name: "google/gemma-3-1b-it:free",
						max_tokens: 32000,
						image: false
					},
					{
						name: "google/gemma-3-4b-it:free",
						max_tokens: 131072,
						image: true
					},
					{
						name: "google/gemma-3-12b-it:free",
						max_tokens: 131072,
						image: true
					},
					{
						name: "microsoft/phi-4",
						max_tokens: 16384,
						image: false
					},
					{
						name: "microsoft/phi-4-multimodal-instruct",
						max_tokens: 128000,
						image: true
					},
					{
						name: "minimax/minimax-01",
						max_tokens: 1000192,
						image: true
					},
					{
						name: "mistralai/codestral-2501",
						max_tokens: 256000,
						image: false
					},
					{
						name: "mistralai/mistral-large-2411",
						max_tokens: 128000,
						image: false
					},
					{
						name: "mistralai/pixtral-large-2411",
						max_tokens: 128000,
						image: true
					},
					{
						name: "openai/gpt-4o:extended",
						max_tokens: 128000,
						image: false
					},
					{
						name: "openrouter/quasar-alpha",
						max_tokens: 1000000,
						image: true
					}]
				},
				perplexity:
				{
					default: "sonar",
					options: [
					{
						name: "sonar-deep-research",
						max_tokens: 200000,
						image: true
					},
					{
						name: "sonar-reasoning-pro",
						max_tokens: 128000,
						image: true
					},
					{
						name: "sonar-reasoning",
						max_tokens: 127000,
						image: true
					},
					{
						name: "sonar",
						max_tokens: 127000,
						image: true
					},
					{
						name: "r1-1776",
						max_tokens: 128000,
						image: true
					}]
				},
				alibaba:
				{
					default: "qwen-max",
					options: [
					{
						name: "qwen-max",
						max_tokens: 8192,
						image: false
					},
					{
						name: "qwen-plus",
						max_tokens: 8192,
						image: false
					},
					{
						name: "qwen-turbo",
						max_tokens: 8192,
						image: false
					},
					{
						name: "qwen-vl-max",
						max_tokens: 2048,
						image: true
					},
					{
						name: "qwen-vl-plus",
						max_tokens: 2048,
						image: true
					},
					{
						name: "qwen2.5-vl-72b-instruct",
						max_tokens: 8192,
						image: true
					},
					{
						name: "qwen2.5-vl-7b-instruct",
						max_tokens: 8192,
						image: true
					},
					{
						name: "qwen2.5-vl-3b-instruct",
						max_tokens: 8192,
						image: true
					},
					{
						name: "qwen2.5-7b-instruct-1m",
						max_tokens: 8192,
						image: false
					}]
				},
				sambanova:
				{
					default: "Llama-3.2-90B-Vision-Instruct",
					options: [
					{
						name: "DeepSeek-R1",
						max_tokens: 16384,
						image: false
					},
					{
						name: "DeepSeek-R1-Distill-Llama-70B",
						max_tokens: 131072,
						image: false
					},
					{
						name: "QwQ-32B",
						max_tokens: 16384,
						image: false
					},
					{
						name: "DeepSeek-V3-0324",
						max_tokens: 8192,
						image: false
					},
					{
						name: "Llama-3.1-Tulu-3-405B",
						max_tokens: 16384,
						image: false
					},
					{
						name: "Meta-Llama-3.1-405B-Instruct",
						max_tokens: 16384,
						image: false
					},
					{
						name: "Meta-Llama-3.1-70B-Instruct",
						max_tokens: 131072,
						image: false
					},
					{
						name: "Meta-Llama-3.1-8B-Instruct",
						max_tokens: 16384,
						image: false
					},
					{
						name: "Meta-Llama-3.3-70B-Instruct",
						max_tokens: 131072,
						image: false
					},
					{
						name: "Qwen2.5-72B-Instruct",
						max_tokens: 16384,
						image: false
					},
					{
						name: "Qwen2.5-Coder-32B-Instruct",
						max_tokens: 16384,
						image: false
					},
					{
						name: "Meta-Llama-3.2-1B-Instruct",
						max_tokens: 16384,
						image: true
					},
					{
						name: "Meta-Llama-3.2-3B-Instruct",
						max_tokens: 8192,
						image: true
					},
					{
						name: "Llama-3.2-11B-Vision-Instruct",
						max_tokens: 4096,
						image: true
					},
					{
						name: "Llama-3.2-90B-Vision-Instruct",
						max_tokens: 4096,
						image: true
					},
					{
						name: "Qwen2-Audio-7B-Instruct",
						max_tokens: 8192,
						audio: true,
						image: false
					}]
				},
				together:
				{
					default: "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
					options: [
					{
						name: "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
						max_tokens: 131073,
						image: false
					},
					{
						name: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
						max_tokens: 32768,
						image: false
					}]
				}
			},
			COMPLETION_HIGH_COST:
			{
				openai:
				{
					default: "gpt-4.5-preview",
					options: [
					{
						name: "gpt-4.5-preview",
						max_tokens: 16834,
						image: true
					},
					{
						name: "gpt-4.5-preview-2025-02-27",
						max_tokens: 16834,
						image: true
					},
					{
						name: "o1",
						max_tokens: 100000,
						reasoning_effort: "low",
						image: true
					},
					{
						name: "o1-2024-12-17",
						max_tokens: 100000,
						reasoning_effort: "low",
						image: true
					},
					{
						name: "o1-preview",
						max_tokens: 32768,
						reasoning_effort: "low",
						image: false
					},
					{
						name: "o1-preview-2024-09-12",
						max_tokens: 32768,
						reasoning_effort: "low",
						image: false
					},
					{
						name: "gpt-4o-search-preview",
						max_tokens: 0,
						search_context_size: "low",
						image: false
					},
					{
						name: "gpt-4o-search-preview-2025-03-11",
						max_tokens: 0,
						search_context_size: "low",
						image: false
					},
					{
						name: "gpt-4o-mini-search-preview-2025-03-11",
						max_tokens: 0,
						search_context_size: "low",
						image: false
					},
					{
						name: "gpt-4o-mini-search-preview",
						max_tokens: 0,
						search_context_size: "low",
						image: false
					},
					{
						name: "gpt-4o-2024-05-13",
						max_tokens: 4096,
						image: true
					},
					{
						name: "gpt-4-turbo-2024-04-09",
						max_tokens: 4096,
						image: true
					},
					{
						name: "gpt-4-turbo",
						max_tokens: 4096,
						image: true
					},
					{
						name: "gpt-4-1106-preview",
						max_tokens: 4096,
						image: true
					},
					{
						name: "gpt-4-0613",
						max_tokens: 4096,
						image: true
					},
					{
						name: "gpt-4-0125-preview",
						max_tokens: 4096,
						image: true
					},
					{
						name: "gpt-4",
						max_tokens: 4096,
						image: true
					},
					{
						name: "chatgpt-4o-latest",
						max_tokens: 16383,
						image: true
					}]
				},
				anthropic:
				{
					default: "claude-3-7-sonnet-20250219",
					options: [
					{
						name: "claude-3-7-sonnet-20250219",
						max_tokens: 128000,
						thinking: true,
						image: true
					},
					{
						name: "claude-3-opus-20240229",
						max_tokens: 4096,
						image: true
					},
					{
						name: "claude-3-5-sonnet-20241022",
						max_tokens: 8192,
						image: true
					},
					{
						name: "claude-3-5-sonnet-20240620",
						max_tokens: 8192,
						image: true
					}]
				},
				perplexity:
				{
					default: "sonar-pro",
					options: [
					{
						name: "sonar-pro",
						max_tokens: 200000,
						image: true
					}]
				}
			},
			TRANSCRIPTION:
			{
				chutes:
				{
					default: "",
					options: [
					{
						name: ""
					}],
				},
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
				cerebras:
				{
					url: 'https://api.cerebras.ai/v1/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				openai:
				{
					url: 'https://api.openai.com/v1/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				chutes:
				{
					url: 'https://api.chutes.ai/v1/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				anthropic:
				{
					url: 'https://api.anthropic.com/v1/messages',
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
						const parts = [];
						for (const item of data.content)
						{
							if (item?.type === 'text' && item.text)
							{
								parts.push(item.text);
							}
							if (item?.type === 'thinking' && item.thinking)
							{
								parts.push(item.thinking + "\n");
							}
						}
						return parts.join('\n')
							.trim();
					},
					extractStreamContent: data =>
					{
						if (data?.delta?.text) return data.delta.text;
						if (data?.delta?.thinking) return data.delta.thinking;
						if (data?.delta?.type)
						{
							const d = data.delta;
							if (d.type === 'text_delta') return d.text || '';
							if (d.type === 'thinking_delta') return d.thinking || '';
							if (d.type === 'signature_delta') return "\n\n";
						}
						return '';
					}
				},
				deepinfra:
				{
					url: 'https://api.deepinfra.com/v1/openai/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				deepseek:
				{
					url: 'https://api.deepseek.com/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data =>
					{
						const msg = data.choices[0].message;
						const parts = [];
						if (msg.reasoning_content)
						{
							parts.push(msg.reasoning_content + "\n");
						}
						if (msg.content)
						{
							parts.push(msg.content);
						}
						return parts.join('\n')
							.trim();
					},
					extractStreamContent: data => data.choices[0]?.delta?.reasoning_content || data.choices[0]?.delta?.content,
				},
				google:
				{
					url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				x:
				{
					url: 'https://api.x.ai/v1/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				groq:
				{
					url: 'https://api.groq.com/openai/v1/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				hyperbolic:
				{
					url: 'https://api.hyperbolic.xyz/v1/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				lambda:
				{
					url: 'https://api.lambdalabs.com/v1/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				minimax:
				{
					url: 'https://api.minimaxi.chat/v1/text/chatcompletion_v2',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				ollama:
				{
					url: 'http://localhost:11434/api/chat',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				openrouter:
				{
					url: 'https://openrouter.ai/api/v1/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data =>
					{
						const msg = data.choices[0].message;
						const parts = [];
						if (msg.reasoning)
						{
							parts.push(msg.reasoning + "\n");
						}
						if (msg.content)
						{
							parts.push(msg.content);
						}
						return parts.join('\n')
							.trim();
					},
					extractStreamContent: data => data.choices[0]?.delta?.reasoning || data.choices[0]?.delta?.content
				},
				perplexity:
				{
					url: 'https://api.perplexity.ai/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data =>
					{
						const parts = [];
						if (data.choices && data.choices[0]?.message?.content)
						{
							parts.push(data.choices[0].message.content);
						}
						if (data.citations && data.citations.length > 0)
						{
							parts.push("\n\n");
							data.citations.forEach((citation, index) =>
							{
								parts.push(`[${index + 1}] ${citation}`);
							});
						}
						return parts.join('\n')
							.trim();
					},
					extractStreamContent: data =>
					{
						if (data.choices && data.choices[0]?.delta?.content)
						{
							return data.choices[0].delta.content;
						}
						return '';
					}
				},
				alibaba:
				{
					url: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				sambanova:
				{
					url: 'https://api.sambanova.ai/v1/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				},
				together:
				{
					url: 'https://api.together.xyz/v1/chat/completions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.choices[0]?.message?.content,
					extractStreamContent: data => data.choices[0]?.delta?.content
				}
			},
			TRANSCRIPTION:
			{
				chutes:
				{
					url: 'https://chutes-whisper-large-v3.chutes.ai/transcribe',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer '
				},
				groq:
				{
					url: 'https://api.groq.com/openai/v1/audio/transcriptions',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer '
				},
				openai:
				{
					url: 'https://api.openai.com/v1/audio/transcriptions',
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
			AUDIO:
			{
				cerebras:
				{
					max: 0,
					size: 0
				},
				openai:
				{
					max: 100,
					size: 100
				},
				chutes:
				{
					max: 0,
					size: 0
				},
				anthropic:
				{
					max: 0,
					size: 0
				},
				deepinfra:
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
					max: 100,
					size: 100
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
				hyperbolic:
				{
					max: 0,
					size: 0
				},
				lambda:
				{
					max: 0,
					size: 0
				},
				minimax:
				{
					max: 0,
					size: 0
				},
				ollama:
				{
					max: 0,
					size: 0
				},
				openrouter:
				{
					max: 0,
					size: 0
				},
				perplexity:
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
					max: 100,
					size: 100
				},
				together:
				{
					max: 0,
					size: 0
				}
			},
			IMAGE:
			{
				cerebras:
				{
					max: 0,
					size: 0
				},
				openai:
				{
					max: 100,
					size: 20
				},
				chutes:
				{
					max: 100,
					size: 100
				},
				anthropic:
				{
					max: 100,
					size: 5
				},
				deepinfra:
				{
					max: 100,
					size: 100
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
				hyperbolic:
				{
					max: 100,
					size: 100
				},
				lambda:
				{
					max: 0,
					size: 0
				},
				minimax:
				{
					max: 100,
					size: 100
				},
				ollama:
				{
					max: 100,
					size: 100
				},
				openrouter:
				{
					max: 1,
					size: 8
				},
				perplexity:
				{
					max: 100,
					size: 100
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
				},
				together:
				{
					max: 0,
					size: 0
				}
			},
			VIDEO:
			{
				cerebras:
				{
					max: 0,
					size: 0
				},
				openai:
				{
					max: 0,
					size: 0
				},
				chutes:
				{
					max: 0,
					size: 0
				},
				anthropic:
				{
					max: 0,
					size: 0
				},
				deepinfra:
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
				hyperbolic:
				{
					max: 0,
					size: 0
				},
				lambda:
				{
					max: 0,
					size: 0
				},
				minimax:
				{
					max: 0,
					size: 0
				},
				ollama:
				{
					max: 0,
					size: 0
				},
				openrouter:
				{
					max: 0,
					size: 0
				},
				perplexity:
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
				},
				together:
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
				}
			}
		}
	},
	UI:
	{
		API_KEY_LABELS:
		{
			cerebras: 'Cerebras API Key:',
			openai: 'OpenAI API Key:',
			chutes: 'Chutes API Key:',
			anthropic: 'Anthropic API Key:',
			deepinfra: 'Deepinfra API Key:',
			deepseek: 'DeepSeek API Key:',
			google: 'Google API Key:',
			x: 'X API Key:',
			groq: 'Groq API Key:',
			hyperbolic: 'Hyperbolic API Key:',
			lambda: 'Lambda API Key:',
			minimax: 'MiniMax API Key:',
			ollama: 'Ollama API Key:',
			openrouter: 'OpenRouter API Key:',
			perplexity: 'Perplexity API Key:',
			alibaba: 'Alibaba API Key:',
			sambanova: 'SambaNova API Key:',
			together: 'Together API Key:'
		},
		NO_BS_PROMPT: "Provide the result ONLY, without any introductory phrases or additional commentary",
		STANDARD_PROMPTS: ["Proofread this text but only fix grammar", "Proofread this text but only fix grammar and Markdown style", "Proofread this text improving clarity and flow", "Proofread this text fixing only awkward parts", "Proofread this text", "Markdown OCR"],
		TRANSLATION_PROMPT: "Translate the following text to"
	},
	VALIDATION:
	{
		API_KEY_PATTERNS:
		{
			cerebras: /^[A-Za-z0-9]{32,}$/,
			openai: /^sk-[A-Za-z0-9]{32,}$/,
			chutes: /^[A-Za-z0-9]{32,}$/,
			anthropic: /^sk-ant-[A-Za-z0-9]{32,}$/,
			deepinfra: /^[A-Za-z0-9]{32,}$/,
			deepseek: /^sk-[A-Za-z0-9]{32,}$/,
			google: /^AI[A-Za-z0-9-_]{32,}$/,
			x: /^xai-[A-Za-z0-9]{32,}$/,
			groq: /^gsk_[A-Za-z0-9]{32,}$/,
			hyperbolic: /^[A-Za-z0-9]{32,}$/,
			lambda: /^secret_[A-Za-z0-9]{32,}$/,
			minimax: /^[A-Za-z0-9]{32,}$/,
			ollama: /^.*$/,
			openrouter: /^sk-or-v1-[A-Za-z0-9]{32,}$/,
			perplexity: /^pplx-[A-Za-z0-9]{32,}$/,
			alibaba: /^sk-[A-Za-z0-9]{32,}$/,
			sambanova: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
			together: /^tgp_v1_[A-Za-z0-9]{32,}$/
		}
	}
};
window.MathJax = {
	tex:
	{
		inlineMath: [
			['$', '$'],
			['\\\(', '\\\)']
		],
		displayMath: [
			['$$', '$$'],
			['\\\[', '\\\]']
		]
	}
};