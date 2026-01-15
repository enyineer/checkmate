/**
 * Recurring Job Tests for InMemoryQueue
 */

import { describe, it, expect, afterEach } from "bun:test";
import { InMemoryQueue } from "./memory-queue";
import type { Logger } from "@checkstack/backend-api";

const testLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

function createTestQueue(name: string) {
  return new InMemoryQueue<string>(
    name,
    {
      concurrency: 10,
      maxQueueSize: 100,
      delayMultiplier: 0.01, // Speed up delays for testing
      heartbeatIntervalMs: 5,
    },
    testLogger
  );
}

describe("InMemoryQueue Recurring Jobs", () => {
  let queue: InMemoryQueue<string> | undefined;

  afterEach(async () => {
    if (queue) {
      await queue.stop();
      queue = undefined;
    }
  });

  it("should reschedule recurring job after successful execution", async () => {
    queue = createTestQueue("test-reschedule");

    let executionCount = 0;
    await queue.consume(
      async () => {
        executionCount++;
      },
      { consumerGroup: "test", maxRetries: 0 }
    );

    await queue.scheduleRecurring("payload", {
      jobId: "recurring-success",
      intervalSeconds: 0.5, // 5ms with multiplier
    });

    // Wait for multiple executions
    await Bun.sleep(100);

    expect(executionCount).toBeGreaterThanOrEqual(2);
  });

  it("should reschedule recurring job even after handler failure", async () => {
    queue = createTestQueue("test-failure-reschedule");

    let executionCount = 0;
    await queue.consume(
      async () => {
        executionCount++;
        throw new Error("Handler failed");
      },
      { consumerGroup: "test", maxRetries: 0 }
    );

    await queue.scheduleRecurring("payload", {
      jobId: "recurring-failure",
      intervalSeconds: 0.5,
    });

    await Bun.sleep(100);

    // Should still reschedule despite failures
    expect(executionCount).toBeGreaterThanOrEqual(2);
  });

  it("should not reschedule during retries", async () => {
    queue = createTestQueue("test-no-reschedule-during-retry");

    let attempts = 0;
    let completed = false;

    await queue.consume(
      async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Retry me");
        }
        completed = true;
      },
      { consumerGroup: "test", maxRetries: 5 }
    );

    await queue.scheduleRecurring("payload", {
      jobId: "recurring-retry",
      intervalSeconds: 60, // Long interval so only retries should execute
    });

    await Bun.sleep(200);

    // Should complete after retries, not reschedule
    expect(completed).toBe(true);
    expect(attempts).toBe(3);
  });

  it("should stop scheduling when cancelled", async () => {
    queue = createTestQueue("test-cancel");

    let executionCount = 0;
    await queue.consume(
      async () => {
        executionCount++;
      },
      { consumerGroup: "test", maxRetries: 0 }
    );

    await queue.scheduleRecurring("payload", {
      jobId: "recurring-cancel",
      intervalSeconds: 0.5,
    });

    await Bun.sleep(50);
    const countBeforeCancel = executionCount;

    await queue.cancelRecurring("recurring-cancel");
    await Bun.sleep(100);

    // Should not have executed more after cancellation
    expect(countBeforeCancel).toBeGreaterThanOrEqual(1);
    expect(executionCount).toBe(countBeforeCancel);
  });
});
