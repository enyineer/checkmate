/**
 * Pure utility functions for Markdown parsing that don't depend on CodeMirror.
 * These are extracted to allow testing without triggering CodeMirror's module loading.
 */

/**
 * Check if cursor is in a valid Markdown template position.
 * Templates can appear almost anywhere in Markdown (text content).
 * @internal Exported for testing
 */
export function isValidMarkdownTemplatePosition(text: string): boolean {
  // In Markdown, templates are valid almost everywhere except:
  // - Inside code blocks (``` ... ```)
  // - Inside inline code (` ... `)

  // Check for unclosed code blocks
  const codeBlockMatches = text.match(/```/g) || [];
  if (codeBlockMatches.length % 2 === 1) {
    return false; // Inside a code block
  }

  // Check if we're inside inline code on the current line
  const lastNewline = text.lastIndexOf("\n");
  const currentLine = text.slice(lastNewline + 1);
  const backticks = (currentLine.match(/`/g) || []).length;

  // If odd number of backticks, we're inside inline code
  if (backticks % 2 === 1) {
    return false;
  }

  // Valid in all other positions
  return true;
}

/**
 * Calculate indentation for Markdown.
 * Markdown uses list indentation.
 * @internal Exported for testing
 */
export function calculateMarkdownIndentation(
  textBefore: string,
  _indentUnit: number,
): number {
  const lines = textBefore.split("\n");
  if (lines.length === 0) return 0;

  // Find the last non-empty line
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.trim().length === 0) continue;

    // Count leading spaces
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length ?? 0;

    // If line is a list item, next line should be indented if continuing
    if (/^\s*[-*+]\s/.test(line) || /^\s*\d+\.\s/.test(line)) {
      return leadingSpaces;
    }

    return leadingSpaces;
  }

  return 0;
}
