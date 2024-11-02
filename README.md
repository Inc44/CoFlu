# CoFlu

CoFlu is a comprehensive text comparison tool that allows users to compare two pieces of text, generate text using ChatGPT, and view differences in both single and double-column formats. This tool is particularly useful for proofreading, editing, and ensuring consistency between different versions of text.

## Features

- **File Upload**: Load text from `.epub`, `.txt`, `.html`, `.htm`, `.css`, `.xml`, and `.json` files.
- **Text Transformation**: Convert text to uppercase or lowercase.
- **Text Generation**: Generate text using ChatGPT with customizable prompts.
- **Text Comparison**: Compare two texts and view differences using Levenshtein distance and percentage differences.
- **Diff Views**: View differences in single-column or double-column formats.
- **Local Storage**: Save and load text and settings from local storage.

## Usage

1. **Load Text**: Use the file input buttons to load text files into the source and target text areas.
2. **Transform Text**: Use the uppercase and lowercase buttons to transform the text.
3. **Generate Text**: Enter your ChatGPT API key, select or enter a custom prompt, and click "Generate with ChatGPT" to generate text in the target text area.
4. **Compare Texts**: Click the "Compare" button to compare the source and target texts. The results will be displayed below.
5. **Switch Texts**: Click the "Switch Texts" button to swap the contents of the source and target text areas.

## Custom Prompts

1. Enter a custom prompt in the "Custom Prompt" input field.
2. Click the "Save Prompt" button to save the custom prompt for future use.

## Dependencies

- [Bootstrap 5.3.3](https://getbootstrap.com/)
- [ChatGPT API](https://platform.openai.com/api-keys/)

## Inspiration

- [Count Words Free - Compare Texts](https://countwordsfree.com/comparetexts)
- [EditGPT](https://editgpt.app/)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
