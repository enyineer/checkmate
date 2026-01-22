// Monaco-based CodeEditor
// Re-export all from MonacoEditor as the new CodeEditor implementation

export {
  CodeEditor,
  type CodeEditorProps,
  type CodeEditorLanguage,
  type TemplateProperty,
} from "./MonacoEditor";

export {
  generateTypeDefinitions,
  type GenerateTypesOptions,
} from "./generateTypeDefinitions";
