import { describe, expect, test } from "bun:test";
import { encrypt, decrypt, isEncrypted } from "./encryption";

describe("Encryption Utils", () => {
  // Set encryption key for tests
  process.env.ENCRYPTION_MASTER_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 64 hex chars = 32 bytes

  test("encrypts and decrypts strings correctly", () => {
    const plaintext = "my-secret-client-secret";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  test("encrypted value has correct format", () => {
    const plaintext = "test-secret";
    const encrypted = encrypt(plaintext);

    // Should have 3 parts separated by colons
    const parts = encrypted.split(":");
    expect(parts.length).toBe(3);

    // All parts should be base64
    parts.forEach((part) => {
      expect(part).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  test("isEncrypted detects encrypted values", () => {
    const plaintext = "plain-text";
    const encrypted = encrypt(plaintext);

    expect(isEncrypted(encrypted)).toBe(true);
    expect(isEncrypted(plaintext)).toBe(false);
    expect(isEncrypted("not:encrypted")).toBe(false);
  });

  test("encrypting same plaintext produces different ciphertext", () => {
    const plaintext = "same-secret";
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    // Should be different due to random IV
    expect(encrypted1).not.toBe(encrypted2);

    // But both should decrypt to same value
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  test("throws error when decrypting invalid format", () => {
    expect(() => decrypt("invalid")).toThrow();
    expect(() => decrypt("only:two")).toThrow();
  });
});
