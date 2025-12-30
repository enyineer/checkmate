import { createApiRef } from "@checkmate/frontend-api";
import { QueueClient } from "@checkmate/queue-common";

// Re-export types for convenience
export type {
  QueuePluginDto,
  QueueConfigurationDto,
  UpdateQueueConfiguration,
} from "@checkmate/queue-common";

// QueueApi is the client type from the common package
export type QueueApi = QueueClient;

export const queueApiRef = createApiRef<QueueApi>("queue-api");
