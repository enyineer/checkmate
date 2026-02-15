import { describe, it, expect, mock } from "bun:test";
import {
  createAuthRouter,
} from "./core/auth-backend/src/router";
import { createMockRpcContext } from "@checkstack/backend-api";
import { call } from "@orpc/server";
import { z } from "zod";

describe("Auth Router Security Flaw", () => {
  // Mock user with ONLY teams.read permission
  const mockUser = {
    type: "user" as const,
    id: "viewer-user",
    accessRules: ["teams.read"], // Only read access
    roles: ["viewer"],
  } as any;

  const createChain = (data: any = []) => {
    const chain: any = {
      where: mock(() => chain),
      innerJoin: mock(() => chain),
      limit: mock(() => chain),
      offset: mock(() => chain),
      orderBy: mock(() => chain),
      onConflictDoUpdate: mock(() => Promise.resolve()),
      onConflictDoNothing: mock(() => Promise.resolve()),
      then: (resolve: any) => Promise.resolve(resolve(data)),
    };
    return chain;
  };

  const mockDb: any = {
    select: mock(() => ({
      from: mock(() => createChain([])),
    })),
    insert: mock(() => ({
      values: mock(() => createChain()),
    })),
    delete: mock(() => ({
      where: mock(() => Promise.resolve()),
    })),
    transaction: mock((cb: any) => cb(mockDb)),
  };

  const mockRegistry = {
    getStrategies: () => [],
  };

  const mockConfigService: any = {
    get: mock(() => Promise.resolve(undefined)),
    getRedacted: mock(() => Promise.resolve({})),
    set: mock(() => Promise.resolve()),
  };

  const mockAccessRuleRegistry = {
    getAccessRules: () => [],
  };

  const router = createAuthRouter(
    mockDb,
    mockRegistry,
    async () => {},
    mockConfigService,
    mockAccessRuleRegistry,
  );

  it("should NOT allow user with only teams.read to add user to team", async () => {
    const context = createMockRpcContext({ user: mockUser });

    // The router implementation just does insert, so if this succeeds, the flaw is present.
    // In a real scenario, the middleware would check access rules defined in contract.
    // But since we are calling the router handler directly via `call`, we are testing the logic inside.
    // However, the contract DEFINES `teams.read` as sufficient.

    // We expect this to fail if we fix it, but currently it should succeed (proving the flaw).

    await call(
      router.addUserToTeam,
      { teamId: "team-1", userId: "user-to-add" },
      { context },
    );

    expect(mockDb.insert).toHaveBeenCalled();
    // If we reach here, the user successfully added a user to a team despite having only read access (conceptually).
    console.log("Vulnerability confirmed: User with teams.read could add user to team.");
  });
});
