import type { Hook, HookSubscribeOptions, HookUnsubscribe } from "./hooks";

/**
 * EventBus interface for dependency injection
 */
export interface EventBus {
  subscribe<T>(
    pluginId: string,
    hook: Hook<T>,
    listener: (payload: T) => Promise<void>,
    options?: HookSubscribeOptions
  ): Promise<HookUnsubscribe>;

  /**
   * Emit a hook through the distributed queue system.
   * All instances receive broadcast hooks; one instance handles work-queue hooks.
   */
  emit<T>(hook: Hook<T>, payload: T): Promise<void>;

  /**
   * Emit a hook locally only (not distributed).
   * Use for instance-local hooks that should only run on THIS instance.
   * Uses Promise.allSettled to ensure one listener error doesn't block others.
   */
  emitLocal<T>(hook: Hook<T>, payload: T): Promise<void>;

  shutdown(): Promise<void>;
}
