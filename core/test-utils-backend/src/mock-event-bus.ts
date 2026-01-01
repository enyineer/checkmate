/**
 * Mock EventBus for testing plugin lifecycle and hook emissions.
 * Tracks all emitted events and allows triggering broadcasts for multi-instance simulation.
 */

export interface MockEventBusOptions {
  /** If true, auto-resolves all subscriptions */
  autoResolve?: boolean;
}

export interface EmittedEvent {
  hook: string;
  payload: unknown;
}

export interface MockEventBus {
  emit: (hook: { id: string }, payload: unknown) => Promise<void>;
  emitLocal: (hook: { id: string }, payload: unknown) => Promise<void>;
  subscribe: (
    pluginId: string,
    hook: { id: string },
    listener: (payload: unknown) => Promise<void>
  ) => Promise<() => void>;
  subscribeLocal: (
    hook: { id: string },
    listener: (payload: unknown) => Promise<void>
  ) => () => void;
  unsubscribe: () => Promise<void>;

  // Test helpers
  _emittedEvents: EmittedEvent[];
  _localEmittedEvents: EmittedEvent[];
  _triggerBroadcast: (hook: { id: string }, payload: unknown) => Promise<void>;
  _clear: () => void;
}

export function createMockEventBus(
  _options?: MockEventBusOptions
): MockEventBus {
  const subscriptions = new Map<
    string,
    ((payload: unknown) => Promise<void>)[]
  >();
  const localSubscriptions = new Map<
    string,
    ((payload: unknown) => Promise<void>)[]
  >();
  const emittedEvents: EmittedEvent[] = [];
  const localEmittedEvents: EmittedEvent[] = [];

  return {
    emit: async (hook: { id: string }, payload: unknown) => {
      emittedEvents.push({ hook: hook.id, payload });
      const listeners = subscriptions.get(hook.id) || [];
      await Promise.all(listeners.map((l) => l(payload)));
    },

    emitLocal: async (hook: { id: string }, payload: unknown) => {
      localEmittedEvents.push({ hook: hook.id, payload });
      const listeners = localSubscriptions.get(hook.id) || [];
      await Promise.all(listeners.map((l) => l(payload)));
    },

    subscribe: async (
      _pluginId: string,
      hook: { id: string },
      listener: (payload: unknown) => Promise<void>
    ) => {
      const listeners = subscriptions.get(hook.id) || [];
      listeners.push(listener);
      subscriptions.set(hook.id, listeners);
      return () => {
        const idx = listeners.indexOf(listener);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    },

    subscribeLocal: (
      hook: { id: string },
      listener: (payload: unknown) => Promise<void>
    ) => {
      const listeners = localSubscriptions.get(hook.id) || [];
      listeners.push(listener);
      localSubscriptions.set(hook.id, listeners);
      return () => {
        const idx = listeners.indexOf(listener);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    },

    unsubscribe: async () => {},

    // Test helpers
    _emittedEvents: emittedEvents,
    _localEmittedEvents: localEmittedEvents,

    _triggerBroadcast: async (hook: { id: string }, payload: unknown) => {
      const listeners = subscriptions.get(hook.id) || [];
      await Promise.all(listeners.map((l) => l(payload)));
    },

    _clear: () => {
      emittedEvents.length = 0;
      localEmittedEvents.length = 0;
      subscriptions.clear();
      localSubscriptions.clear();
    },
  };
}
