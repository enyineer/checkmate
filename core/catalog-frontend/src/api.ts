import { createApiRef } from "@checkmate/frontend-api";
import { CatalogClient } from "@checkmate/catalog-common";

// Re-export types for convenience
export type { System, Group, View } from "@checkmate/catalog-common";

// CatalogApi is the client type from the common package
export type CatalogApi = CatalogClient;

export const catalogApiRef = createApiRef<CatalogApi>("plugin.catalog.api");
