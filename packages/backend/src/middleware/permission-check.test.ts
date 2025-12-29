import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Hono } from "hono";
import {
  coreServices,
  authenticationStrategyServiceRef,
} from "@checkmate/backend-api";
import { PluginManager } from "../plugin-manager";

// We want to test the PERMISSION CHECK middleware.
// It is registered in PluginManager.registerCoreServices or loadPlugins.
// Let's look at how we can get it.

describe("permissionCheck middleware", () => {
  let pluginManager: PluginManager;
  let mockAuthService: {
    validate: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    pluginManager = new PluginManager();
    mockAuthService = {
      validate: mock(),
    };
    // Register mock auth strategy
    pluginManager.registerService(
      authenticationStrategyServiceRef,
      mockAuthService as any
    );
  });

  it("should allow access if user has the permission", async () => {
    const authService = await pluginManager.getService(coreServices.auth);
    if (!authService) throw new Error("authService not found");

    const middleware = authService.authorize("read-docs");
    const app = new Hono();
    app.get("/test", middleware, (c) => c.text("success"));

    mockAuthService.validate.mockResolvedValue({
      id: "user-1",
      permissions: ["core.read-docs"], // Mocking core plugin ID as default requester
    });

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("success");
  });

  it("should block access if user is missing permission", async () => {
    const authService = await pluginManager.getService(coreServices.auth);
    if (!authService) throw new Error("authService not found");

    const middleware = authService.authorize("write-docs");
    const app = new Hono();
    app.get("/test", middleware, (c) => c.text("success"));

    mockAuthService.validate.mockResolvedValue({
      id: "user-1",
      permissions: ["core.read-docs"],
    });

    const res = await app.request("/test");
    expect(res.status).toBe(403);
    expect(await res.text()).toContain("Forbidden");
  });

  it("should allow access if user is admin (wildcard permission)", async () => {
    const authService = await pluginManager.getService(coreServices.auth);
    if (!authService) throw new Error("authService not found");

    const middleware = authService.authorize("any-permission");
    const app = new Hono();
    app.get("/test", middleware, (c) => c.text("success"));

    mockAuthService.validate.mockResolvedValue({
      id: "admin-1",
      permissions: ["*"],
    });

    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });

  it("should return 401 if unauthorized", async () => {
    const authService = await pluginManager.getService(coreServices.auth);
    const middleware = authService!.authorize("read");
    const app = new Hono();
    app.get("/test", middleware, (c) => c.text("success"));

    mockAuthService.validate.mockResolvedValue(undefined);

    const res = await app.request("/test");
    expect(res.status).toBe(401);
  });
});
