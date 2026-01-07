import { describe, it, expect, beforeAll } from "bun:test";
import { z } from "zod";
import { configString, isSecretSchema } from "@checkmate-monitor/backend-api";
import { encrypt, decrypt, isEncrypted } from "@checkmate-monitor/backend-api";

describe("Secret Detection", () => {
  it("should detect direct secret fields", () => {
    const schema = configString({ "x-secret": true });
    expect(isSecretSchema(schema)).toBe(true);
  });

  it("should detect optional secret fields", () => {
    const schema = configString({ "x-secret": true }).optional();
    expect(isSecretSchema(schema)).toBe(true);
  });

  it("should not detect regular string fields", () => {
    const schema = z.string();
    expect(isSecretSchema(schema)).toBe(false);
  });

  it("should not detect optional regular string fields", () => {
    const schema = z.string().optional();
    expect(isSecretSchema(schema)).toBe(false);
  });
});

describe("Encryption and Decryption", () => {
  beforeAll(() => {
    // Set a test encryption key (32 bytes = 64 hex chars)
    process.env.ENCRYPTION_MASTER_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  it("should encrypt and decrypt a secret value", () => {
    const plaintext = "my-secret-value";
    const encrypted = encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(isEncrypted(encrypted)).toBe(true);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertexts for the same plaintext", () => {
    const plaintext = "same-secret";
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    // Different IVs should produce different ciphertexts
    expect(encrypted1).not.toBe(encrypted2);

    // But both should decrypt to the same value
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it("should correctly identify encrypted vs plaintext values", () => {
    const plaintext = "not-encrypted";
    const encrypted = encrypt(plaintext);

    expect(isEncrypted(plaintext)).toBe(false);
    expect(isEncrypted(encrypted)).toBe(true);
  });
});
