/**
 * Template utilities for Monaco Editor
 * Handles detection and position tracking of {{...}} template syntax
 */

/**
 * Information about an unclosed template at the cursor
 */
export interface OpenTemplateContext {
  /** Whether we're inside an unclosed {{ */
  isInTemplate: boolean;
  /** The text typed after {{ */
  query: string;
  /** The offset where {{ starts */
  startOffset: number;
  /** The line number where {{ is (1-indexed) */
  lineNumber: number;
  /** The column where {{ starts (1-indexed) */
  startColumn: number;
}

/**
 * Detect if cursor is inside an unclosed {{ template context
 */
export function detectOpenTemplate({
  content,
  cursorOffset,
}: {
  content: string;
  cursorOffset: number;
}): OpenTemplateContext {
  const textBefore = content.slice(0, cursorOffset);
  const lastOpen = textBefore.lastIndexOf("{{");
  const lastClose = textBefore.lastIndexOf("}}");

  if (lastOpen === -1 || lastOpen <= lastClose) {
    return {
      isInTemplate: false,
      query: "",
      startOffset: -1,
      lineNumber: 0,
      startColumn: 0,
    };
  }

  const query = textBefore.slice(lastOpen + 2);

  // Calculate line number and column
  const beforeTemplate = content.slice(0, lastOpen);
  const lines = beforeTemplate.split("\n");
  const lineNumber = lines.length;
  const startColumn = (lines.at(-1)?.length ?? 0) + 1;

  return {
    isInTemplate: true,
    query,
    startOffset: lastOpen,
    lineNumber,
    startColumn,
  };
}

/**
 * Check if there are auto-closed braces after the cursor
 */
export function detectAutoClosedBraces({
  content,
  cursorOffset,
}: {
  content: string;
  cursorOffset: number;
}): number {
  const textAfter = content.slice(cursorOffset);
  if (textAfter.startsWith("}}")) {
    return 2;
  }
  if (textAfter.startsWith("}")) {
    return 1;
  }
  return 0;
}
