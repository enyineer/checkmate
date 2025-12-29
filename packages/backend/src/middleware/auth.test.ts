import { describe, it, expect, mock } from "bun:test";
import { Hono } from "hono";
import { createAuthMiddleware } from "./auth";
import { PluginManager } from "../plugin-manager";
import {
  coreServices,
  authenticationStrategyServiceRef,
} from "@checkmate/backend-api";

// Mock dependencies
const mockVerify = mock();
mock.module("../services/jwt", () => ({
  jwtService: {
    verify: mockVerify,
  },
}));

describe("Auth Middleware", () => {
  const pluginManager = new PluginManager();

  // Helper to create app with middleware
  const createApp = () => {
    const app = new Hono();
    app.use("*", createAuthMiddleware(pluginManager));
    app.get("/", (c) => c.text("Protected Content"));
    return app;
  };

  it("should allow request with valid Service Token", async () => {
    mockVerify.mockResolvedValueOnce({ sub: "service" });
    const app = createApp();

    const res = await app.request("/", {
      headers: {
        Authorization: "Bearer valid-service-token",
      },
    });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Protected Content");
    expect(mockVerify).toHaveBeenCalledWith("valid-service-token");
  });

  it("should allow request with valid User Session (via Auth Strategy)", async () => {
    mockVerify.mockResolvedValueOnce(undefined); // Not a service token

    const mockValidate = mock().mockResolvedValue({ id: "user" });
    const mockGetService = mock().mockResolvedValue({
      validate: mockValidate,
    });
    // Inject mock into pluginManager
    pluginManager.getService = mockGetService;

    const app = createApp();

    const res = await app.request("/", {
      headers: {
        // Can be any header or cookie, authStrategy.validate handles it
        Cookie: "session=valid-session",
      },
    });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Protected Content");
    expect(mockGetService).toHaveBeenCalledWith(
      authenticationStrategyServiceRef
    );
    expect(mockValidate).toHaveBeenCalled();
  });

  it("should return 401 if both strategies fail", async () => {
    mockVerify.mockResolvedValue(undefined);
    // Mock Auth Strategy that returns null (invalid user)
    const mockValidate = mock().mockResolvedValue(null);
    pluginManager.getService = mock().mockResolvedValue({
      validate: mockValidate,
    });

    const app = createApp();

    const res = await app.request("/", {
      headers: { Authorization: "Bearer invalid-token" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized: Invalid token or session");
  });

  it("should return 401 if no credentials provided and Auth Strategy fails", async () => {
    mockVerify.mockResolvedValue(undefined);
    // Mock Auth Strategy that returns null
    pluginManager.getService = mock().mockResolvedValue({
      validate: mock().mockResolvedValue(null),
    });

    const app = createApp();

    // No headers
    const res = await app.request("/");

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe(
      "Unauthorized: Invalid token or session"
    );
  });
});
