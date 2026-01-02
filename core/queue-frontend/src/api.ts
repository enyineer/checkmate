import { createApiRef } from "@checkmate/frontend-api";
import { QueueApi } from "@checkmate/queue-common";
import type { InferClient } from "@checkmate/common";

// Re-export types for convenience
export type {
  QueuePluginDto,
  QueueConfigurationDto,
  UpdateQueueConfiguration,
} from "@checkmate/queue-common";

// QueueApiClient type inferred from the client definition
export type QueueApiClient = InferClient<typeof QueueApi>;

export const queueApiRef = createApiRef<QueueApiClient>("queue-api");
