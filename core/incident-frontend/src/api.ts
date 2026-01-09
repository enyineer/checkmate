import { createApiRef } from "@checkstack/frontend-api";
import { IncidentApi } from "@checkstack/incident-common";
import type { InferClient } from "@checkstack/common";

// IncidentApiClient type inferred from the client definition
export type IncidentApiClient = InferClient<typeof IncidentApi>;

export const incidentApiRef = createApiRef<IncidentApiClient>(
  "plugin.incident.api"
);
