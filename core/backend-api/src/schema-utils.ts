import { z } from "zod";
import {
  isSecretSchema,
  isColorSchema,
  getOptionsResolverMetadata,
  isHiddenSchema,
} from "./branded-types";

/**
 * Adds x-secret, x-color, x-options-resolver, x-depends-on, and x-hidden
 * metadata to JSON Schema for branded Zod fields.
 * This is used internally by toJsonSchema.
 */
function addSchemaMetadata(
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
    const zodField = fieldSchema as z.ZodTypeAny;

    // Secret field
    if (isSecretSchema(zodField) && properties[key]) {
      properties[key]["x-secret"] = true;
    }

    // Color field
    if (isColorSchema(zodField) && properties[key]) {
      properties[key]["x-color"] = true;
    }

    // Hidden field
    if (isHiddenSchema(zodField) && properties[key]) {
      properties[key]["x-hidden"] = true;
    }

    // Options resolver field
    const resolverMeta = getOptionsResolverMetadata(zodField);
    if (resolverMeta && properties[key]) {
      properties[key]["x-options-resolver"] = resolverMeta.resolver;
      if (resolverMeta.dependsOn) {
        properties[key]["x-depends-on"] = resolverMeta.dependsOn;
      }
    }
  }
}

/**
 * Converts a Zod schema to JSON Schema with automatic branded metadata.
 * Uses Zod v4's native toJSONSchema() method.
 *
 * The branded metadata enables DynamicForm to automatically render
 * specialized input fields (password for secrets, color picker for colors,
 * dropdowns for optionsResolver fields, hidden for auto-populated fields).
 */
export function toJsonSchema(zodSchema: z.ZodTypeAny): Record<string, unknown> {
  // Use Zod's native JSON Schema conversion
  const jsonSchema = zodSchema.toJSONSchema() as Record<string, unknown>;
  addSchemaMetadata(zodSchema, jsonSchema);
  return jsonSchema;
}
