/**
 * Pure utility functions for JSON parsing that don't depend on CodeMirror.
 * These are extracted to allow testing without triggering CodeMirror's module loading.
 */

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
