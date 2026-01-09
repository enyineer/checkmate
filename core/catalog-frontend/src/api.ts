import { createApiRef } from "@checkstack/frontend-api";
import { CatalogApi } from "@checkstack/catalog-common";
import type { InferClient } from "@checkstack/common";

// Re-export types for convenience
export type { System, Group, View } from "@checkstack/catalog-common";

// CatalogApi client type inferred from the client definition
export type CatalogApiClient = InferClient<typeof CatalogApi>;

export const catalogApiRef =
  createApiRef<CatalogApiClient>("plugin.catalog.api");
