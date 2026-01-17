import { json } from "@codemirror/lang-json";
import { Decoration } from "@codemirror/view";
import type { LanguageSupport, DecorationRange } from "./types";

// Decoration marks for JSON syntax highlighting using inline styles
// (higher specificity than Lezer parser's CSS classes)
const jsonStringMark = Decoration.mark({
  attributes: { style: "color: hsl(142.1, 76.2%, 36.3%)" },
});
const jsonPropertyMark = Decoration.mark({
  attributes: { style: "color: hsl(280, 65%, 60%)" },
});
const jsonNumberMark = Decoration.mark({
  attributes: { style: "color: hsl(217.2, 91.2%, 59.8%)" },
});
const jsonKeywordMark = Decoration.mark({
  attributes: { style: "color: hsl(280, 65%, 60%)" },
});
const templateMark = Decoration.mark({
  attributes: { style: "color: hsl(190, 70%, 50%); font-weight: 500" },
});

/**
 * Check if cursor is in a valid JSON template position.
 * Returns true if:
 * 1. Inside a string value (for string templates like "{{payload.name}}")
 * 2. In a value position after a colon but outside quotes (for number templates like {{payload.count}})
 * 3. Inside an array element position
 *
 * @internal Exported for testing
 */
export function isValidJsonTemplatePosition(text: string): boolean {
  let insideString = false;
  let inValuePosition = false;
  // Stack to track object/array nesting: 'o' for object, 'a' for array
  const nestingStack: ("o" | "a")[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : "";

    if (char === '"' && prevChar !== "\\") {
      insideString = !insideString;
    } else if (!insideString) {
      switch (char) {
        case ":": {
          inValuePosition = true;
          break;
        }
        case ",": {
          // After comma: in arrays we stay in value position, in objects we go to key position
          const currentContext = nestingStack.at(-1);
          inValuePosition = currentContext === "a";
          break;
        }
        case "{": {
          // Start of object - next is a key position, not a value
          nestingStack.push("o");
          inValuePosition = false;
          break;
        }
        case "[": {
          // Start of array - next is a value position
          nestingStack.push("a");
          inValuePosition = true;
          break;
        }
        case "}": {
          nestingStack.pop();
          inValuePosition = false;
          break;
        }
        case "]": {
          nestingStack.pop();
          inValuePosition = false;
          break;
        }
      }
    }
  }

  // Valid if inside a string OR in a value position (for bare number templates)
  return insideString || inValuePosition;
}

/**
 * Build comprehensive JSON + template decorations.
 * This uses regex-based matching to apply consistent syntax highlighting
 * that won't be confused by template expressions.
 */
function buildJsonDecorations(doc: string): DecorationRange[] {
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

  // Match property names: "key":
  const propertyRegex = /"([^"\\]|\\.)*"\s*:/g;
  while ((match = propertyRegex.exec(doc)) !== null) {
    // Only highlight the string part, not the colon
    const colonPos = match[0].lastIndexOf(":");
    ranges.push({
      from: match.index,
      to: match.index + colonPos,
      decoration: jsonPropertyMark,
    });
  }

  // Match string values (strings NOT followed by colon)
  const stringRegex = /"([^"\\]|\\.)*"/g;
  while ((match = stringRegex.exec(doc)) !== null) {
    // Check if this is a property (followed by :) - skip if so
    const afterMatch = doc.slice(match.index + match[0].length).match(/^\s*:/);
    if (!afterMatch) {
      ranges.push({
        from: match.index,
        to: match.index + match[0].length,
        decoration: jsonStringMark,
      });
    }
  }

  // Match numbers
  const numberRegex = /-?\d+\.?\d*(?:[eE][+-]?\d+)?/g;
  while ((match = numberRegex.exec(doc)) !== null) {
    // Make sure it's not inside a string or template
    const before = doc.slice(0, match.index);
    const inString = (before.match(/"/g) || []).length % 2 === 1;
    const inTemplate =
      before.lastIndexOf("{{") > before.lastIndexOf("}}") &&
      before.includes("{{");
    if (!inString && !inTemplate) {
      ranges.push({
        from: match.index,
        to: match.index + match[0].length,
        decoration: jsonNumberMark,
      });
    }
  }

  // Match keywords: true, false, null
  const keywordRegex = /\b(true|false|null)\b/g;
  while ((match = keywordRegex.exec(doc)) !== null) {
    const before = doc.slice(0, match.index);
    const inString = (before.match(/"/g) || []).length % 2 === 1;
    if (!inString) {
      ranges.push({
        from: match.index,
        to: match.index + match[0].length,
        decoration: jsonKeywordMark,
      });
    }
  }

  // Sort by position (must be in order for RangeSetBuilder)
  ranges.sort((a, b) => a.from - b.from || a.to - b.to);

  // Remove overlaps (templates take priority since they're added first)
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
 * Calculate indentation for JSON, properly handling template expressions.
 * Counts structural { and [ while ignoring {{ template braces.
 * @internal Exported for testing
 */
export function calculateJsonIndentation(
  textBefore: string,
  indentUnit: number,
): number {
  let depth = 0;
  let insideString = false;
  let i = 0;

  while (i < textBefore.length) {
    const char = textBefore[i];
    const nextChar = i < textBefore.length - 1 ? textBefore[i + 1] : "";
    const prevChar = i > 0 ? textBefore[i - 1] : "";

    // Handle string boundaries
    if (char === '"' && prevChar !== "\\") {
      insideString = !insideString;
      i++;
      continue;
    }

    if (!insideString) {
      // Skip template braces {{ and }}
      if (char === "{" && nextChar === "{") {
        i += 2;
        continue;
      }
      if (char === "}" && nextChar === "}") {
        i += 2;
        continue;
      }

      // Count structural braces
      if (char === "{" || char === "[") {
        depth++;
      } else if (char === "}" || char === "]") {
        depth = Math.max(0, depth - 1);
      }
    }

    i++;
  }

  return depth * indentUnit;
}

/**
 * JSON language support for CodeEditor with template expression handling.
 */
export const jsonLanguageSupport: LanguageSupport = {
  extension: json(),
  buildDecorations: buildJsonDecorations,
  isValidTemplatePosition: isValidJsonTemplatePosition,
  calculateIndentation: calculateJsonIndentation,
};
