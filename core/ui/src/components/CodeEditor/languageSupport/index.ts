export type { LanguageSupport, DecorationRange } from "./types";
export {
  jsonLanguageSupport,
  isValidJsonTemplatePosition,
  calculateJsonIndentation,
} from "./json";
export {
  yamlLanguageSupport,
  isValidYamlTemplatePosition,
  calculateYamlIndentation,
} from "./yaml";
export {
  xmlLanguageSupport,
  isValidXmlTemplatePosition,
  calculateXmlIndentation,
} from "./xml";
export {
  markdownLanguageSupport,
  isValidMarkdownTemplatePosition,
  calculateMarkdownIndentation,
} from "./markdown";
export { isBetweenBrackets } from "./enterBehavior";
