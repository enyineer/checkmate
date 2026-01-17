import { describe, expect, it } from "bun:test";

import { isValidYamlTemplatePosition, calculateYamlIndentation } from "./yaml";

describe("isValidYamlTemplatePosition", () => {
  describe("value positions", () => {
    it("returns true after 'key: '", () => {
      expect(isValidYamlTemplatePosition("name: ")).toBe(true);
    });

    it("returns true after 'key: ' with existing value", () => {
      expect(isValidYamlTemplatePosition("name: hello")).toBe(true);
    });

    it("returns true in list item position", () => {
      expect(isValidYamlTemplatePosition("- ")).toBe(true);
    });

    it("returns true inside double-quoted string", () => {
      expect(isValidYamlTemplatePosition('name: "hello')).toBe(true);
    });

    it("returns true inside single-quoted string", () => {
      expect(isValidYamlTemplatePosition("name: 'hello")).toBe(true);
    });
  });

  describe("invalid positions", () => {
    it("returns false for key position", () => {
      expect(isValidYamlTemplatePosition("name")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidYamlTemplatePosition("")).toBe(false);
    });
  });
});

describe("calculateYamlIndentation", () => {
  const INDENT = 2;

  // ============================================================================
  // Basic YAML key:value patterns
  // ============================================================================
  describe("basic key:value indentation", () => {
    it("returns 0 for empty document", () => {
      expect(calculateYamlIndentation("", INDENT)).toBe(0);
    });

    it("indents after key ending with colon (new line)", () => {
      // User typed "test:" and pressed Enter
      // textBefore = "test:\n" (cursor at start of empty new line)
      expect(calculateYamlIndentation("test:\n", INDENT)).toBe(INDENT);
    });

    it("indents after key with trailing whitespace", () => {
      expect(calculateYamlIndentation("test:   \n", INDENT)).toBe(INDENT);
    });

    it("maintains 0 indent for same-line content after key", () => {
      // User is typing on the line "test:" without pressing Enter
      expect(calculateYamlIndentation("test:", INDENT)).toBe(0);
    });

    it("maintains 0 indent for key:value on same line", () => {
      expect(calculateYamlIndentation("test: value", INDENT)).toBe(0);
    });
  });

  // ============================================================================
  // Nested object indentation
  // ============================================================================
  describe("nested object indentation", () => {
    it("indents to level 2 after nested key", () => {
      const text = `parent:
  child:\n`;
      expect(calculateYamlIndentation(text, INDENT)).toBe(2 * INDENT);
    });

    it("maintains level 1 after nested key:value", () => {
      const text = `parent:
  child: value\n`;
      expect(calculateYamlIndentation(text, INDENT)).toBe(INDENT);
    });

    it("indents to level 3 for deep nesting", () => {
      const text = `level1:
  level2:
    level3:\n`;
      expect(calculateYamlIndentation(text, INDENT)).toBe(3 * INDENT);
    });

    it("returns to level 1 after deep nesting with value", () => {
      const text = `level1:
  level2:
    level3: value\n`;
      expect(calculateYamlIndentation(text, INDENT)).toBe(2 * INDENT);
    });
  });

  // ============================================================================
  // List item indentation
  // ============================================================================
  describe("list item indentation", () => {
    it("indents after list item", () => {
      expect(calculateYamlIndentation("- item\n", INDENT)).toBe(INDENT);
    });

    it("indents after list item with nested key", () => {
      const text = `items:
  - name: test\n`;
      expect(calculateYamlIndentation(text, INDENT)).toBe(2 * INDENT);
    });

    it("indents after empty list marker", () => {
      expect(calculateYamlIndentation("-\n", INDENT)).toBe(INDENT);
    });

    it("handles list with object items", () => {
      const text = `items:
  - name: test
    value: 123\n`;
      expect(calculateYamlIndentation(text, INDENT)).toBe(2 * INDENT);
    });
  });

  // ============================================================================
  // Template handling (no interference with structure)
  // ============================================================================
  describe("template handling", () => {
    it("maintains indentation with template value on same line", () => {
      expect(calculateYamlIndentation("name: {{value}}", INDENT)).toBe(0);
    });

    it("indents after key even when value contains template", () => {
      expect(calculateYamlIndentation("name: {{value}}\n", INDENT)).toBe(0);
    });

    it("maintains nesting with template in nested value", () => {
      const text = `parent:
  child: {{value}}\n`;
      expect(calculateYamlIndentation(text, INDENT)).toBe(INDENT);
    });

    it("indents after key with template but ending with colon", () => {
      const text = `parent:
  child:\n`;
      expect(calculateYamlIndentation(text, INDENT)).toBe(2 * INDENT);
    });
  });

  // ============================================================================
  // Multi-line string handling
  // ============================================================================
  describe("multi-line scenarios", () => {
    it("maintains current indent after blank line", () => {
      const text = `parent:
  child: value

`;
      expect(calculateYamlIndentation(text, INDENT)).toBe(INDENT);
    });

    it("handles multiple blank lines", () => {
      const text = `parent:
  child: value


`;
      expect(calculateYamlIndentation(text, INDENT)).toBe(INDENT);
    });
  });

  // ============================================================================
  // Edge cases
  // ============================================================================
  describe("edge cases", () => {
    it("handles only newline", () => {
      expect(calculateYamlIndentation("\n", INDENT)).toBe(0);
    });

    it("handles multiple newlines only", () => {
      expect(calculateYamlIndentation("\n\n\n", INDENT)).toBe(0);
    });

    it("handles colon in string value", () => {
      expect(
        calculateYamlIndentation('url: "http://example.com"\n', INDENT),
      ).toBe(0);
    });

    it("handles key with numbers", () => {
      expect(calculateYamlIndentation("key123:\n", INDENT)).toBe(INDENT);
    });

    it("handles key with hyphens", () => {
      expect(calculateYamlIndentation("my-key:\n", INDENT)).toBe(INDENT);
    });
  });
});
