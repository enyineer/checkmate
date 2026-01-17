import { xml } from "@codemirror/lang-xml";
import { Decoration } from "@codemirror/view";
import type { LanguageSupport, DecorationRange } from "./types";

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
 * Check if cursor is in a valid XML template position.
 * Templates can appear in:
 * 1. Text content between tags: <tag>|</tag>
 * 2. Attribute values: <tag attr="|">
 * @internal Exported for testing
 */
export function isValidXmlTemplatePosition(text: string): boolean {
  // Check if we're inside an attribute value (inside quotes after =)
  let inTag = false;
  let inAttrValue = false;
  let quoteChar = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (!inTag && char === "<" && text[i + 1] !== "/") {
      inTag = true;
      inAttrValue = false;
    } else if (inTag && char === ">") {
      inTag = false;
      inAttrValue = false;
    } else if (inTag && !inAttrValue && char === "=") {
      // Next should be a quote
      const nextChar = text[i + 1];
      if (nextChar === '"' || nextChar === "'") {
        quoteChar = nextChar;
        inAttrValue = true;
        i++; // Skip the quote
      }
    } else if (inAttrValue && char === quoteChar) {
      inAttrValue = false;
      quoteChar = "";
    }
  }

  // Valid if inside attribute value
  if (inAttrValue) {
    return true;
  }

  // Valid if between tags (text content position)
  // Check if we're after a closing > and not inside an opening <
  const lastOpenTag = text.lastIndexOf("<");
  const lastCloseTag = text.lastIndexOf(">");

  // If last > is after last <, we're in text content
  if (lastCloseTag > lastOpenTag) {
    return true;
  }

  return false;
}

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

/**
 * Calculate indentation for XML, properly handling template expressions.
 * @internal Exported for testing
 */
export function calculateXmlIndentation(
  textBefore: string,
  indentUnit: number,
): number {
  let depth = 0;

  // Match all opening and closing tags
  const tagRegex = /<\/?[\w:-]+[^>]*\/?>/g;
  let match;

  while ((match = tagRegex.exec(textBefore)) !== null) {
    const tag = match[0];

    // Self-closing tag: <tag />
    if (tag.endsWith("/>")) {
      // No depth change
      continue;
    }

    // Closing tag: </tag>
    if (tag.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      continue;
    }

    // Opening tag: <tag> or <tag attr="value">
    depth++;
  }

  return depth * indentUnit;
}

/**
 * XML language support for CodeEditor with template expression handling.
 */
export const xmlLanguageSupport: LanguageSupport = {
  extension: xml(),
  buildDecorations: buildXmlDecorations,
  isValidTemplatePosition: isValidXmlTemplatePosition,
  calculateIndentation: calculateXmlIndentation,
};
