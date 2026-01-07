import { describe, expect, it, mock, beforeEach } from "bun:test";
import { PingHealthCheckStrategy } from "./strategy";

// Mock Bun.spawn for testing
const mockSpawn = mock(() => ({
  stdout: new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(
          `PING 8.8.8.8 (8.8.8.8): 56 data bytes
64 bytes from 8.8.8.8: icmp_seq=0 ttl=118 time=10.123 ms
64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=12.456 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=118 time=11.789 ms

--- 8.8.8.8 ping statistics ---
3 packets transmitted, 3 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 10.123/11.456/12.456/0.957 ms`
        )
      );
      controller.close();
    },
  }),
  stderr: new ReadableStream(),
  exited: Promise.resolve(0),
}));

describe("PingHealthCheckStrategy", () => {
  let strategy: PingHealthCheckStrategy;
  const originalSpawn = Bun.spawn;

  beforeEach(() => {
    strategy = new PingHealthCheckStrategy();
    mockSpawn.mockClear();
    // @ts-expect-error - mocking global
    Bun.spawn = mockSpawn;
  });

  afterEach(() => {
    Bun.spawn = originalSpawn;
  });

  describe("execute", () => {
    it("should return healthy for successful ping", async () => {
      const result = await strategy.execute({
        host: "8.8.8.8",
        count: 3,
        timeout: 5000,
      });

      expect(result.status).toBe("healthy");
      expect(result.metadata?.packetsSent).toBe(3);
      expect(result.metadata?.packetsReceived).toBe(3);
      expect(result.metadata?.packetLoss).toBe(0);
      expect(result.metadata?.avgLatency).toBeCloseTo(11.456, 2);
    });

    it("should return unhealthy for 100% packet loss", async () => {
      // @ts-expect-error - mocking global
      Bun.spawn = mock(() => ({
        stdout: new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                `PING 10.0.0.1 (10.0.0.1): 56 data bytes

--- 10.0.0.1 ping statistics ---
3 packets transmitted, 0 packets received, 100.0% packet loss`
              )
            );
            controller.close();
          },
        }),
        stderr: new ReadableStream(),
        exited: Promise.resolve(1),
      }));

      const result = await strategy.execute({
        host: "10.0.0.1",
        count: 3,
        timeout: 5000,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.metadata?.packetLoss).toBe(100);
      expect(result.message).toContain("unreachable");
    });

    it("should pass latency assertion when below threshold", async () => {
      const result = await strategy.execute({
        host: "8.8.8.8",
        count: 3,
        timeout: 5000,
        assertions: [{ field: "avgLatency", operator: "lessThan", value: 50 }],
      });

      expect(result.status).toBe("healthy");
    });

    it("should fail latency assertion when above threshold", async () => {
      const result = await strategy.execute({
        host: "8.8.8.8",
        count: 3,
        timeout: 5000,
        assertions: [{ field: "avgLatency", operator: "lessThan", value: 5 }],
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Assertion failed");
      expect(result.metadata?.failedAssertion).toBeDefined();
    });

    it("should pass packet loss assertion", async () => {
      const result = await strategy.execute({
        host: "8.8.8.8",
        count: 3,
        timeout: 5000,
        assertions: [{ field: "packetLoss", operator: "equals", value: 0 }],
      });

      expect(result.status).toBe("healthy");
    });

    it("should handle spawn errors gracefully", async () => {
      Bun.spawn = mock(() => {
        throw new Error("Command not found");
      }) as typeof Bun.spawn;

      const result = await strategy.execute({
        host: "8.8.8.8",
        count: 3,
        timeout: 5000,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.metadata?.error).toBeDefined();
    });
  });

  describe("aggregateResult", () => {
    it("should calculate averages correctly", () => {
      const runs = [
        {
          id: "1",
          status: "healthy" as const,
          latencyMs: 10,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            packetsSent: 3,
            packetsReceived: 3,
            packetLoss: 0,
            avgLatency: 10,
            maxLatency: 15,
          },
        },
        {
          id: "2",
          status: "healthy" as const,
          latencyMs: 20,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            packetsSent: 3,
            packetsReceived: 2,
            packetLoss: 33,
            avgLatency: 20,
            maxLatency: 25,
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.avgPacketLoss).toBeCloseTo(16.5, 1);
      expect(aggregated.avgLatency).toBeCloseTo(15, 1);
      expect(aggregated.maxLatency).toBe(25);
      expect(aggregated.errorCount).toBe(0);
    });

    it("should count errors", () => {
      const runs = [
        {
          id: "1",
          status: "unhealthy" as const,
          latencyMs: 0,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            packetsSent: 3,
            packetsReceived: 0,
            packetLoss: 100,
            error: "Timeout",
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.errorCount).toBe(1);
    });
  });
});

// Import afterEach
import { afterEach } from "bun:test";
