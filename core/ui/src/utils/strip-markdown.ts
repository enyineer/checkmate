/**
 * Strip markdown formatting to plain text.
 *
 * A lightweight client-side utility for displaying markdown content as plain text.
 * This is a simplified version that handles common markdown syntax.
 */
export function stripMarkdown(markdown: string): string {
  let result = markdown;

  // Remove bold: **text** or __text__
  result = result.replaceAll(/\*\*(.+?)\*\*/g, "$1");
  result = result.replaceAll(/__(.+?)__/g, "$1");

  // Remove italic: *text* or _text_ (but not if it's part of bold)
  result = result.replaceAll(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");
  result = result.replaceAll(/(?<!_)_([^_]+)_(?!_)/g, "$1");

  // Remove strikethrough: ~~text~~
  result = result.replaceAll(/~~(.+?)~~/g, "$1");

  // Remove links: [text](url) -> text
  result = result.replaceAll(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove inline code: `code` -> code
  result = result.replaceAll(/`([^`]+)`/g, "$1");

  // Remove code blocks (simple version)
  result = result.replaceAll(/```[\s\S]*?```/g, "");

  // Remove headers: # text -> text
  result = result.replaceAll(/^#+\s*/gm, "");

  // Remove blockquotes: > text -> text
  result = result.replaceAll(/^>\s*/gm, "");

  // Remove horizontal rules
  result = result.replaceAll(/^---+$/gm, "");
  result = result.replaceAll(/^\*\*\*+$/gm, "");

  // Collapse multiple whitespace
  result = result.replaceAll(/\n\s*\n/g, "\n").trim();

  return result;
}
