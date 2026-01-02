import { createApiRef } from "@checkmate/frontend-api";
import { MaintenanceApi } from "@checkmate/maintenance-common";
import type { InferClient } from "@checkmate/common";

// MaintenanceApiClient type inferred from the client definition
export type MaintenanceApiClient = InferClient<typeof MaintenanceApi>;

export const maintenanceApiRef = createApiRef<MaintenanceApiClient>(
  "plugin.maintenance.api"
);
