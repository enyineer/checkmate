import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ServiceRef } from "./service-ref";
import { ExtensionPoint } from "./extension-point";
import type { Permission } from "@checkmate/common";
import type { Hook, HookSubscribeOptions, HookUnsubscribe } from "./hooks";

export type Deps = Record<string, ServiceRef<unknown>>;

// Helper to extract the T from ServiceRef<T>
export type ResolvedDeps<T extends Deps> = {
  [K in keyof T]: T[K]["T"];
};

export type PluginContext = {
  pluginId: string;
};

/**
 * Context available during the afterPluginsReady phase.
 * Contains hook operations that are only safe after all plugins are initialized.
 */
export type AfterPluginsReadyContext = {
  /**
   * Subscribe to a hook. Only available in afterPluginsReady phase.
   * @returns Unsubscribe function
   */
  onHook: <T>(
    hook: Hook<T>,
    listener: (payload: T) => Promise<void>,
    options?: HookSubscribeOptions
  ) => HookUnsubscribe;
  /**
   * Emit a hook event. Only available in afterPluginsReady phase.
   */
  emitHook: <T>(hook: Hook<T>, payload: T) => Promise<void>;
};

export type BackendPluginRegistry = {
  registerInit: <
    D extends Deps,
    S extends Record<string, unknown> | undefined = undefined
  >(args: {
    deps: D;
    schema?: S;
    /**
     * Phase 2: Initialize the plugin.
     * Use this to register routers, services, and set up internal state.
     * DO NOT make RPC calls to other plugins here - use afterPluginsReady instead.
     */
    init: (
      deps: ResolvedDeps<D> &
        (S extends undefined
          ? unknown
          : { database: NodePgDatabase<NonNullable<S>> })
    ) => Promise<void>;
    /**
     * Phase 3: Called after ALL plugins have initialized.
     * Safe to make RPC calls to other plugins and subscribe to hooks.
     * Receives the same deps as init, plus onHook and emitHook.
     */
    afterPluginsReady?: (
      deps: ResolvedDeps<D> &
        (S extends undefined
          ? unknown
          : { database: NodePgDatabase<NonNullable<S>> }) &
        AfterPluginsReadyContext
    ) => Promise<void>;
  }) => void;
  registerService: <S>(ref: ServiceRef<S>, impl: S) => void;
  registerExtensionPoint: <T>(ref: ExtensionPoint<T>, impl: T) => void;
  getExtensionPoint: <T>(ref: ExtensionPoint<T>) => T;
  registerPermissions: (permissions: Permission[]) => void;
  registerRouter: (router: unknown) => void;
  pluginManager: {
    getAllPermissions: () => { id: string; description?: string }[];
  };
};

export type BackendPlugin = {
  pluginId: string;
  register: (env: BackendPluginRegistry) => void;
};

export function createBackendPlugin(config: BackendPlugin): BackendPlugin {
  return config;
}
