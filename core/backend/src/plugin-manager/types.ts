import type { ServiceRef } from "@checkmate/backend-api";

/** Erased callback type used in PendingInit storage */
export type InitCallback = (deps: Record<string, unknown>) => Promise<void>;

export interface PendingInit {
  pluginId: string;
  pluginPath: string;
  deps: Record<string, ServiceRef<unknown>>;
  init: InitCallback;
  afterPluginsReady?: InitCallback;
  schema?: Record<string, unknown>;
}
