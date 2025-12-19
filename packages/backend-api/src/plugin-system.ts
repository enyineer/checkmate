import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ServiceRef } from "./service-ref";

export type Deps = Record<string, ServiceRef<unknown>>;

// Helper to extract the T from ServiceRef<T>
export type ResolvedDeps<T extends Deps> = {
  [K in keyof T]: T[K]["T"];
};

export type PluginContext = {
  pluginId: string;
};

export type Permission = {
  id: string; // e.g. "read-things", will be prefixed: "pluginId.read-things"
  description?: string;
};

export type BackendPlugin = {
  pluginId: string;
  register: (env: {
    registerInit: <
      D extends Deps,
      S extends Record<string, unknown> | undefined = undefined
    >(args: {
      deps: D;
      schema?: S;
      init: (
        deps: ResolvedDeps<D> &
          (S extends undefined
            ? unknown
            : { database: NodePgDatabase<NonNullable<S>> })
      ) => Promise<void>;
    }) => void;
    registerService: <S>(ref: ServiceRef<S>, impl: S) => void;
    registerPermissions: (permissions: Permission[]) => void;
  }) => void;
};

export function createBackendPlugin(config: BackendPlugin): BackendPlugin {
  return config;
}
