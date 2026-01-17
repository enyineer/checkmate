/**
 * Helper to extract groups from LDAP entry (multi-valued attribute)
 * Returns all group DNs as an array of strings
 */
export const extractGroups = ({
  ldapEntry,
  memberOfAttribute,
}: {
  ldapEntry: Record<string, unknown>;
  memberOfAttribute: string;
}): string[] => {
  const value = ldapEntry[memberOfAttribute];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.map(String);
  return [];
};
