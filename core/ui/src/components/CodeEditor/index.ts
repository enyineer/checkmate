export {
  CodeEditor,
  type CodeEditorProps,
  type CodeEditorLanguage,
  type TemplateProperty,
} from "./CodeEditor";

// Re-export language support for testing and extensibility
export { isValidJsonTemplatePosition } from "./languageSupport";
export type { LanguageSupport, DecorationRange } from "./languageSupport";
