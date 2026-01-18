/**
 * Pure utility functions for YAML parsing that don't depend on CodeMirror.
 * These are extracted to allow testing without triggering CodeMirror's module loading.
 */

/**
 * Check if cursor is in a valid YAML template position.
 * In YAML, templates can appear as values after "key: ".
 * @internal Exported for testing
 */
export function isValidYamlTemplatePosition(text: string): boolean {
  // Find the current line
  const lastNewline = text.lastIndexOf("\n");
  const currentLine = text.slice(lastNewline + 1);

  // Valid positions in YAML:
  // 1. After a colon and space (value position): "key: |"
  // 2. Inside a quoted string: 'key: "hello|'
  // 3. In a list item position: "- |"

  // Check if we're inside a quoted string
  const singleQuotes = (currentLine.match(/'/g) || []).length;
  const doubleQuotes = (currentLine.match(/"/g) || []).length;
  if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1) {
    return true;
  }

  // Check if we're after "key: " (value position)
  const colonMatch = currentLine.match(/^\s*[\w-]+:\s+/);
  if (colonMatch) {
    return true;
  }

  // Check if we're in a list item position "- "
  const listMatch = currentLine.match(/^\s*-\s+/);
  if (listMatch) {
    return true;
  }

  // Check if we're after ": " anywhere in the line
  if (currentLine.includes(": ")) {
    const afterColon = currentLine.split(": ").slice(1).join(": ");
    // If we're in the value part (after colon)
    if (afterColon.length > 0 || currentLine.endsWith(": ")) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate indentation for YAML, properly handling template expressions.
 * YAML uses indentation-based structure.
 * @internal Exported for testing
 */
export function calculateYamlIndentation(
  textBefore: string,
  indentUnit: number,
): number {
  const lines = textBefore.split("\n");
  if (lines.length === 0) return 0;

  // Get the last line (the one we're currently on after Enter)
  const currentLine = lines.at(-1);

  // If current line is empty or whitespace, look at previous line
  if (currentLine?.trim().length === 0 && lines.length > 1) {
    // Find the last non-empty line
    for (let i = lines.length - 2; i >= 0; i--) {
      const line = lines[i];
      if (line.trim().length === 0) continue;

      // Count leading spaces
      const leadingSpaces = line.match(/^(\s*)/)?.[1].length ?? 0;

      // If line ends with ":" it's a key that starts a new block
      if (line.trimEnd().endsWith(":")) {
        return leadingSpaces + indentUnit;
      }

      // If line starts with "- " it's a list item
      if (line.trim().startsWith("-")) {
        return leadingSpaces + indentUnit;
      }

      // Otherwise, maintain current indentation
      return leadingSpaces;
    }
  }

  // For non-empty current line, find previous non-empty for context
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.trim().length === 0) continue;
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length ?? 0;
    return leadingSpaces;
  }

  return 0;
}
