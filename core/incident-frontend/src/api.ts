import { createApiRef } from "@checkmate/frontend-api";
import { IncidentApi } from "@checkmate/incident-common";
import type { InferClient } from "@checkmate/common";

// IncidentApiClient type inferred from the client definition
export type IncidentApiClient = InferClient<typeof IncidentApi>;

export const incidentApiRef = createApiRef<IncidentApiClient>(
  "plugin.incident.api"
);
