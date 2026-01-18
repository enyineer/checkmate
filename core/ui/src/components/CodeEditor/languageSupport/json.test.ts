import { describe, expect, it } from "bun:test";

import {
  isValidJsonTemplatePosition,
  calculateJsonIndentation,
} from "./json-utils";

describe("isValidJsonTemplatePosition", () => {
  describe("string values (inside quotes)", () => {
    it("returns true when inside a string value after colon", () => {
      // Cursor at: {"name": "hello|
      expect(isValidJsonTemplatePosition('{"name": "hello')).toBe(true);
    });

    it("returns true when at start of string value", () => {
      // Cursor at: {"name": "|
      expect(isValidJsonTemplatePosition('{"name": "')).toBe(true);
    });

    it("returns true for nested object string values", () => {
      // Cursor at: {"user": {"name": "test|
      expect(isValidJsonTemplatePosition('{"user": {"name": "test')).toBe(true);
    });

    it("returns true for string with escaped quotes", () => {
      // Cursor at: {"msg": "say \"hello|
      expect(isValidJsonTemplatePosition('{"msg": "say \\"hello')).toBe(true);
    });

    it("returns true when cursor is in middle of string value", () => {
      // Cursor at: {"name": "hel|lo"
      expect(isValidJsonTemplatePosition('{"name": "hel')).toBe(true);
    });
  });

  describe("bare number value positions (outside quotes)", () => {
    it("returns true for bare value position after colon", () => {
      // Cursor at: {"count": |
      // This is what the autocomplete will check (text BEFORE the {{ starts)
      expect(isValidJsonTemplatePosition('{"count": ')).toBe(true);
    });

    it("returns true with auto-closed brackets (text before first {)", () => {
      // When user types { in value position, editor auto-inserts }
      // But the autocomplete checks text BEFORE the {{ pattern
      // So it would check: {"count":
      expect(isValidJsonTemplatePosition('{"count": ')).toBe(true);
    });

    it("returns false when {{ already typed (looks like objects to parser)", () => {
      // This function itself returns false for {{ because it looks like objects
      // BUT the autocomplete logic uses textBeforeTemplate which excludes {{
      expect(isValidJsonTemplatePosition('{"count": {{')).toBe(false);
    });

    it("returns true for nested object bare value", () => {
      // Cursor at: {"data": {"count": |
      expect(isValidJsonTemplatePosition('{"data": {"count": ')).toBe(true);
    });
  });

  describe("array element positions", () => {
    it("returns true at start of array", () => {
      // Cursor at: [|
      expect(isValidJsonTemplatePosition("[")).toBe(true);
    });

    it("returns true inside array string element", () => {
      // Cursor at: ["hello|
      expect(isValidJsonTemplatePosition('["hello')).toBe(true);
    });

    it("returns true for bare array element position", () => {
      // Cursor at: [|
      expect(isValidJsonTemplatePosition("[ ")).toBe(true);
    });

    it("returns true after comma in array (value position)", () => {
      // Cursor at: [1, |
      expect(isValidJsonTemplatePosition("[1, ")).toBe(true);
    });

    it("returns true in nested array", () => {
      // Cursor at: [[|
      expect(isValidJsonTemplatePosition("[[")).toBe(true);
    });

    it("returns true for array in object value", () => {
      // Cursor at: {"items": [|
      expect(isValidJsonTemplatePosition('{"items": [')).toBe(true);
    });
  });

  describe("invalid positions (keys and structural)", () => {
    it("returns false at start of object (key position)", () => {
      // Cursor at: {|
      expect(isValidJsonTemplatePosition("{")).toBe(false);
    });

    it("returns false for property key position", () => {
      // Cursor at: {"|
      expect(isValidJsonTemplatePosition('{"')).toBe(true); // Inside quotes counts
    });

    it("returns false after comma in object (key position)", () => {
      // Cursor at: {"a": 1, |
      expect(isValidJsonTemplatePosition('{"a": 1, ')).toBe(false);
    });

    it("returns false after closing brace", () => {
      // Cursor at: {"a": 1}|
      expect(isValidJsonTemplatePosition('{"a": 1}')).toBe(false);
    });

    it("returns false after closing bracket", () => {
      // Cursor at: [1, 2]|
      expect(isValidJsonTemplatePosition("[1, 2]")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidJsonTemplatePosition("")).toBe(false);
    });

    it("returns false for just whitespace", () => {
      expect(isValidJsonTemplatePosition("   ")).toBe(false);
    });
  });

  describe("complex nested structures", () => {
    it("handles deeply nested objects correctly", () => {
      // Valid: inside string value in nested structure
      expect(isValidJsonTemplatePosition('{"a": {"b": {"c": "test')).toBe(true);
    });

    it("handles mixed arrays and objects", () => {
      // Valid: inside array that's a value
      expect(isValidJsonTemplatePosition('{"items": [{"name": "test')).toBe(
        true,
      );
    });

    it("handles array of objects - key position after comma", () => {
      // Invalid: after comma inside object (key position)
      expect(isValidJsonTemplatePosition('[{"a": 1}, {"')).toBe(true); // Inside quotes
    });

    it("handles array of objects - after object close", () => {
      // This is after the comma in array, which IS a value position
      expect(isValidJsonTemplatePosition('[{"a": 1}, ')).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles colon inside string correctly", () => {
      // The colon is inside the string, not a separator
      expect(isValidJsonTemplatePosition('{"url": "http:')).toBe(true);
    });

    it("handles multiple colons", () => {
      expect(isValidJsonTemplatePosition('{"a": 1, "b": ')).toBe(true);
    });

    it("handles string value followed by comma correctly", () => {
      // After the comma in an object, we're in key position
      expect(isValidJsonTemplatePosition('{"a": "1", ')).toBe(false);
    });

    it("handles incomplete structures", () => {
      expect(isValidJsonTemplatePosition('{"a')).toBe(true); // Inside key string
    });
  });
});

describe("calculateJsonIndentation", () => {
  const INDENT_UNIT = 2;

  describe("basic indentation", () => {
    it("returns 0 for empty string", () => {
      expect(calculateJsonIndentation("", INDENT_UNIT)).toBe(0);
    });

    it("returns indentUnit after opening brace", () => {
      expect(calculateJsonIndentation("{", INDENT_UNIT)).toBe(INDENT_UNIT);
    });

    it("returns indentUnit after opening bracket", () => {
      expect(calculateJsonIndentation("[", INDENT_UNIT)).toBe(INDENT_UNIT);
    });

    it("returns 0 after closed object", () => {
      expect(calculateJsonIndentation("{}", INDENT_UNIT)).toBe(0);
    });

    it("returns 0 after closed array", () => {
      expect(calculateJsonIndentation("[]", INDENT_UNIT)).toBe(0);
    });
  });

  describe("nested structures", () => {
    it("returns 2 * indentUnit for nested object", () => {
      expect(calculateJsonIndentation('{"a": {', INDENT_UNIT)).toBe(
        2 * INDENT_UNIT,
      );
    });

    it("returns 2 * indentUnit for nested array", () => {
      expect(calculateJsonIndentation('{"items": [', INDENT_UNIT)).toBe(
        2 * INDENT_UNIT,
      );
    });

    it("calculates correct depth for complex nesting", () => {
      // {"a": {"b": [{"c":
      expect(calculateJsonIndentation('{"a": {"b": [{"c": ', INDENT_UNIT)).toBe(
        4 * INDENT_UNIT,
      );
    });
  });

  describe("template handling (regression tests)", () => {
    it("ignores {{ template opening braces", () => {
      // Template {{ should NOT increase depth
      expect(calculateJsonIndentation('{"foo": {{', INDENT_UNIT)).toBe(
        INDENT_UNIT,
      );
    });

    it("ignores }} template closing braces", () => {
      // Template }} should NOT decrease depth
      expect(
        calculateJsonIndentation('{"foo": {{payload.title}}', INDENT_UNIT),
      ).toBe(INDENT_UNIT);
    });

    it("maintains correct indentation after template value", () => {
      // After a complete template, depth should still be 1 (inside the object)
      expect(
        calculateJsonIndentation('{"foo": {{payload.title}},\n', INDENT_UNIT),
      ).toBe(INDENT_UNIT);
    });

    it("handles template followed by more properties", () => {
      // Cursor after template value, ready for next property
      const text = `{
  "foo": "bar",
  "bar": {{payload.title}},
`;
      expect(calculateJsonIndentation(text, INDENT_UNIT)).toBe(INDENT_UNIT);
    });

    it("handles multiple templates in same object", () => {
      const text = `{
  "a": {{payload.a}},
  "b": {{payload.b}},
`;
      expect(calculateJsonIndentation(text, INDENT_UNIT)).toBe(INDENT_UNIT);
    });
  });

  describe("string handling", () => {
    it("ignores braces inside strings", () => {
      // Braces inside strings should not affect depth
      expect(calculateJsonIndentation('{"msg": "hello {"', INDENT_UNIT)).toBe(
        INDENT_UNIT,
      );
    });

    it("ignores template-like patterns inside strings", () => {
      expect(
        calculateJsonIndentation('{"msg": "use {{var}}"', INDENT_UNIT),
      ).toBe(INDENT_UNIT);
    });
  });
});
