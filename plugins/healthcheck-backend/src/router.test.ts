import { describe, it, expect, mock } from "bun:test";
import { createHealthCheckRouter } from "./router";
import { createMockRpcContext } from "@checkmate/backend-api";
import { call } from "@orpc/server";
import { z } from "zod";

describe("HealthCheck Router", () => {
  const mockUser = {
    id: "test-user",
    permissions: ["*"],
    roles: ["admin"],
  };

  // Create a mock database with the methods used by HealthCheckService
  const createSelectMock = () => {
    const fromResult = Object.assign(Promise.resolve([]), {
      where: mock(() => Promise.resolve([])),
    });
    return {
      from: mock(() => fromResult),
    };
  };

  const mockDb = {
    select: mock(() => createSelectMock()),
    insert: mock(() => ({
      values: mock(() => ({
        returning: mock(() => Promise.resolve([])),
      })),
    })),
  } as any;

  const router = createHealthCheckRouter(mockDb);

  it("getStrategies returns strategies from registry", async () => {
    const context = createMockRpcContext({
      user: mockUser,
      healthCheckRegistry: {
        getStrategies: mock().mockReturnValue([
          {
            id: "http",
            displayName: "HTTP",
            description: "Check HTTP",
            configSchema: z.object({}),
          },
        ]),
      } as any,
    });

    const result = await call(router.getStrategies, undefined, { context });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("http");
  });

  it("getConfigurations calls service", async () => {
    const context = createMockRpcContext({
      user: mockUser,
    });

    const result = await call(router.getConfigurations, undefined, { context });
    expect(Array.isArray(result)).toBe(true);
  });
});
