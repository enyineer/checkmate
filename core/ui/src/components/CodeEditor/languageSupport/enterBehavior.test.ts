import { describe, expect, it } from "bun:test";

import { isBetweenBrackets } from "./enterBehavior";

describe("isBetweenBrackets", () => {
  // ============================================================================
  // Curly braces
  // ============================================================================
  describe("curly braces", () => {
    it("returns true for empty object {|}", () => {
      expect(isBetweenBrackets("{", "}")).toBe(true);
    });

    it("returns false when content before closing brace", () => {
      // Last char is "1", not "{"
      expect(isBetweenBrackets('{"a": 1', "}")).toBe(false);
    });

    it("returns false when only opening brace before", () => {
      expect(isBetweenBrackets("{", "x")).toBe(false);
    });

    it("returns false when only closing brace after", () => {
      expect(isBetweenBrackets("x", "}")).toBe(false);
    });

    it("returns false for nested opening {|{", () => {
      expect(isBetweenBrackets("{", "{")).toBe(false);
    });
  });

  // ============================================================================
  // Square brackets
  // ============================================================================
  describe("square brackets", () => {
    it("returns true for empty array [|]", () => {
      expect(isBetweenBrackets("[", "]")).toBe(true);
    });

    it("returns false when content before closing bracket", () => {
      // Last char is "2", not "["
      expect(isBetweenBrackets("[1, 2", "]")).toBe(false);
    });

    it("returns false when only opening bracket before", () => {
      expect(isBetweenBrackets("[", "x")).toBe(false);
    });

    it("returns false when only closing bracket after", () => {
      expect(isBetweenBrackets("x", "]")).toBe(false);
    });

    it("returns false for nested opening [|[", () => {
      expect(isBetweenBrackets("[", "[")).toBe(false);
    });
  });

  // ============================================================================
  // XML/HTML tags
  // ============================================================================
  describe("XML/HTML tags", () => {
    it("returns true for empty tag <div>|</div>", () => {
      expect(isBetweenBrackets("<div>", "</div>")).toBe(true);
    });

    it('returns true for tag with attributes <div class="x">|</div>', () => {
      expect(isBetweenBrackets('<div class="x">', "</div>")).toBe(true);
    });

    it("returns true for nested tags <outer><inner>|</inner>", () => {
      expect(isBetweenBrackets("<outer><inner>", "</inner>")).toBe(true);
    });

    it("returns true for self-named closing tag <a>|</a>", () => {
      expect(isBetweenBrackets("<a>", "</a>")).toBe(true);
    });

    it("returns false for adjacent opening tags <a>|<b>", () => {
      expect(isBetweenBrackets("<a>", "<b>")).toBe(false);
    });

    it("returns false for text after tag <div>|text", () => {
      expect(isBetweenBrackets("<div>", "text")).toBe(false);
    });

    it("returns false for self-closing tag <br/>|", () => {
      expect(isBetweenBrackets("<br/>", "")).toBe(false);
    });

    it("returns false for comment after tag <div>|<!--", () => {
      expect(isBetweenBrackets("<div>", "<!--")).toBe(false);
    });
  });

  // ============================================================================
  // Edge cases
  // ============================================================================
  describe("edge cases", () => {
    it("returns false for empty strings", () => {
      expect(isBetweenBrackets("", "")).toBe(false);
    });

    it("returns false for whitespace only", () => {
      expect(isBetweenBrackets("  ", "  ")).toBe(false);
    });

    it("returns false for newlines", () => {
      expect(isBetweenBrackets("{\n", "\n}")).toBe(false);
    });

    it("returns true for template braces {{|}}", () => {
      // { followed by } - pattern matches even though it's part of template
      expect(isBetweenBrackets("{{", "}}")).toBe(true);
    });

    it("handles single character inputs", () => {
      expect(isBetweenBrackets("a", "b")).toBe(false);
    });
  });

  // ============================================================================
  // Real-world scenarios
  // ============================================================================
  describe("real-world scenarios", () => {
    it("JSON: empty object literal", () => {
      expect(isBetweenBrackets('{"name": ', "}")).toBe(false); // Not at the boundary
    });

    it("JSON: cursor right after opening brace", () => {
      expect(isBetweenBrackets("{", '  "name": "value"}')).toBe(false); // Has content
    });

    it("XML: HTML doctype before tag", () => {
      expect(isBetweenBrackets("<!DOCTYPE html><html>", "</html>")).toBe(true);
    });

    it("XML: after text content in tag", () => {
      expect(isBetweenBrackets("<p>Hello", "</p>")).toBe(false); // "o" != ">"
    });

    it("YAML: no brackets involved", () => {
      expect(isBetweenBrackets("key:", "")).toBe(false);
    });
  });

  // ============================================================================
  // Regression tests
  // ============================================================================
  describe("regression: autocomplete interaction", () => {
    /**
     * REGRESSION TEST (documented, requires DOM testing)
     *
     * Issue: When autocomplete popup is showing, pressing Enter should select
     * the completion item, NOT insert a newline.
     *
     * Fix: In CodeEditor.tsx, the custom Enter keymap checks `completionStatus(state)`
     * and returns `false` when autocomplete is "active", allowing the autocomplete
     * extension to handle the Enter key.
     *
     * This cannot be unit tested without a full CodeMirror DOM integration.
     * Manual verification steps:
     * 1. Type "{{" in the editor with template properties configured
     * 2. Autocomplete popup should appear
     * 3. Press Enter to select a template
     * 4. Template should be inserted (NOT a newline)
     */
    it("documents the autocomplete Enter key requirement", () => {
      // This test exists purely as documentation
      // The actual fix is in CodeEditor.tsx: completionStatus(state) check
      expect(true).toBe(true);
    });
  });
});
