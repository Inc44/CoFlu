# CoFlu

CoFlu is a comprehensive text manipulation and comparison tool that allows users to compare two pieces of text, generate text using various AI models, and view differences in both single- and double-column formats. It also includes features for text transformation, audio transcription, and image handling. This tool is particularly useful for proofreading, editing, content generation, and ensuring consistency between different versions of text.

## Features

- **File Upload**: Load text from `.epub`, `.txt`, `.html`, `.htm`, `.css`, `.xml`, and `.json` files.
- **Text Transformation**: Convert text to uppercase or lowercase, deduplicate lines, sort lines, remove bold formatting, remove extra spaces, format LaTeX, and format HTML.
- **AI Text Generation**: Generate text using various AI models, including:
    - OpenAI's ChatGPT
    - Anthropic's Claude
    - Google's Gemini
    - Groq's LLaMA
  with customizable prompts and streaming response support.
- **Text Comparison**: Compare two texts and view differences using Levenshtein distance and percentage differences, with an option for semantic cleanup.
- **Diff Views**: View differences in single-column or double-column formats, with clear highlighting of insertions and deletions.
- **Image Upload**: Upload and include images in prompts for certain models.
- **Audio Transcription**: Transcribe audio files using Groq's Whisper model.
- **Text Translation**: Translate text to various languages using the selected AI model.
- **Markdown Rendering**: Render markdown content with support for KaTeX and MathJax for mathematical expressions.
- **Local Storage**: Save and load text, settings, and custom prompts from local storage.
- **Appearance Customization**: Switch between light and dark modes, and toggle a wide layout.

## Usage

1. **Load Text**: Use the file input buttons to load text files into the source and target text areas.
2. **Transform Text**: Use the text transformation buttons to manipulate text (e.g., uppercase, lowercase, deduplicate, sort, unbold, unspace, fix LaTeX, fix HTML).
3. **AI Text Generation**:
    - Select your desired API model (ChatGPT, Claude, Gemini, or Groq).
    - Enter the corresponding API key.
    - Select a pre-defined prompt or enter a custom prompt.
    - Optionally, upload images for models that support it.
    - Optionally, enable/disable streaming response.
    - Click "Generate" to generate text in the target text area.
4. **Compare Texts**: Click the "Compare" button to compare the source and target texts. The results, including the Levenshtein distance and percentage differences, will be displayed below.
5. **Switch Texts**: Click the "Switch" button to swap the contents of the source and target text areas.
6. **Audio Transcription**:
    - Select the target language.
    - Upload an audio file.
    - Click the "Start Transcribe" button to start transcription.
7. **Markdown Rendering**:
    - Click "Render" to render markdown to diff view.
    - Set the math renderer (KaTeX or MathJax).
    - Pressing `Ctrl+P` makes it possible to save rendered target text.

## Custom Prompts

1. Enter a custom prompt in the "Custom Prompt" input field.
2. Click the "Save Prompt" button to save the custom prompt for future use.
3. Saved custom prompts will appear in the dropdown menu.

## API Keys

- You will need an API key to access the AI generation and transcription features.
- CoFlu supports API keys from OpenAI, Anthropic, Google, and Groq.

## Dependencies

- [Bootstrap](https://getbootstrap.com)

- [diff-match-patch](https://github.com/google/diff-match-patch)

- [marked](https://marked.js.org)

- [KaTeX](https://katex.org)
- [MathJax](https://www.mathjax.org)

- [OpenAI Platform](https://platform.openai.com/api-keys)
- [Anthropic Console](https://console.anthropic.com/settings/keys)
- [Google AI Studio](https://aistudio.google.com/app/apikey)
- [GroqCloud](https://console.groq.com/keys)

## Inspiration

- [Count Words Free - Compare Texts](https://countwordsfree.com/comparetexts)
- [EditGPT](https://editgpt.app/)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.