import { describe, expect, it } from "bun:test";

import { isValidXmlTemplatePosition, calculateXmlIndentation } from "./xml";

describe("isValidXmlTemplatePosition", () => {
  describe("text content positions", () => {
    it("returns true in text between tags", () => {
      expect(isValidXmlTemplatePosition("<tag>hello")).toBe(true);
    });

    it("returns true after opening tag on new line", () => {
      expect(isValidXmlTemplatePosition("<tag>\n  ")).toBe(true);
    });

    it("returns true in text with existing template", () => {
      expect(isValidXmlTemplatePosition("<tag>hello {{name}}")).toBe(true);
    });

    it("returns true in empty text position", () => {
      expect(isValidXmlTemplatePosition("<tag>")).toBe(true);
    });
  });

  describe("attribute value positions", () => {
    it("returns true inside double-quoted attribute value", () => {
      expect(isValidXmlTemplatePosition('<tag attr="')).toBe(true);
    });

    it("returns true inside single-quoted attribute value", () => {
      expect(isValidXmlTemplatePosition("<tag attr='")).toBe(true);
    });

    it("returns true in middle of attribute value", () => {
      expect(isValidXmlTemplatePosition('<tag attr="hello')).toBe(true);
    });

    it("returns true in attribute with template", () => {
      expect(isValidXmlTemplatePosition('<tag attr="{{name}}')).toBe(true);
    });
  });

  describe("invalid positions", () => {
    it("returns false inside tag name", () => {
      expect(isValidXmlTemplatePosition("<ta")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidXmlTemplatePosition("")).toBe(false);
    });

    it("returns false in attribute name position", () => {
      expect(isValidXmlTemplatePosition("<tag at")).toBe(false);
    });

    it("returns false right after opening bracket", () => {
      expect(isValidXmlTemplatePosition("<")).toBe(false);
    });
  });

  describe("complex nested structures", () => {
    it("returns true in nested tag text content", () => {
      expect(isValidXmlTemplatePosition("<root><child>text")).toBe(true);
    });

    it("returns true in deeply nested text", () => {
      expect(isValidXmlTemplatePosition("<a><b><c>")).toBe(true);
    });

    it("returns true after self-closing tag", () => {
      expect(isValidXmlTemplatePosition("<root><self/>text")).toBe(true);
    });
  });
});

describe("calculateXmlIndentation", () => {
  const INDENT = 2;

  // ============================================================================
  // Basic tag indentation
  // ============================================================================
  describe("basic tag indentation", () => {
    it("returns 0 for empty document", () => {
      expect(calculateXmlIndentation("", INDENT)).toBe(0);
    });

    it("indents after opening tag (new line)", () => {
      // User typed "<root>" and pressed Enter
      expect(calculateXmlIndentation("<root>\n", INDENT)).toBe(INDENT);
    });

    it("indents when inside an unclosed opening tag", () => {
      // After an opening tag, depth is 1 even on same line
      expect(calculateXmlIndentation("<root>", INDENT)).toBe(INDENT);
    });

    it("returns 0 after self-closing tag", () => {
      expect(calculateXmlIndentation("<self/>\n", INDENT)).toBe(0);
    });

    it("returns 0 after closing tag", () => {
      expect(calculateXmlIndentation("</root>\n", INDENT)).toBe(0);
    });

    it("returns 0 after complete open-close on same line", () => {
      expect(calculateXmlIndentation("<tag></tag>\n", INDENT)).toBe(0);
    });
  });

  // ============================================================================
  // Nested structure indentation
  // ============================================================================
  describe("nested structure indentation", () => {
    it("indents to level 2 after nested opening tag", () => {
      const text = `<root>
  <child>\n`;
      expect(calculateXmlIndentation(text, INDENT)).toBe(2 * INDENT);
    });

    it("maintains level 1 after nested closing tag", () => {
      const text = `<root>
  <child></child>\n`;
      expect(calculateXmlIndentation(text, INDENT)).toBe(INDENT);
    });

    it("indents to level 3 for deep nesting", () => {
      const text = `<root>
  <a>
    <b>\n`;
      expect(calculateXmlIndentation(text, INDENT)).toBe(3 * INDENT);
    });

    it("handles mixed self-closing and regular tags", () => {
      const text = `<root>
  <self/>
  <child>\n`;
      expect(calculateXmlIndentation(text, INDENT)).toBe(2 * INDENT);
    });
  });

  // ============================================================================
  // Template handling (no interference with structure)
  // ============================================================================
  describe("template handling", () => {
    it("counts depth correctly with template in text content", () => {
      // Template doesn't affect tag depth counting
      expect(calculateXmlIndentation("<tag>{{value}}", INDENT)).toBe(INDENT);
    });

    it("indents after tag even with template content", () => {
      expect(calculateXmlIndentation("<tag>\n  {{value}}\n", INDENT)).toBe(
        INDENT,
      );
    });

    it("handles template in attribute value", () => {
      expect(calculateXmlIndentation('<tag attr="{{value}}">\n', INDENT)).toBe(
        INDENT,
      );
    });

    it("handles multiple templates", () => {
      const text = `<root>
  <a>{{val1}}</a>
  <b>{{val2}}</b>\n`;
      expect(calculateXmlIndentation(text, INDENT)).toBe(INDENT);
    });
  });

  // ============================================================================
  // Edge cases
  // ============================================================================
  describe("edge cases", () => {
    it("handles only newline", () => {
      expect(calculateXmlIndentation("\n", INDENT)).toBe(0);
    });

    it("handles multiple newlines", () => {
      expect(calculateXmlIndentation("\n\n\n", INDENT)).toBe(0);
    });

    it("handles XML declaration", () => {
      expect(calculateXmlIndentation('<?xml version="1.0"?>\n', INDENT)).toBe(
        0,
      );
    });

    it("handles tag with attributes", () => {
      expect(calculateXmlIndentation('<tag attr="value">\n', INDENT)).toBe(
        INDENT,
      );
    });

    it("handles tag with multiple attributes", () => {
      expect(calculateXmlIndentation('<tag a="1" b="2" c="3">\n', INDENT)).toBe(
        INDENT,
      );
    });

    it("handles CDATA section (counts parent tag)", () => {
      // CDATA is inside an unclosed tag
      expect(calculateXmlIndentation("<tag><![CDATA[", INDENT)).toBe(INDENT);
    });

    it("handles comments", () => {
      expect(calculateXmlIndentation("<!-- comment -->\n", INDENT)).toBe(0);
    });
  });

  // ============================================================================
  // Real-world document structures
  // ============================================================================
  describe("real-world document structures", () => {
    it("indents HTML-like structure", () => {
      const text = `<html>
  <head>
    <title>Test</title>
  </head>
  <body>\n`;
      expect(calculateXmlIndentation(text, INDENT)).toBe(2 * INDENT);
    });

    it("handles configuration-style XML", () => {
      const text = `<config>
  <database>
    <host>\n`;
      expect(calculateXmlIndentation(text, INDENT)).toBe(3 * INDENT);
    });

    it("handles SOAP-style envelope", () => {
      const text = `<soap:Envelope>
  <soap:Body>
    <Request>\n`;
      expect(calculateXmlIndentation(text, INDENT)).toBe(3 * INDENT);
    });
  });
});
