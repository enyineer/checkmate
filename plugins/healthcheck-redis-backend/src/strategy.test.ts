import { describe, expect, it, mock } from "bun:test";
import { RedisHealthCheckStrategy, RedisClient } from "./strategy";

describe("RedisHealthCheckStrategy", () => {
  // Helper to create mock Redis client
  const createMockClient = (
    config: {
      pingResponse?: string;
      infoResponse?: string;
      pingError?: Error;
      connectError?: Error;
    } = {}
  ): RedisClient => ({
    connect: mock(() =>
      config.connectError
        ? Promise.reject(config.connectError)
        : Promise.resolve({
            ping: mock(() =>
              config.pingError
                ? Promise.reject(config.pingError)
                : Promise.resolve(config.pingResponse ?? "PONG")
            ),
            info: mock(() =>
              Promise.resolve(
                config.infoResponse ?? "redis_version:7.0.0\r\nrole:master\r\n"
              )
            ),
            quit: mock(() => Promise.resolve("OK")),
          })
    ),
  });

  describe("execute", () => {
    it("should return healthy for successful connection", async () => {
      const strategy = new RedisHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 6379,
        timeout: 5000,
      });

      expect(result.status).toBe("healthy");
      expect(result.metadata?.connected).toBe(true);
      expect(result.metadata?.pingSuccess).toBe(true);
      expect(result.metadata?.redisVersion).toBe("7.0.0");
      expect(result.metadata?.role).toBe("master");
    });

    it("should return unhealthy for connection error", async () => {
      const strategy = new RedisHealthCheckStrategy(
        createMockClient({ connectError: new Error("Connection refused") })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 6379,
        timeout: 5000,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Connection refused");
      expect(result.metadata?.connected).toBe(false);
    });

    it("should return unhealthy for PING failure", async () => {
      const strategy = new RedisHealthCheckStrategy(
        createMockClient({ pingError: new Error("NOAUTH") })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 6379,
        timeout: 5000,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.metadata?.pingSuccess).toBe(false);
    });

    it("should pass connectionTime assertion when below threshold", async () => {
      const strategy = new RedisHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 6379,
        timeout: 5000,
        assertions: [
          { field: "connectionTime", operator: "lessThan", value: 5000 },
        ],
      });

      expect(result.status).toBe("healthy");
    });

    it("should pass role assertion", async () => {
      const strategy = new RedisHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 6379,
        timeout: 5000,
        assertions: [{ field: "role", operator: "equals", value: "master" }],
      });

      expect(result.status).toBe("healthy");
    });

    it("should fail role assertion when replica", async () => {
      const strategy = new RedisHealthCheckStrategy(
        createMockClient({
          infoResponse: "redis_version:7.0.0\r\nrole:slave\r\n",
        })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 6379,
        timeout: 5000,
        assertions: [{ field: "role", operator: "equals", value: "master" }],
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Assertion failed");
    });

    it("should pass pingSuccess assertion", async () => {
      const strategy = new RedisHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 6379,
        timeout: 5000,
        assertions: [{ field: "pingSuccess", operator: "isTrue" }],
      });

      expect(result.status).toBe("healthy");
    });
  });

  describe("aggregateResult", () => {
    it("should calculate averages correctly", () => {
      const strategy = new RedisHealthCheckStrategy();
      const runs = [
        {
          id: "1",
          status: "healthy" as const,
          latencyMs: 10,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: true,
            connectionTimeMs: 5,
            pingTimeMs: 1,
            pingSuccess: true,
            role: "master",
          },
        },
        {
          id: "2",
          status: "healthy" as const,
          latencyMs: 20,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: true,
            connectionTimeMs: 15,
            pingTimeMs: 3,
            pingSuccess: true,
            role: "master",
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.avgConnectionTime).toBe(10);
      expect(aggregated.avgPingTime).toBe(2);
      expect(aggregated.successRate).toBe(100);
      expect(aggregated.errorCount).toBe(0);
    });

    it("should count errors", () => {
      const strategy = new RedisHealthCheckStrategy();
      const runs = [
        {
          id: "1",
          status: "unhealthy" as const,
          latencyMs: 100,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: false,
            connectionTimeMs: 100,
            pingSuccess: false,
            error: "Connection refused",
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.errorCount).toBe(1);
      expect(aggregated.successRate).toBe(0);
    });
  });
});
