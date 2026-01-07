import { describe, expect, it, mock } from "bun:test";
import { PostgresHealthCheckStrategy, DbClient } from "./strategy";

describe("PostgresHealthCheckStrategy", () => {
  // Helper to create mock DB client
  const createMockClient = (
    config: {
      rowCount?: number;
      queryError?: Error;
      connectError?: Error;
    } = {}
  ): DbClient => ({
    connect: mock(() =>
      config.connectError
        ? Promise.reject(config.connectError)
        : Promise.resolve({
            query: mock(() =>
              config.queryError
                ? Promise.reject(config.queryError)
                : Promise.resolve({ rowCount: config.rowCount ?? 1 })
            ),
            end: mock(() => Promise.resolve()),
          })
    ),
  });

  describe("execute", () => {
    it("should return healthy for successful connection", async () => {
      const strategy = new PostgresHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 5432,
        database: "test",
        user: "postgres",
        password: "secret",
        timeout: 5000,
      });

      expect(result.status).toBe("healthy");
      expect(result.metadata?.connected).toBe(true);
      expect(result.metadata?.querySuccess).toBe(true);
    });

    it("should return unhealthy for connection error", async () => {
      const strategy = new PostgresHealthCheckStrategy(
        createMockClient({ connectError: new Error("Connection refused") })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 5432,
        database: "test",
        user: "postgres",
        password: "secret",
        timeout: 5000,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Connection refused");
      expect(result.metadata?.connected).toBe(false);
    });

    it("should return unhealthy for query error", async () => {
      const strategy = new PostgresHealthCheckStrategy(
        createMockClient({ queryError: new Error("Syntax error") })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 5432,
        database: "test",
        user: "postgres",
        password: "secret",
        timeout: 5000,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.metadata?.querySuccess).toBe(false);
    });

    it("should pass connectionTime assertion when below threshold", async () => {
      const strategy = new PostgresHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 5432,
        database: "test",
        user: "postgres",
        password: "secret",
        timeout: 5000,
        assertions: [
          { field: "connectionTime", operator: "lessThan", value: 5000 },
        ],
      });

      expect(result.status).toBe("healthy");
    });

    it("should pass rowCount assertion", async () => {
      const strategy = new PostgresHealthCheckStrategy(
        createMockClient({ rowCount: 5 })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 5432,
        database: "test",
        user: "postgres",
        password: "secret",
        timeout: 5000,
        assertions: [
          { field: "rowCount", operator: "greaterThanOrEqual", value: 1 },
        ],
      });

      expect(result.status).toBe("healthy");
    });

    it("should fail rowCount assertion when no rows", async () => {
      const strategy = new PostgresHealthCheckStrategy(
        createMockClient({ rowCount: 0 })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 5432,
        database: "test",
        user: "postgres",
        password: "secret",
        timeout: 5000,
        assertions: [{ field: "rowCount", operator: "greaterThan", value: 0 }],
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Assertion failed");
    });

    it("should pass querySuccess assertion", async () => {
      const strategy = new PostgresHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 5432,
        database: "test",
        user: "postgres",
        password: "secret",
        timeout: 5000,
        assertions: [{ field: "querySuccess", operator: "isTrue" }],
      });

      expect(result.status).toBe("healthy");
    });
  });

  describe("aggregateResult", () => {
    it("should calculate averages correctly", () => {
      const strategy = new PostgresHealthCheckStrategy();
      const runs = [
        {
          id: "1",
          status: "healthy" as const,
          latencyMs: 100,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: true,
            connectionTimeMs: 50,
            queryTimeMs: 10,
            rowCount: 1,
            querySuccess: true,
          },
        },
        {
          id: "2",
          status: "healthy" as const,
          latencyMs: 150,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: true,
            connectionTimeMs: 100,
            queryTimeMs: 20,
            rowCount: 5,
            querySuccess: true,
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.avgConnectionTime).toBe(75);
      expect(aggregated.avgQueryTime).toBe(15);
      expect(aggregated.successRate).toBe(100);
      expect(aggregated.errorCount).toBe(0);
    });

    it("should count errors", () => {
      const strategy = new PostgresHealthCheckStrategy();
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
            querySuccess: false,
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
