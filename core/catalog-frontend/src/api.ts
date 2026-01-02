import { createApiRef } from "@checkmate/frontend-api";
import { CatalogApi } from "@checkmate/catalog-common";
import type { InferClient } from "@checkmate/common";

// Re-export types for convenience
export type { System, Group, View } from "@checkmate/catalog-common";

// CatalogApi client type inferred from the client definition
export type CatalogApiClient = InferClient<typeof CatalogApi>;

export const catalogApiRef =
  createApiRef<CatalogApiClient>("plugin.catalog.api");
