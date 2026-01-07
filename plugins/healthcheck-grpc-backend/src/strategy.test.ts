import { describe, expect, it, mock } from "bun:test";
import {
  GrpcHealthCheckStrategy,
  GrpcHealthClient,
  GrpcHealthStatus,
} from "./strategy";

describe("GrpcHealthCheckStrategy", () => {
  // Helper to create mock gRPC client
  const createMockClient = (
    config: {
      status?: GrpcHealthStatus;
      error?: Error;
    } = {}
  ): GrpcHealthClient => ({
    check: mock(() =>
      config.error
        ? Promise.reject(config.error)
        : Promise.resolve({ status: config.status ?? "SERVING" })
    ),
  });

  describe("execute", () => {
    it("should return healthy for SERVING status", async () => {
      const strategy = new GrpcHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 50051,
        timeout: 5000,
      });

      expect(result.status).toBe("healthy");
      expect(result.metadata?.connected).toBe(true);
      expect(result.metadata?.status).toBe("SERVING");
    });

    it("should return unhealthy for NOT_SERVING status", async () => {
      const strategy = new GrpcHealthCheckStrategy(
        createMockClient({ status: "NOT_SERVING" })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 50051,
        timeout: 5000,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("NOT_SERVING");
      expect(result.metadata?.status).toBe("NOT_SERVING");
    });

    it("should return unhealthy for SERVICE_UNKNOWN status", async () => {
      const strategy = new GrpcHealthCheckStrategy(
        createMockClient({ status: "SERVICE_UNKNOWN" })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 50051,
        service: "my.service",
        timeout: 5000,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("SERVICE_UNKNOWN");
    });

    it("should return unhealthy for connection error", async () => {
      const strategy = new GrpcHealthCheckStrategy(
        createMockClient({ error: new Error("Connection refused") })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 50051,
        timeout: 5000,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Connection refused");
      expect(result.metadata?.connected).toBe(false);
    });

    it("should pass responseTime assertion when below threshold", async () => {
      const strategy = new GrpcHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 50051,
        timeout: 5000,
        assertions: [
          { field: "responseTime", operator: "lessThan", value: 5000 },
        ],
      });

      expect(result.status).toBe("healthy");
    });

    it("should pass status assertion", async () => {
      const strategy = new GrpcHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 50051,
        timeout: 5000,
        assertions: [{ field: "status", operator: "equals", value: "SERVING" }],
      });

      expect(result.status).toBe("healthy");
    });

    it("should fail status assertion when not matching", async () => {
      const strategy = new GrpcHealthCheckStrategy(
        createMockClient({ status: "NOT_SERVING" })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 50051,
        timeout: 5000,
        assertions: [{ field: "status", operator: "equals", value: "SERVING" }],
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Assertion failed");
    });

    it("should check specific service", async () => {
      const mockClient = createMockClient();
      const strategy = new GrpcHealthCheckStrategy(mockClient);

      await strategy.execute({
        host: "localhost",
        port: 50051,
        service: "my.custom.Service",
        timeout: 5000,
      });

      expect(mockClient.check).toHaveBeenCalledWith(
        expect.objectContaining({ service: "my.custom.Service" })
      );
    });
  });

  describe("aggregateResult", () => {
    it("should calculate averages correctly", () => {
      const strategy = new GrpcHealthCheckStrategy();
      const runs = [
        {
          id: "1",
          status: "healthy" as const,
          latencyMs: 10,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: true,
            responseTimeMs: 5,
            status: "SERVING" as const,
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
            responseTimeMs: 15,
            status: "SERVING" as const,
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.avgResponseTime).toBe(10);
      expect(aggregated.successRate).toBe(100);
      expect(aggregated.servingCount).toBe(2);
      expect(aggregated.errorCount).toBe(0);
    });

    it("should count errors and non-serving", () => {
      const strategy = new GrpcHealthCheckStrategy();
      const runs = [
        {
          id: "1",
          status: "unhealthy" as const,
          latencyMs: 10,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: true,
            responseTimeMs: 5,
            status: "NOT_SERVING" as const,
          },
        },
        {
          id: "2",
          status: "unhealthy" as const,
          latencyMs: 0,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: false,
            responseTimeMs: 0,
            status: "UNKNOWN" as const,
            error: "Connection refused",
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.errorCount).toBe(1);
      expect(aggregated.servingCount).toBe(0);
      expect(aggregated.successRate).toBe(0);
    });
  });
});
