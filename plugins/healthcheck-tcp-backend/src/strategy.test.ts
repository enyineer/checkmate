import { describe, expect, it, mock } from "bun:test";
import { TcpHealthCheckStrategy, TcpSocket, SocketFactory } from "./strategy";

describe("TcpHealthCheckStrategy", () => {
  // Helper to create mock socket factory
  const createMockSocket = (
    config: {
      connectError?: Error;
      banner?: string;
    } = {}
  ): SocketFactory => {
    return () =>
      ({
        connect: mock(() =>
          config.connectError
            ? Promise.reject(config.connectError)
            : Promise.resolve()
        ),
        read: mock(() => Promise.resolve(config.banner ?? null)),
        close: mock(() => {}),
      } as TcpSocket);
  };

  describe("execute", () => {
    it("should return healthy for successful connection", async () => {
      const strategy = new TcpHealthCheckStrategy(createMockSocket());

      const result = await strategy.execute({
        host: "localhost",
        port: 80,
        timeout: 5000,
        readBanner: false,
      });

      expect(result.status).toBe("healthy");
      expect(result.metadata?.connected).toBe(true);
      expect(result.metadata?.connectionTimeMs).toBeDefined();
    });

    it("should return unhealthy for connection error", async () => {
      const strategy = new TcpHealthCheckStrategy(
        createMockSocket({ connectError: new Error("Connection refused") })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 12345,
        timeout: 5000,
        readBanner: false,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Connection refused");
      expect(result.metadata?.connected).toBe(false);
    });

    it("should read banner when requested", async () => {
      const strategy = new TcpHealthCheckStrategy(
        createMockSocket({ banner: "SSH-2.0-OpenSSH" })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 22,
        timeout: 5000,
        readBanner: true,
      });

      expect(result.status).toBe("healthy");
      expect(result.metadata?.banner).toBe("SSH-2.0-OpenSSH");
    });

    it("should pass connectionTime assertion when below threshold", async () => {
      const strategy = new TcpHealthCheckStrategy(createMockSocket());

      const result = await strategy.execute({
        host: "localhost",
        port: 80,
        timeout: 5000,
        readBanner: false,
        assertions: [
          { field: "connectionTime", operator: "lessThan", value: 1000 },
        ],
      });

      expect(result.status).toBe("healthy");
    });

    it("should pass banner assertion with matching pattern", async () => {
      const strategy = new TcpHealthCheckStrategy(
        createMockSocket({ banner: "SSH-2.0-OpenSSH_8.9" })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 22,
        timeout: 5000,
        readBanner: true,
        assertions: [{ field: "banner", operator: "contains", value: "SSH" }],
      });

      expect(result.status).toBe("healthy");
    });

    it("should fail banner assertion when not matching", async () => {
      const strategy = new TcpHealthCheckStrategy(
        createMockSocket({ banner: "HTTP/1.1 200 OK" })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 80,
        timeout: 5000,
        readBanner: true,
        assertions: [{ field: "banner", operator: "contains", value: "SSH" }],
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Assertion failed");
    });

    it("should close socket after execution", async () => {
      const closeMock = mock(() => {});
      const strategy = new TcpHealthCheckStrategy(() => ({
        connect: mock(() => Promise.resolve()),
        read: mock(() => Promise.resolve(undefined)),
        close: closeMock,
      }));

      await strategy.execute({
        host: "localhost",
        port: 80,
        timeout: 5000,
        readBanner: false,
      });

      expect(closeMock).toHaveBeenCalled();
    });
  });

  describe("aggregateResult", () => {
    it("should calculate averages correctly", () => {
      const strategy = new TcpHealthCheckStrategy();
      const runs = [
        {
          id: "1",
          status: "healthy" as const,
          latencyMs: 10,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: true,
            connectionTimeMs: 10,
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
            connectionTimeMs: 20,
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.avgConnectionTime).toBe(15);
      expect(aggregated.successRate).toBe(100);
      expect(aggregated.errorCount).toBe(0);
    });

    it("should count errors and calculate success rate", () => {
      const strategy = new TcpHealthCheckStrategy();
      const runs = [
        {
          id: "1",
          status: "healthy" as const,
          latencyMs: 10,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: true,
            connectionTimeMs: 10,
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
            connectionTimeMs: 0,
            error: "Connection refused",
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.successRate).toBe(50);
      expect(aggregated.errorCount).toBe(1);
    });
  });
});
