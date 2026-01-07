import { describe, expect, it, mock } from "bun:test";
import { SshHealthCheckStrategy, SshClient } from "./strategy";

describe("SshHealthCheckStrategy", () => {
  // Helper to create mock SSH client
  const createMockClient = (
    config: {
      exitCode?: number;
      stdout?: string;
      stderr?: string;
      execError?: Error;
      connectError?: Error;
    } = {}
  ): SshClient => ({
    connect: mock(() =>
      config.connectError
        ? Promise.reject(config.connectError)
        : Promise.resolve({
            exec: mock(() =>
              config.execError
                ? Promise.reject(config.execError)
                : Promise.resolve({
                    exitCode: config.exitCode ?? 0,
                    stdout: config.stdout ?? "",
                    stderr: config.stderr ?? "",
                  })
            ),
            end: mock(() => {}),
          })
    ),
  });

  describe("execute", () => {
    it("should return healthy for successful connection", async () => {
      const strategy = new SshHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 22,
        username: "user",
        password: "secret",
        timeout: 5000,
      });

      expect(result.status).toBe("healthy");
      expect(result.metadata?.connected).toBe(true);
    });

    it("should return healthy for successful command execution", async () => {
      const strategy = new SshHealthCheckStrategy(
        createMockClient({ exitCode: 0, stdout: "OK" })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 22,
        username: "user",
        password: "secret",
        timeout: 5000,
        command: "echo OK",
      });

      expect(result.status).toBe("healthy");
      expect(result.metadata?.commandSuccess).toBe(true);
      expect(result.metadata?.stdout).toBe("OK");
      expect(result.metadata?.exitCode).toBe(0);
    });

    it("should return unhealthy for connection error", async () => {
      const strategy = new SshHealthCheckStrategy(
        createMockClient({ connectError: new Error("Connection refused") })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 22,
        username: "user",
        password: "secret",
        timeout: 5000,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Connection refused");
      expect(result.metadata?.connected).toBe(false);
    });

    it("should return unhealthy for non-zero exit code", async () => {
      const strategy = new SshHealthCheckStrategy(
        createMockClient({ exitCode: 1, stderr: "Error" })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 22,
        username: "user",
        password: "secret",
        timeout: 5000,
        command: "exit 1",
      });

      expect(result.status).toBe("unhealthy");
      expect(result.metadata?.exitCode).toBe(1);
      expect(result.metadata?.commandSuccess).toBe(false);
    });

    it("should pass connectionTime assertion when below threshold", async () => {
      const strategy = new SshHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "localhost",
        port: 22,
        username: "user",
        password: "secret",
        timeout: 5000,
        assertions: [
          { field: "connectionTime", operator: "lessThan", value: 5000 },
        ],
      });

      expect(result.status).toBe("healthy");
    });

    it("should pass exitCode assertion", async () => {
      const strategy = new SshHealthCheckStrategy(
        createMockClient({ exitCode: 0 })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 22,
        username: "user",
        password: "secret",
        timeout: 5000,
        command: "true",
        assertions: [{ field: "exitCode", operator: "equals", value: 0 }],
      });

      expect(result.status).toBe("healthy");
    });

    it("should fail exitCode assertion when non-zero", async () => {
      const strategy = new SshHealthCheckStrategy(
        createMockClient({ exitCode: 1 })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 22,
        username: "user",
        password: "secret",
        timeout: 5000,
        command: "false",
        assertions: [{ field: "exitCode", operator: "equals", value: 0 }],
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Assertion failed");
    });

    it("should pass stdout assertion", async () => {
      const strategy = new SshHealthCheckStrategy(
        createMockClient({ stdout: "OK: Service running" })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 22,
        username: "user",
        password: "secret",
        timeout: 5000,
        command: "systemctl status myservice",
        assertions: [{ field: "stdout", operator: "contains", value: "OK" }],
      });

      expect(result.status).toBe("healthy");
    });
  });

  describe("aggregateResult", () => {
    it("should calculate averages correctly", () => {
      const strategy = new SshHealthCheckStrategy();
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
            commandTimeMs: 10,
            exitCode: 0,
            commandSuccess: true,
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
            commandTimeMs: 20,
            exitCode: 0,
            commandSuccess: true,
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.avgConnectionTime).toBe(75);
      expect(aggregated.avgCommandTime).toBe(15);
      expect(aggregated.successRate).toBe(100);
      expect(aggregated.errorCount).toBe(0);
    });

    it("should count errors", () => {
      const strategy = new SshHealthCheckStrategy();
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
            commandSuccess: false,
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
