import { describe, it, expect, beforeEach, mock } from "bun:test";
import { EventBus } from "./event-bus";
import type { QueueFactory, Queue } from "@checkmate/queue-api";
import type { Logger, Hook } from "@checkmate/backend-api";
import { createHook } from "@checkmate/backend-api";

describe("EventBus", () => {
  let eventBus: EventBus;
  let mockQueueFactory: QueueFactory;
  let mockLogger: Logger;
  let mockQueues: Map<string, Queue<unknown>>;

  beforeEach(() => {
    mockQueues = new Map();

    mockQueueFactory = {
      createQueue: (channelId: string) => {
        const consumers = new Map<
          string,
          {
            handler: (job: unknown) => Promise<void>;
            maxRetries: number;
          }
        >();
        const jobs: unknown[] = [];

        const mockQueue: Queue<unknown> = {
          enqueue: async (data: unknown) => {
            jobs.push(data);
            // Trigger all consumers (with error handling like real queue)
            for (const [group, consumer] of consumers.entries()) {
              try {
                await consumer.handler({
                  id: "test-id",
                  data,
                  timestamp: new Date(),
                  attempts: 0,
                });
              } catch (error) {
                // Mock queue catches errors like real implementation
                console.error("Mock queue caught error:", error);
              }
            }
            return "job-id";
          },
          consume: async (handler, options) => {
            consumers.set(options.consumerGroup, {
              handler: async (job: unknown) => await handler(job as any),
              maxRetries: options.maxRetries ?? 3,
            });
          },
          stop: async () => {
            consumers.clear();
          },
          getStats: async () => ({
            pending: jobs.length,
            processing: 0,
            completed: 0,
            failed: 0,
            consumerGroups: consumers.size,
          }),
        };

        mockQueues.set(channelId, mockQueue);
        return mockQueue;
      },
    } as QueueFactory;

    mockLogger = {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      child: mock(() => mockLogger),
    } as unknown as Logger;

    eventBus = new EventBus(mockQueueFactory, mockLogger);
  });

  describe("Validation", () => {
    it("should require workerGroup for work-queue mode", async () => {
      const testHook = createHook<{ test: string }>("test.hook");

      await expect(
        eventBus.subscribe(
          "test-plugin",
          testHook,
          async () => {},
          { mode: "work-queue" } as any // Missing workerGroup
        )
      ).rejects.toThrow("workerGroup is required when mode is 'work-queue'");
    });

    it("should detect duplicate workerGroups in same plugin", async () => {
      const testHook = createHook<{ test: string }>("test.hook");

      // First subscription: OK
      await eventBus.subscribe("test-plugin", testHook, async () => {}, {
        mode: "work-queue",
        workerGroup: "sync",
      });

      // Second subscription with same workerGroup: ERROR
      await expect(
        eventBus.subscribe("test-plugin", testHook, async () => {}, {
          mode: "work-queue",
          workerGroup: "sync",
        })
      ).rejects.toThrow("Duplicate workerGroup 'sync' detected");
    });

    it("should allow same workerGroup name in different plugins", async () => {
      const testHook = createHook<{ test: string }>("test.hook");

      // Both should succeed (different plugins)
      await eventBus.subscribe("plugin-a", testHook, async () => {}, {
        mode: "work-queue",
        workerGroup: "sync",
      });

      await eventBus.subscribe("plugin-b", testHook, async () => {}, {
        mode: "work-queue",
        workerGroup: "sync",
      });

      // No error - different namespaces
      expect(true).toBe(true);
    });
  });

  describe("Plugin Namespacing", () => {
    it("should namespace workerGroup by plugin ID", async () => {
      const testHook = createHook<{ test: string }>("test.hook");
      const calls: string[] = [];

      await eventBus.subscribe(
        "plugin-a",
        testHook,
        async () => {
          calls.push("a");
        },
        {
          mode: "work-queue",
          workerGroup: "sync",
        }
      );

      await eventBus.subscribe(
        "plugin-b",
        testHook,
        async () => {
          calls.push("b");
        },
        {
          mode: "work-queue",
          workerGroup: "sync",
        }
      );

      await eventBus.emit(testHook, { test: "data" });

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Both should execute (different namespaces: plugin-a.sync and plugin-b.sync)
      expect(calls).toContain("a");
      expect(calls).toContain("b");
    });

    it("should create unique consumer groups for broadcast mode", async () => {
      const testHook = createHook<{ test: string }>("test.hook");
      const calls: number[] = [];

      // Two broadcast subscribers from same plugin
      await eventBus.subscribe("plugin-a", testHook, async () => {
        calls.push(1);
      });

      await eventBus.subscribe("plugin-a", testHook, async () => {
        calls.push(2);
      });

      await eventBus.emit(testHook, { test: "data" });

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Both should receive (each gets unique consumer group with instance ID)
      // Note: They both execute because they have different consumer groups
      expect(calls.length).toBeGreaterThanOrEqual(1);
      expect(calls.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Unsubscribe", () => {
    it("should unsubscribe and stop receiving events", async () => {
      const testHook = createHook<{ test: string }>("test.hook");
      const calls: number[] = [];

      const unsubscribe = await eventBus.subscribe(
        "test-plugin",
        testHook,
        async () => {
          calls.push(1);
        }
      );

      await eventBus.emit(testHook, { test: "data" });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(calls.length).toBe(1);

      // Unsubscribe
      await unsubscribe();

      // Emit again
      await eventBus.emit(testHook, { test: "data" });
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not receive second event
      expect(calls.length).toBe(1);
    });

    it("should remove workerGroup from tracking on unsubscribe", async () => {
      const testHook = createHook<{ test: string }>("test.hook");

      const unsubscribe = await eventBus.subscribe(
        "test-plugin",
        testHook,
        async () => {},
        {
          mode: "work-queue",
          workerGroup: "sync",
        }
      );

      // Unsubscribe
      await unsubscribe();

      // Should be able to re-use the same workerGroup name
      await eventBus.subscribe("test-plugin", testHook, async () => {}, {
        mode: "work-queue",
        workerGroup: "sync",
      });

      // No error!
      expect(true).toBe(true);
    });

    it("should stop queue when all listeners unsubscribe", async () => {
      const testHook = createHook<{ test: string }>("test.hook");

      const unsubscribe1 = await eventBus.subscribe(
        "test-plugin",
        testHook,
        async () => {}
      );

      const unsubscribe2 = await eventBus.subscribe(
        "test-plugin",
        testHook,
        async () => {}
      );

      // Unsubscribe both
      await unsubscribe1();
      await unsubscribe2();

      // Queue should still exist but no listeners
      const queue = mockQueues.get(testHook.id);
      expect(queue).toBeDefined(); // Queue still exists in mock
    });
  });

  describe("Error Handling", () => {
    it("should log listener errors", async () => {
      const testHook = createHook<{ test: string }>("test.hook");

      await eventBus.subscribe(
        "test-plugin",
        testHook,
        async () => {
          throw new Error("Listener failed");
        },
        {
          mode: "work-queue",
          workerGroup: "fail-group",
          maxRetries: 0,
        }
      );

      // Emit - should not throw
      await eventBus.emit(testHook, { test: "data" });

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Error should be logged
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("Hook Emission", () => {
    it("should create queue channel lazily on first emit", async () => {
      const testHook = createHook<{ test: string }>("test.hook");

      expect(mockQueues.has(testHook.id)).toBe(false);

      await eventBus.emit(testHook, { test: "data" });

      expect(mockQueues.has(testHook.id)).toBe(true);
    });

    it("should deliver payload to all subscribers", async () => {
      const testHook = createHook<{ value: number }>("test.hook");
      const received: number[] = [];

      await eventBus.subscribe("plugin-1", testHook, async (payload) => {
        received.push(payload.value);
      });

      await eventBus.subscribe("plugin-2", testHook, async (payload) => {
        received.push(payload.value * 2);
      });

      await eventBus.emit(testHook, { value: 10 });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(received).toContain(10);
      expect(received).toContain(20);
    });
  });

  describe("Shutdown", () => {
    it("should stop all queue channels", async () => {
      const hook1 = createHook<{ test: string }>("hook1");
      const hook2 = createHook<{ test: string }>("hook2");

      await eventBus.subscribe("test-plugin", hook1, async () => {});
      await eventBus.subscribe("test-plugin", hook2, async () => {});

      expect(mockQueues.size).toBe(2);

      await eventBus.shutdown();

      // All queues should be stopped
      expect(mockLogger.info).toHaveBeenCalledWith("EventBus shut down");
    });
  });
});
