import type { Extension } from "@codemirror/state";
import type { Decoration } from "@codemirror/view";

/**
 * A decoration range to be applied to the document.
 */
export interface DecorationRange {
  from: number;
  to: number;
  decoration: Decoration;
}

/**
 * Interface for language-specific support in CodeEditor.
 * Each language (JSON, YAML, etc.) implements this interface to provide
 * syntax highlighting that works correctly with {{template}} expressions.
 */
export interface LanguageSupport {
  /**
   * The CodeMirror language extension for this language.
   * Provides indentation, bracket matching, folding, etc.
   */
  extension: Extension;

  /**
   * Build decoration ranges for syntax highlighting.
   * This is used to override the Lezer parser's highlighting when templates
   * are present (since {{}} confuses most language parsers).
   * @param doc The document text
   * @returns Array of decoration ranges to apply
   */
  buildDecorations: (doc: string) => DecorationRange[];

  /**
   * Check if the cursor position is valid for template insertion.
   * @param textBefore The document text before the cursor
   * @returns true if templates can be inserted at this position
   */
  isValidTemplatePosition: (textBefore: string) => boolean;

  /**
   * Calculate the indentation level for a given line.
   * This is used to provide correct indentation that won't be confused by templates.
   * @param textBefore All text before the current line
   * @returns Number of spaces to indent
   */
  calculateIndentation: (textBefore: string, indentUnit: number) => number;
}
