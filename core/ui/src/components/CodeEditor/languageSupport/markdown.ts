import { markdown } from "@codemirror/lang-markdown";
import { Decoration } from "@codemirror/view";
import type { LanguageSupport, DecorationRange } from "./types";

// Decoration marks for Markdown syntax highlighting using inline styles
const mdHeadingMark = Decoration.mark({
  attributes: { style: "color: hsl(280, 65%, 60%); font-weight: bold" },
});
const mdBoldMark = Decoration.mark({
  attributes: { style: "font-weight: bold" },
});
const mdItalicMark = Decoration.mark({
  attributes: { style: "font-style: italic" },
});
const mdCodeMark = Decoration.mark({
  attributes: {
    style:
      "color: hsl(142.1, 76.2%, 36.3%); background: hsla(0, 0%, 50%, 0.1); border-radius: 3px; padding: 0 2px",
  },
});
const mdLinkMark = Decoration.mark({
  attributes: { style: "color: hsl(217.2, 91.2%, 59.8%)" },
});
const templateMark = Decoration.mark({
  attributes: { style: "color: hsl(190, 70%, 50%); font-weight: 500" },
});

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
 * Build Markdown + template decorations.
 */
function buildMarkdownDecorations(doc: string): DecorationRange[] {
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

  // Match headings (# ... or ## ... etc.)
  const headingRegex = /^(#{1,6})\s+.+$/gm;
  while ((match = headingRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].length,
      decoration: mdHeadingMark,
    });
  }

  // Match bold (**text** or __text__)
  const boldRegex = /(\*\*|__)(?!\s)(.+?)(?<!\s)\1/g;
  while ((match = boldRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].length,
      decoration: mdBoldMark,
    });
  }

  // Match italic (*text* or _text_) - but not **
  const italicRegex = /(?<!\*|\w)(\*|_)(?!\*|\s)(.+?)(?<!\s|\*)\1(?!\*|\w)/g;
  while ((match = italicRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].length,
      decoration: mdItalicMark,
    });
  }

  // Match inline code (`code`)
  const codeRegex = /`[^`\n]+`/g;
  while ((match = codeRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].length,
      decoration: mdCodeMark,
    });
  }

  // Match links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = linkRegex.exec(doc)) !== null) {
    ranges.push({
      from: match.index,
      to: match.index + match[0].length,
      decoration: mdLinkMark,
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

/**
 * Markdown language support for CodeEditor with template expression handling.
 */
export const markdownLanguageSupport: LanguageSupport = {
  extension: markdown(),
  buildDecorations: buildMarkdownDecorations,
  isValidTemplatePosition: isValidMarkdownTemplatePosition,
  calculateIndentation: calculateMarkdownIndentation,
};
