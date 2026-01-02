import { describe, it, expect } from "bun:test";

/**
 * Basic structural tests for notification-backend.
 *
 * Note: Full integration tests with mocked DB chains are complex due to
 * oRPC middleware validation. These tests verify module exports and basic imports.
 * More comprehensive testing should be done via integration tests with a real test DB.
 */

describe("Notification Backend Module", () => {
  it("exports createNotificationRouter", async () => {
    const { createNotificationRouter } = await import("./router");
    expect(createNotificationRouter).toBeDefined();
    expect(typeof createNotificationRouter).toBe("function");
  });

  it("exports schema tables", async () => {
    const schema = await import("./schema");
    expect(schema.notifications).toBeDefined();
    expect(schema.notificationGroups).toBeDefined();
    expect(schema.notificationSubscriptions).toBeDefined();
  });

  it("exports plugin default", async () => {
    const plugin = await import("./index");
    expect(plugin.default).toBeDefined();
  });

  it("exports service functions", async () => {
    const service = await import("./service");
    expect(service.getUserNotifications).toBeDefined();
    expect(service.getUnreadCount).toBeDefined();
    expect(service.markAsRead).toBeDefined();
    expect(service.subscribeToGroup).toBeDefined();
    expect(service.unsubscribeFromGroup).toBeDefined();
  });
});
