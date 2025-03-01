# CoFlu

CoFlu is a powerful text manipulation, generation, and comparison tool. It's designed for tasks like proofreading, editing, content creation, version control, and ensuring text consistency. CoFlu offers unique capabilities, including AI-powered text generation, audio transcription, and unprecedented layout-preserving .docx translation using LLMs.

![CoFlu](CoFlu.png)

**Key Differentiator:** As of February 2025, CoFlu is the *only* website offering Microsoft Word (.docx) translation that *fully preserves the original document's layout* (fonts, styles, tables, images, and other elements) while using LLMs for superior translation quality. This sets CoFlu apart, providing a powerful and unique capability for users working with formatted documents.

## Features

**1. Text Manipulation & Comparison:**

-   **File Upload:** Supports `.epub`, `.txt`, `.html`, `.htm`, `.css`, `.xml`, `.json`, and `.docx`.
-   **Text Comparison:**
    -   Calculates Levenshtein distance and percentage differences.
    -   Optional "semantic cleanup" for more meaningful comparisons.
    -   **Diff Views:** Single-column (insertions/deletions highlighted) or double-column (side-by-side).
-   **Text Transformations:**
    -   Convert case (uppercase/lowercase).
    -   Deduplicate and sort lines (alphabetically, including space-separated words).
    -   Remove bold formatting and extra spaces.
    -   Format LaTeX (spacing around delimiters) and HTML (`&nbsp;` to spaces).
    -   Retab: Convert spaces to tabs for consistent indentation.
-   **Markdown Rendering:**
    -   Converts Markdown to HTML, including math (KaTeX or MathJax).
    -   Print/save as PDF with Ctrl+P.

**2. AI-Powered Capabilities:**

-   **AI Text Generation:** Uses leading AI models:
    -   **OpenAI:** `gpt-4o`, `o3-mini`, and others.
    -   **Anthropic:** `claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-5-haiku`.
    -   **DeepSeek:** R1 and V3.
    -   **Google Gemini:** Gemini 2.0 models, including video input.
    -   **Groq:** LPU high-speed inference, including vision models.
    -   **OpenRouter:** Unsage Dolphin 3.0, Mistral, and `gpt-4o` extended output.
    -   **xAI:** The most based Grok.
    -   **Alibaba:** `qwen-max`, `qwen-vl-max`, and others.
    -   **SambaNova:** Fastest full-size DeepSeek and LLaMAs.
    -   **Together.AI:** Qwens.
-   **Prompting:**
    -   Predefined prompts (e.g., "Proofread this text").
    -   Create and save custom prompts.
    -   Optional streaming output (see text as it's generated).
    -   Image/video input (for supported models).
-   **Audio Transcription:**
    -   Transcribes `.flac`, `.mp3`, `.mp4`, `.mpeg`, `.mpga`, `.m4a`, `.ogg`, `.wav`, `.webm`.
    -   Uses Whisper models.
    -   Supports multiple languages.
-   **Text Translation:** Translates text using the selected AI model (also as part of the .docx feature).

**3. Groundbreaking .DOCX Translation:**

-   **Upload & Translate .DOCX:** Handles Microsoft Word documents.
-   **Full Layout Preservation:** *Crucially*, CoFlu maintains the *exact* original formatting (fonts, styles, tables, images).
-   **LLM-Powered:** Uses the selected AI model for translation.
-   **Translation Settings:**
    -   **Batch Size:** Number of text chunks sent to the AI at once (smaller = more stable).
    -   **Batch RPM:** Delay between batches (same as API rate limits).
    -   **Exponential Retry:** Number of retries for failed API requests.
-   **Download Translated .DOCX:** Automatically downloads the translated document.

**4. User Experience:**

-   **Local Storage:** Saves text, chat, API keys, settings, and custom prompts in your browser. No data is sent to external servers (except for API calls to the chosen AI provider).
-   **Appearance:** Light/dark mode, wide mode.
-   **Settings Import/Export:** JSON format.

## Usage

1.  **Load Text:** Upload files or paste/type text into the source/target areas.
2.  **Transform:** Use buttons above text areas for transformations (uppercase, lowercase, dedupe, etc.).
3.  **AI Generate:**
    -   Select an API model and enter your API key in settings.
    -   Choose a prompt (predefined or custom).
    -   (Optional) Upload images/videos, enable streaming.
    -   Click "Generate."
4.  **Compare:** Click "Compare" to see differences (Levenshtein, percentage, visual diffs).
5.  **Switch:** Swap source and target text.
6.  **Transcribe:** Select language, upload audio, click "Start Transcribe."
7.  **Render Markdown:** Choose math renderer (KaTeX/MathJax), click "Render," use Ctrl+P to save.
8.  **Translate .DOCX:** Select language, upload .docx, click "Start Translation."

## Custom Prompts

1.  Enter your custom prompt in the "Custom Prompt" input.
2.  Click "Save Prompt" to store it for later use.
3.  Saved prompts will appear in the "Select Prompt" dropdown.

## API Keys

-   **Required for AI features (generation, transcription, .docx translation).**
-   Enter keys in the "Settings" page.
-   CoFlu supports:
    -   **OpenAI:** [OpenAI Platform](https://platform.openai.com/api-keys)
    -   **Anthropic:** [Anthropic Console](https://console.anthropic.com/settings/keys)
    -   **Google:** [Google AI Studio](https://aistudio.google.com/app/apikey)
    -   **Grok:** [xAI Cloud Console](https://console.x.ai)
    -   **Groq:** [GroqCloud](https://console.groq.com/keys)
    -   **OpenRouter:** [OpenRouter](https://openrouter.ai/settings/keys)
    -   **Qwen:** [Alibaba Cloud](https://bailian.console.alibabacloud.com/?apiKey=1#/api-key)
    -   **SambaNova:** [SambaNova Cloud](https://cloud.sambanova.ai/apis)
    -   **Together:** [Together.AI](https://api.together.ai/settings/api-keys)

## Dependencies

- [Bootstrap](https://getbootstrap.com)
- [JSZip](https://github.com/Stuk/jszip)
- [KaTeX](https://katex.org)
- [MathJax](https://www.mathjax.org)
- [diff-match-patch](https://github.com/google/diff-match-patch)
- [marked](https://marked.js.org)

## Inspiration

- [Count Words Free - Compare Texts](https://countwordsfree.com/comparetexts)
- [EditGPT](https://editgpt.app)
- [Notability](https://notability.com)

## Bugs

- 🔴 Fix CORS for Groq's 40MB audio upload.
- 🔴 Fix chat reasoning not showing.
- 🔴 Fix max_completion_tokens for O models and max_tokens for others.
- 🔴 Fix reasoning in OpenRouter as `{"max_tokens": 100000}` is not used.
- 🟡 Fix JSON file input causing `[object Object]` to be saved.
- 🟡 Fix Qwen Vision failure.
- 🟡 Fix SUS key validation.
- 🟡 Fix stop button not stopping in chat.
- 🟡 Implement real-time update for import/export settings.
- 🟢 Other bugs have not been found yet.

## TODOs

- 🔴 Add support for local LLMs via Ollama.js for offline and independent use.
- 🔴 Adjust transcription size limits: 40 MB for Groq.
- 🔴 Allow disabling of thinking tokens (`<think>` for DeepSeek, Groq, and SambaNova; `"thinking"` for Claude).
- 🔴 Allow saving of images and videos attached to chat.
- 🔴 Create online storage for large videos (up to 2 GB) for Gemini.
- 🔴 Enable editing of custom prompts:
	- 🔴 Include a delete button for custom prompts.
	- 🟡 When selecting a custom prompt, a text input field should reappear, similar to adding a new prompt.
- 🔴 Enable image drag-and-drop or paste (Ctrl+V) into the image upload card.
- 🔴 Extend document support to additional formats, including PDFs, for both input and translation.
- 🔴 Generate pages from HTML templates.
- 🔴 Implement history for index, chat, and translation.
- 🔴 Modify the word counter.
- 🔴 Possibly add TTS tools.
- 🔴 Possibly add an OCR tool based on "Extract the text elements described by the user from the picture and return the result formatted as a JSON in the following format: {name_of_element: [value]}".
- 🔴 Possibly add image diff.
- 🔴 Provide an option to display tokens instead of words.
- 🔴 Refactor and rewrite the entire codebase.
- 🔴 Rewrite Gemini without relying on Google Generative AI.
- 🔴 Support YouTube video transcription.
- 🔴 Support login via Google, Microsoft, and GitHub for syncing.
- 🔴 Support multiple chat sessions.
- 🟡 Add `transcription.html` and transcription proofreading options.
- 🟡 Add audio input support for ChatGPT, Gemini, Qwen, and SambaNova.
- 🟡 Explore other models on www.minimax.io and lambdalabs.com.
- 🟡 Provide an option to enable high-cost models (gpt-4.5, o1, opus-3).
- 🟡 Rewrite Gemini for OpenAI compatibility.
- 🟢 Consider adding new default prompts, such as: *"Markdown OCR the following scan. The first page example is already given; continue from the second image."*
- 🟢 Improve LaTeX handling by replacing punctuation inside separate text macros.
- 🟢 Include Cerebras if approved.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.