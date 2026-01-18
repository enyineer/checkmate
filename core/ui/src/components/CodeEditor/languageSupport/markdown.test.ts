import { describe, expect, it } from "bun:test";

import {
  isValidMarkdownTemplatePosition,
  calculateMarkdownIndentation,
} from "./markdown-utils";

describe("isValidMarkdownTemplatePosition", () => {
  describe("valid text positions", () => {
    it("returns true for plain text", () => {
      expect(isValidMarkdownTemplatePosition("Hello world")).toBe(true);
    });

    it("returns true after heading", () => {
      expect(isValidMarkdownTemplatePosition("# Title\n")).toBe(true);
    });

    it("returns true in paragraph", () => {
      expect(isValidMarkdownTemplatePosition("Some text here")).toBe(true);
    });

    it("returns true after bold text", () => {
      expect(isValidMarkdownTemplatePosition("**bold** and more")).toBe(true);
    });

    it("returns true after italic text", () => {
      expect(isValidMarkdownTemplatePosition("*italic* text")).toBe(true);
    });

    it("returns true in list item", () => {
      expect(isValidMarkdownTemplatePosition("- item text")).toBe(true);
    });

    it("returns true in numbered list item", () => {
      expect(isValidMarkdownTemplatePosition("1. first item")).toBe(true);
    });

    it("returns true in blockquote", () => {
      expect(isValidMarkdownTemplatePosition("> quote text")).toBe(true);
    });
  });

  describe("code positions (invalid)", () => {
    it("returns false inside code block", () => {
      expect(isValidMarkdownTemplatePosition("```\ncode here")).toBe(false);
    });

    it("returns false inside inline code", () => {
      expect(isValidMarkdownTemplatePosition("Here is `some code")).toBe(false);
    });

    it("returns true after closed code block", () => {
      expect(isValidMarkdownTemplatePosition("```\ncode\n```\n")).toBe(true);
    });

    it("returns true after closed inline code", () => {
      expect(isValidMarkdownTemplatePosition("Here is `code` and more")).toBe(
        true,
      );
    });

    it("returns false in code block with language", () => {
      expect(isValidMarkdownTemplatePosition("```javascript\nvar x")).toBe(
        false,
      );
    });

    it("returns true after code block with content", () => {
      expect(isValidMarkdownTemplatePosition("```js\ncode\n```\ntext")).toBe(
        true,
      );
    });
  });

  describe("edge cases", () => {
    it("returns true for empty line after heading", () => {
      expect(isValidMarkdownTemplatePosition("# Heading\n\n")).toBe(true);
    });

    it("returns true for link text", () => {
      expect(isValidMarkdownTemplatePosition("[link text")).toBe(true);
    });

    it("returns true after link", () => {
      expect(isValidMarkdownTemplatePosition("[text](url) more")).toBe(true);
    });

    it("returns false for multiple unclosed code blocks", () => {
      expect(isValidMarkdownTemplatePosition("```\n```\n```\ncode")).toBe(
        false,
      );
    });

    it("returns true for multiple closed code blocks", () => {
      expect(isValidMarkdownTemplatePosition("```\n```\n```\n```\ntext")).toBe(
        true,
      );
    });
  });
});

describe("calculateMarkdownIndentation", () => {
  const INDENT = 2;

  // ============================================================================
  // Basic indentation
  // ============================================================================
  describe("basic indentation", () => {
    it("returns 0 for empty string", () => {
      expect(calculateMarkdownIndentation("", INDENT)).toBe(0);
    });

    it("returns 0 for simple text", () => {
      expect(calculateMarkdownIndentation("Hello world", INDENT)).toBe(0);
    });

    it("returns 0 after heading", () => {
      expect(calculateMarkdownIndentation("# Heading\n", INDENT)).toBe(0);
    });

    it("returns 0 after paragraph", () => {
      expect(calculateMarkdownIndentation("Some text.\n", INDENT)).toBe(0);
    });
  });

  // ============================================================================
  // List indentation
  // ============================================================================
  describe("list indentation", () => {
    it("maintains list indentation after list item", () => {
      expect(calculateMarkdownIndentation("- item\n", INDENT)).toBe(0);
    });

    it("maintains nested list indentation", () => {
      expect(calculateMarkdownIndentation("  - nested item\n", INDENT)).toBe(2);
    });

    it("handles numbered list", () => {
      expect(calculateMarkdownIndentation("1. item\n", INDENT)).toBe(0);
    });

    it("handles deeply nested list", () => {
      const text = `- item
  - nested
    - deep\n`;
      expect(calculateMarkdownIndentation(text, INDENT)).toBe(4);
    });
  });

  // ============================================================================
  // Template handling
  // ============================================================================
  describe("template handling", () => {
    it("handles templates in text", () => {
      expect(calculateMarkdownIndentation("Hello {{name}}", INDENT)).toBe(0);
    });

    it("handles templates in list items", () => {
      expect(calculateMarkdownIndentation("- {{item}}\n", INDENT)).toBe(0);
    });

    it("handles templates in headings", () => {
      expect(calculateMarkdownIndentation("# {{title}}\n", INDENT)).toBe(0);
    });
  });

  // ============================================================================
  // Code block indentation
  // ============================================================================
  describe("code block indentation", () => {
    it("returns 0 after code block start", () => {
      expect(calculateMarkdownIndentation("```\n", INDENT)).toBe(0);
    });

    it("returns 0 inside code block", () => {
      expect(calculateMarkdownIndentation("```\ncode line\n", INDENT)).toBe(0);
    });

    it("returns 0 after code block end", () => {
      expect(calculateMarkdownIndentation("```\ncode\n```\n", INDENT)).toBe(0);
    });
  });

  // ============================================================================
  // Edge cases
  // ============================================================================
  describe("edge cases", () => {
    it("handles only newline", () => {
      expect(calculateMarkdownIndentation("\n", INDENT)).toBe(0);
    });

    it("handles multiple newlines", () => {
      expect(calculateMarkdownIndentation("\n\n\n", INDENT)).toBe(0);
    });

    it("handles blockquote", () => {
      expect(calculateMarkdownIndentation("> quote\n", INDENT)).toBe(0);
    });

    it("handles horizontal rule", () => {
      expect(calculateMarkdownIndentation("---\n", INDENT)).toBe(0);
    });

    it("handles table row", () => {
      expect(calculateMarkdownIndentation("| col1 | col2 |\n", INDENT)).toBe(0);
    });
  });

  // ============================================================================
  // Real-world document structures
  // ============================================================================
  describe("real-world document structures", () => {
    it("handles README-style document", () => {
      const text = `# Project

Some description.

## Features

- Feature 1
- Feature 2\n`;
      expect(calculateMarkdownIndentation(text, INDENT)).toBe(0);
    });

    it("handles nested list structure", () => {
      const text = `## Tasks

- Task 1
  - Subtask A
  - Subtask B\n`;
      expect(calculateMarkdownIndentation(text, INDENT)).toBe(2);
    });

    it("handles code example in docs", () => {
      const text = `## Usage

\`\`\`javascript
const x = 1;
\`\`\`

More text\n`;
      expect(calculateMarkdownIndentation(text, INDENT)).toBe(0);
    });
  });
});
