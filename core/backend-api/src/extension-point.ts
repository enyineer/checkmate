export interface ExtensionPoint<T> {
  id: string;
  T: T; // phantom type for type safety
}

/**
 * Creates a reference to an extension point.
 */
export function createExtensionPoint<T>(id: string): ExtensionPoint<T> {
  return { id } as ExtensionPoint<T>;
}
