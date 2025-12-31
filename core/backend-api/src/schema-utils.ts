import { z } from "zod";
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
 * Uses Zod v4's native toJSONSchema() method.
 *
 * The x-secret metadata enables DynamicForm to automatically render
 * password input fields for secret properties.
 */
export function toJsonSchema(zodSchema: z.ZodTypeAny): Record<string, unknown> {
  // Use Zod's native JSON Schema conversion
  const jsonSchema = zodSchema.toJSONSchema() as Record<string, unknown>;
  addSecretMetadata(zodSchema, jsonSchema);
  return jsonSchema;
}
