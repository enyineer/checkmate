import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Hono } from "hono";
import { coreServices } from "@checkmate/backend-api";
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
    // Register mock auth service
    pluginManager.registerService(
      coreServices.authentication,
      mockAuthService as any
    );
  });

  it("should allow access if user has the permission", async () => {
    const permissionCheckFactory = await pluginManager.getService(
      coreServices.permissionCheck
    );
    if (!permissionCheckFactory) throw new Error("permissionCheck not found");

    const middleware = (permissionCheckFactory as (p: string) => any)(
      "read-docs"
    );
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
    const permissionCheckFactory = await pluginManager.getService(
      coreServices.permissionCheck
    );
    if (!permissionCheckFactory) throw new Error("permissionCheck not found");

    const middleware = (permissionCheckFactory as (p: string) => any)(
      "write-docs"
    );
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
    const permissionCheckFactory = await pluginManager.getService(
      coreServices.permissionCheck
    );
    if (!permissionCheckFactory) throw new Error("permissionCheck not found");

    const middleware = (permissionCheckFactory as (p: string) => any)(
      "any-permission"
    );
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
    const permissionCheckFactory = await pluginManager.getService(
      coreServices.permissionCheck
    );
    const middleware = (permissionCheckFactory as (p: string) => any)("read");
    const app = new Hono();
    app.get("/test", middleware, (c) => c.text("success"));

    mockAuthService.validate.mockResolvedValue(undefined);

    const res = await app.request("/test");
    expect(res.status).toBe(401);
  });
});
