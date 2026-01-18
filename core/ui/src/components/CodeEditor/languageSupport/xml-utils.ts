/**
 * Pure utility functions for XML parsing that don't depend on CodeMirror.
 * These are extracted to allow testing without triggering CodeMirror's module loading.
 */

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
