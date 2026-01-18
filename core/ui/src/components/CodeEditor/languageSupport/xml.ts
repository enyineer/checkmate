import { xml } from "@codemirror/lang-xml";
import { Decoration } from "@codemirror/view";
import type { LanguageSupport, DecorationRange } from "./types";

// Re-export pure utils for backwards compatibility
export {
  isValidXmlTemplatePosition,
  calculateXmlIndentation,
} from "./xml-utils";

// Decoration marks for XML syntax highlighting using inline styles
const xmlTagMark = Decoration.mark({
  attributes: { style: "color: hsl(280, 65%, 60%)" },
});
const xmlAttrNameMark = Decoration.mark({
  attributes: { style: "color: hsl(190, 70%, 50%)" },
});
const xmlAttrValueMark = Decoration.mark({
  attributes: { style: "color: hsl(142.1, 76.2%, 36.3%)" },
});
const templateMark = Decoration.mark({
  attributes: { style: "color: hsl(190, 70%, 50%); font-weight: 500" },
});

/**
 * Build XML + template decorations.
 */
function buildXmlDecorations(doc: string): DecorationRange[] {
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

  // Match XML tags (opening and closing)
  const tagRegex = /<\/?[\w:-]+/g;
  while ((match = tagRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].length,
      decoration: xmlTagMark,
    });
  }

  // Match closing > and />
  const closeTagRegex = /\/?>/g;
  while ((match = closeTagRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].length,
      decoration: xmlTagMark,
    });
  }

  // Match attribute names
  const attrNameRegex = /\s([\w:-]+)=/g;
  while ((match = attrNameRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index + 1, // Skip leading space
      to: match.index + 1 + match[1].length,
      decoration: xmlAttrNameMark,
    });
  }

  // Match attribute values (quoted strings after =)
  const attrValueRegex = /=(["'])(?:(?!\1)[^\\]|\\.)*\1/g;
  while ((match = attrValueRegex.exec(doc)) !== null) {
    // Skip the = but include the quotes
    ranges.push({
      from: match.index + 1,
      to: match.index + match[0].length,
      decoration: xmlAttrValueMark,
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
  isValidXmlTemplatePosition,
  calculateXmlIndentation,
} from "./xml-utils";

/**
 * XML language support for CodeEditor with template expression handling.
 */
export const xmlLanguageSupport: LanguageSupport = {
  extension: xml(),
  buildDecorations: buildXmlDecorations,
  isValidTemplatePosition: isValidXmlTemplatePosition,
  calculateIndentation: calculateXmlIndentation,
};
