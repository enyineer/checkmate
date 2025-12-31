import { describe, expect, test } from "bun:test";
import { secret, isSecretSchema } from "./auth-strategy";
import { z } from "zod";

describe("Auth Strategy Secret Type", () => {
  test("secret() creates a branded string schema", () => {
    const secretSchema = secret();
    const result = secretSchema.safeParse("my-secret-value");
    expect(result.success).toBe(true);
  });

  test("isSecretSchema detects secret schemas", () => {
    const secretSchema = secret();
    const regularSchema = z.string();

    expect(isSecretSchema(secretSchema)).toBe(true);
    expect(isSecretSchema(regularSchema)).toBe(false);
  });

  test("multiple secret() calls create distinct tracked schemas", () => {
    const secret1 = secret();
    const secret2 = secret();

    expect(isSecretSchema(secret1)).toBe(true);
    expect(isSecretSchema(secret2)).toBe(true);
    expect(secret1).not.toBe(secret2);
  });

  test("secret schema validates strings", () => {
    const secretSchema = secret();

    expect(secretSchema.safeParse("valid").success).toBe(true);
    expect(secretSchema.safeParse(123).success).toBe(false);
    expect(secretSchema.safeParse(null).success).toBe(false);
  });
});
