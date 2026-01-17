---
"@checkstack/ui": minor
---

## CodeEditor Multi-Language Support

- **Refactored CodeEditor** into modular architecture with language-specific support
- **Added language modes**: JSON, YAML, XML, and Markdown with custom indentation and syntax highlighting
- **Smart Enter key behavior**: Bracket/tag splitting (e.g., `<div></div>` → proper split on Enter)
- **Autocomplete fix**: Enter key now correctly selects completions instead of inserting newlines
- **Click area fix**: Entire editor area is now clickable (per official CodeMirror minHeight docs)
- **Line numbers**: Now visible with proper gutter styling
- **185 comprehensive tests** for all language indentation and template position validation
