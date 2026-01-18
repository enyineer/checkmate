import { yaml } from "@codemirror/lang-yaml";
import { Decoration } from "@codemirror/view";
import type { LanguageSupport, DecorationRange } from "./types";

// Re-export pure utils for backwards compatibility
export {
  isValidYamlTemplatePosition,
  calculateYamlIndentation,
} from "./yaml-utils";

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

// Import the pure utils for use in the language support object
import {
  isValidYamlTemplatePosition,
  calculateYamlIndentation,
} from "./yaml-utils";

/**
 * YAML language support for CodeEditor with template expression handling.
 */
export const yamlLanguageSupport: LanguageSupport = {
  extension: yaml(),
  buildDecorations: buildYamlDecorations,
  isValidTemplatePosition: isValidYamlTemplatePosition,
  calculateIndentation: calculateYamlIndentation,
};
