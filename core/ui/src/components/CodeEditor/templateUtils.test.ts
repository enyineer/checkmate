import { describe, it, expect } from "bun:test";
import { detectOpenTemplate, detectAutoClosedBraces } from "./templateUtils";

describe("detectOpenTemplate", () => {
  it("returns isInTemplate=false when no open template", () => {
    const content = '{"foo": "bar"}';
    const result = detectOpenTemplate({ content, cursorOffset: 10 });
    expect(result.isInTemplate).toBe(false);
  });

  it("returns isInTemplate=false when template is closed", () => {
    const content = '{"foo": "{{test}}"}';
    const result = detectOpenTemplate({ content, cursorOffset: 18 });
    expect(result.isInTemplate).toBe(false);
  });

  it("returns isInTemplate=true when inside open template", () => {
    const content = '{"foo": "{{payl';
    const result = detectOpenTemplate({
      content,
      cursorOffset: content.length,
    });
    expect(result.isInTemplate).toBe(true);
    expect(result.query).toBe("payl");
  });

  it("returns correct startOffset", () => {
    const content = '{"foo": "{{test';
    const result = detectOpenTemplate({
      content,
      cursorOffset: content.length,
    });
    expect(result.startOffset).toBe(9);
  });

  it("returns correct line number and column", () => {
    const content = `{
  "foo": "{{test`;
    const result = detectOpenTemplate({
      content,
      cursorOffset: content.length,
    });
    expect(result.lineNumber).toBe(2);
    expect(result.startColumn).toBe(11);
  });

  it("handles cursor right after {{", () => {
    const content = '{"foo": "{{';
    const result = detectOpenTemplate({
      content,
      cursorOffset: content.length,
    });
    expect(result.isInTemplate).toBe(true);
    expect(result.query).toBe("");
  });

  it("returns isInTemplate=false when cursor is after closed and before new open", () => {
    const content = '{"a": "{{done}}", "b": "';
    const result = detectOpenTemplate({
      content,
      cursorOffset: content.length,
    });
    expect(result.isInTemplate).toBe(false);
  });
});

describe("detectAutoClosedBraces", () => {
  it("returns 0 when no braces after cursor", () => {
    const content = '{"foo": "{{test}}"}';
    const result = detectAutoClosedBraces({ content, cursorOffset: 9 });
    expect(result).toBe(0);
  });

  it("returns 2 when }} follows cursor", () => {
    const content = '{"foo": "{{test}}"}';
    // Cursor is after "test" but before }}
    const result = detectAutoClosedBraces({ content, cursorOffset: 15 });
    expect(result).toBe(2);
  });

  it("returns 1 when single } follows cursor", () => {
    const content = '{"foo": "{{test}"}';
    // Only one } after test
    const result = detectAutoClosedBraces({ content, cursorOffset: 15 });
    expect(result).toBe(1);
  });
});
