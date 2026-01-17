/**
 * Helper to extract attribute value from SAML assertion
 * Handles both single values and arrays (takes first element)
 */
export const extractAttribute = ({
  attributes,
  attributeName,
}: {
  attributes: Record<string, unknown>;
  attributeName: string;
}): string | undefined => {
  const value = attributes[attributeName];
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  return undefined;
};

/**
 * Helper to extract groups from SAML assertion (multi-valued attribute)
 * Returns all groups as an array of strings
 */
export const extractGroups = ({
  attributes,
  groupAttribute,
}: {
  attributes: Record<string, unknown>;
  groupAttribute: string;
}): string[] => {
  const value = attributes[groupAttribute];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.map(String);
  return [];
};
