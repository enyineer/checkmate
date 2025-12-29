import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { isSecretSchema } from "./auth-strategy";

/**
 * Adds x-secret metadata to JSON Schema for fields marked as secret in Zod schema.
 * This is used internally by toJsonSchema.
 */
function addSecretMetadata(
  zodSchema: z.ZodTypeAny,
  jsonSchema: Record<string, unknown>
): void {
  // Type guard to check if this is an object schema
  if (!("shape" in zodSchema)) return;

  const objectSchema = zodSchema as z.ZodObject<z.ZodRawShape>;
  const properties = jsonSchema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (!properties) return;

  for (const [key, fieldSchema] of Object.entries(objectSchema.shape)) {
    if (isSecretSchema(fieldSchema as z.ZodTypeAny) && properties[key]) {
      properties[key]["x-secret"] = true;
    }
  }
}

/**
 * Converts a Zod schema to JSON Schema with automatic x-secret metadata.
 * This should be used instead of zodToJsonSchema directly when working with
 * schemas that may contain secret fields.
 *
 * The x-secret metadata enables DynamicForm to automatically render
 * password input fields for secret properties.
 */
export function toJsonSchema(zodSchema: z.ZodTypeAny): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(zodSchema as never);
  addSecretMetadata(zodSchema, jsonSchema as Record<string, unknown>);
  return jsonSchema as Record<string, unknown>;
}
