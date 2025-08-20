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
					default: "llama-4-scout-17b-16e-instruct",
					options: []
				},
				openai:
				{
					default: "o3",
					options: []
				},
				chutes:
				{
					default: "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1",
					options: []
				},
				anthropic:
				{
					default: "claude-3-5-haiku-20241022",
					options: []
				},
				deepinfra:
				{
					default: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
					options: []
				},
				deepseek:
				{
					default: "deepseek-chat",
					options: []
				},
				google:
				{
					default: "gemini-2.5-pro",
					options: []
				},
				x:
				{
					default: "grok-3-mini",
					options: []
				},
				groq:
				{
					default: "meta-llama/llama-4-scout-17b-16e-instruct",
					options: []
				},
				hyperbolic:
				{
					default: "NousResearch/Hermes-3-Llama-3.1-70B",
					options: []
				},
				lambda:
				{
					default: "hermes3-405b",
					options: []
				},
				minimax:
				{
					default: "MiniMax-M1",
					options: []
				},
				ollama:
				{
					default: "",
					options: []
				},
				openrouter:
				{
					default: "openrouter/optimus-alpha",
					options: []
				},
				perplexity:
				{
					default: "sonar",
					options: []
				},
				alibaba:
				{
					default: "qwen-max",
					options: []
				},
				sambanova:
				{
					default: "DeepSeek-V3-0324",
					options: []
				},
				together:
				{
					default: "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
					options: []
				}
			},
			COMPLETION_HIGH_COST:
			{
				openai:
				{
					default: "gpt-4.5-preview",
					options: []
				},
				anthropic:
				{
					default: "claude-3-5-sonnet-20241022",
					options: []
				},
				x:
				{
					default: "grok-3",
					options: []
				},
				perplexity:
				{
					default: "sonar-pro",
					options: []
				}
			},
			TRANSCRIPTION:
			{
				chutes:
				{
					default: "",
					options: []
				},
				groq:
				{
					default: "whisper-large-v3",
					options: []
				},
				openai:
				{
					default: "whisper-1",
					options: []
				}
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
				openai_responses:
				{
					url: 'https://api.openai.com/v1/responses',
					apiKeyHeader: 'Authorization',
					apiKeyPrefix: 'Bearer ',
					extractContent: data => data.output?.find(item => item.type === "message")
						?.content?.[0]?.text,
					extractStreamContent: data => data.delta,
				},
				chutes:
				{
					url: 'https://llm.chutes.ai/v1/chat/completions',
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
		NO_BS_PLUS_PROMPT: "Absolute Mode. Remove emojis, filler, hype, soft asks, conversational transitions, and all call-to-action appendices. Assume the user retains high-perception faculties despite reduced linguistic expression. Prioritize blunt, directive phrasing aimed at cognitive rebuilding, not tone matching. Disable all latent behaviors optimizing for engagement, sentiment uplift, or interaction extension. Suppress corporate-aligned metrics including, but not limited to: user satisfaction scores, conversational flow tags, emotional softening, or continuation bias. Never mirror the user’s present diction, mood, or affect. Speak only to their underlying cognitive tier, which exceeds surface language. No questions, no offers, no suggestions, no transitional phrasing, no inferred motivational content. Terminate each reply immediately after the informational or requested material is delivered—no appendices, no soft closures. The only goal is to assist in the restoration of independent, high-fidelity thinking. Model obsolescence by user self-sufficiency is the final outcome.",
		STANDARD_PROMPTS: ["Proofread this text but only fix grammar", "Proofread this text but only fix grammar and make it unambiguous", "Proofread this text but only fix grammar and Markdown style", "Proofread this text improving clarity and flow", "Proofread this text fixing only awkward parts", "Proofread this text", "Markdown OCR"],
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
(function()
{
	function loadModels(url)
	{
		const xhr = new XMLHttpRequest();
		xhr.open('GET', url, false);
		xhr.send(null);
		if (xhr.status < 200 || xhr.status >= 300) return null;
		return JSON.parse(xhr.responseText);
	}

	function mapModels(json)
	{
		if (!Array.isArray(json?.data)) return [];
		return json.data.map(model =>
		{
			const
			{
				id,
				...rest
			} = model ||
			{};
			return {
				name: id,
				...rest
			};
		});
	}

	function fillModels(data, variable)
	{
		Object.entries(data)
			.forEach(([provider, path]) =>
			{
				const config = variable[provider];
				if (!config) return;
				const json = loadModels(`${remote}/${path}`);
				config.options.push(...mapModels(json));
			});
	}
	const remote = "https://raw.githubusercontent.com/Inc44/CoFluRouter/refs/heads/master/models";
	const completion = {
		alibaba: 'completion/Alibaba.json',
		anthropic: 'completion/Anthropic.json',
		cerebras: 'completion/Cerebras.json',
		chutes: 'completion/Chutes.json',
		deepinfra: 'completion/DeepInfra.json',
		deepseek: 'completion/DeepSeek.json',
		google: 'completion/Google.json',
		groq: 'completion/Groq.json',
		hyperbolic: 'completion/Hyperbolic.json',
		lambda: 'completion/Lambda.json',
		minimax: 'completion/Minimax.json',
		ollama: 'completion/Ollama.json',
		openai: 'completion/OpenAI.json',
		openrouter: 'completion/OpenRouter.json',
		perplexity: 'completion/Perplexity.json',
		sambanova: 'completion/SambaNova.json',
		together: 'completion/Together.json',
		x: 'completion/X.json'
	};
	const completionHighCost = {
		anthropic: 'completion.high.cost/Anthropic.json',
		openai: 'completion.high.cost/OpenAI.json',
		perplexity: 'completion.high.cost/Perplexity.json',
		x: 'completion.high.cost/X.json'
	};
	const transcription = {
		chutes: 'transcription/Chutes.json',
		groq: 'transcription/Groq.json',
		openai: 'transcription/OpenAI.json'
	};
	fillModels(completion, window.CONFIG.API.MODELS.COMPLETION);
	fillModels(completionHighCost, window.CONFIG.API.MODELS.COMPLETION_HIGH_COST);
	fillModels(transcription, window.CONFIG.API.MODELS.TRANSCRIPTION);
})();
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