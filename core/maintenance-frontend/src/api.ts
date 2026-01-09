import { createApiRef } from "@checkstack/frontend-api";
import { MaintenanceApi } from "@checkstack/maintenance-common";
import type { InferClient } from "@checkstack/common";

// MaintenanceApiClient type inferred from the client definition
export type MaintenanceApiClient = InferClient<typeof MaintenanceApi>;

export const maintenanceApiRef = createApiRef<MaintenanceApiClient>(
  "plugin.maintenance.api"
);
