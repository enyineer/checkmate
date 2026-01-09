import { createApiRef } from "@checkstack/frontend-api";
import { QueueApi } from "@checkstack/queue-common";
import type { InferClient } from "@checkstack/common";

// Re-export types for convenience
export type {
  QueuePluginDto,
  QueueConfigurationDto,
  UpdateQueueConfiguration,
} from "@checkstack/queue-common";

// QueueApiClient type inferred from the client definition
export type QueueApiClient = InferClient<typeof QueueApi>;

export const queueApiRef = createApiRef<QueueApiClient>("queue-api");
