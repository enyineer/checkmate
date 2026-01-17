import { yaml } from "@codemirror/lang-yaml";
import { Decoration } from "@codemirror/view";
import type { LanguageSupport, DecorationRange } from "./types";

// Decoration marks for YAML syntax highlighting using inline styles
const yamlKeyMark = Decoration.mark({
  attributes: { style: "color: hsl(210, 100%, 75%)" }, // Bright blue for better visibility
});
const yamlStringMark = Decoration.mark({
  attributes: { style: "color: hsl(142.1, 76.2%, 36.3%)" },
});
const yamlNumberMark = Decoration.mark({
  attributes: { style: "color: hsl(217.2, 91.2%, 59.8%)" },
});
const yamlBoolMark = Decoration.mark({
  attributes: { style: "color: hsl(280, 65%, 60%)" },
});
const templateMark = Decoration.mark({
  attributes: { style: "color: hsl(190, 70%, 50%); font-weight: 500" },
});

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
 * Build YAML + template decorations.
 */
function buildYamlDecorations(doc: string): DecorationRange[] {
  const ranges: DecorationRange[] = [];

  // Match templates first (highest priority)
  const templateRegex = /\{\{[\w.[\]]*\}\}/g;
  let match;
  while ((match = templateRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].length,
      decoration: templateMark,
    });
  }

  // Match YAML keys (word followed by colon)
  const keyRegex = /^(\s*)([\w-]+):/gm;
  while ((match = keyRegex.exec(doc)) !== null) {
    const keyStart = match.index + match[1].length;
    const keyEnd = keyStart + match[2].length;
    ranges.push({
      from: keyStart,
      to: keyEnd,
      decoration: yamlKeyMark,
    });
  }

  // Match quoted strings
  const stringRegex = /(["'])(?:(?!\1)[^\\]|\\.)*\1/g;
  while ((match = stringRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].length,
      decoration: yamlStringMark,
    });
  }

  // Match numbers (standalone)
  const numberRegex = /(?<=:\s+)-?\d+\.?\d*(?:\s|$)/g;
  while ((match = numberRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].trim().length,
      decoration: yamlNumberMark,
    });
  }

  // Match booleans
  const boolRegex = /(?<=:\s+)(true|false|yes|no|on|off)(?:\s|$)/gi;
  while ((match = boolRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index,
      to: match.index + match[1].length,
      decoration: yamlBoolMark,
    });
  }

  // Sort by position
  ranges.sort((a, b) => a.from - b.from || a.to - b.to);

  // Remove overlaps (templates take priority)
  const filtered: DecorationRange[] = [];
  for (const range of ranges) {
    const overlaps = filtered.some(
      (existing) =>
        (range.from >= existing.from && range.from < existing.to) ||
        (range.to > existing.from && range.to <= existing.to),
    );
    if (!overlaps) {
      filtered.push(range);
    }
  }

  return filtered;
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

/**
 * YAML language support for CodeEditor with template expression handling.
 */
export const yamlLanguageSupport: LanguageSupport = {
  extension: yaml(),
  buildDecorations: buildYamlDecorations,
  isValidTemplatePosition: isValidYamlTemplatePosition,
  calculateIndentation: calculateYamlIndentation,
};
