/**
 * Utilities for CodeEditor Enter key behavior.
 * Extracted for testability.
 */

/**
 * Check if the cursor position is between matching brackets or tags.
 * Used to determine if Enter should "split" the brackets/tags.
 *
 * @param textBefore - Text before the cursor position
 * @param textAfter - Text after the cursor position
 * @returns true if cursor is between matching brackets/tags
 *
 * @example
 * // Returns true for:
 * // {|} - cursor between curly braces
 * // [|] - cursor between square brackets
 * // <tag>|</tag> - cursor between opening and closing tags
 */
export function isBetweenBrackets(
  textBefore: string,
  textAfter: string,
): boolean {
  const charBefore = textBefore.slice(-1);
  const charAfter = textAfter.charAt(0);

  return (
    // Curly braces: {|}
    (charBefore === "{" && charAfter === "}") ||
    // Square brackets: [|]
    (charBefore === "[" && charAfter === "]") ||
    // XML/HTML tags: <tag>|</tag>
    (charBefore === ">" && charAfter === "<" && textAfter.startsWith("</"))
  );
}
