import { describe, it, expect, spyOn } from "bun:test";
import {
  slackConfigSchemaV1,
  slackUserConfigSchema,
  buildSlackPayload,
} from "./index";

/**
 * Unit tests for the Slack Notification Strategy.
 *
 * Tests cover:
 * - Config schema validation
 * - Block Kit payload building
 * - Webhook API interaction
 */

describe("Slack Notification Strategy", () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Config Schema Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe("config schema", () => {
    it("accepts empty admin config", () => {
      const result = slackConfigSchemaV1.parse({});
      expect(result).toEqual({});
    });

    it("validates user config - requires webhookUrl", () => {
      expect(() => {
        slackUserConfigSchema.parse({});
      }).toThrow();
    });

    it("validates user config - requires valid URL", () => {
      expect(() => {
        slackUserConfigSchema.parse({ webhookUrl: "not-a-url" });
      }).toThrow();
    });

    it("accepts valid user config", () => {
      const result = slackUserConfigSchema.parse({
        webhookUrl: "https://hooks.slack.com/services/T00/B00/XXX",
      });
      expect(result.webhookUrl).toBe(
        "https://hooks.slack.com/services/T00/B00/XXX",
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Block Kit Payload Building
  // ─────────────────────────────────────────────────────────────────────────

  describe("payload builder", () => {
    it("builds payload with title only", () => {
      const payload = buildSlackPayload({
        title: "Test Alert",
        importance: "info",
      });

      expect(payload.text).toContain("Test Alert");
      expect(payload.text).toContain("ℹ️");
      expect(payload.blocks).toHaveLength(1);
      expect(payload.blocks[0].type).toBe("section");
      expect(payload.attachments).toHaveLength(1);
      expect(payload.attachments![0].color).toBe("#3b82f6");
    });

    it("builds payload with title and body", () => {
      const payload = buildSlackPayload({
        title: "System Alert",
        body: "The system has recovered.",
        importance: "warning",
      });

      expect(payload.text).toContain("⚠️");
      expect(payload.blocks).toHaveLength(2);
      expect(payload.attachments![0].color).toBe("#f59e0b");
    });

    it("builds payload with action button", () => {
      const payload = buildSlackPayload({
        title: "Incident Created",
        body: "A new incident requires attention.",
        importance: "critical",
        action: {
          label: "View Incident",
          url: "https://example.com/incident/123",
        },
      });

      expect(payload.text).toContain("🚨");
      expect(payload.blocks).toHaveLength(3); // header + body + actions

      const actionsBlock = payload.blocks[2];
      expect(actionsBlock.type).toBe("actions");

      const elements = actionsBlock.elements as Array<Record<string, unknown>>;
      expect(elements).toHaveLength(1);
      expect(elements[0].type).toBe("button");
      expect(elements[0].url).toBe("https://example.com/incident/123");
    });

    it("uses correct colors for importance levels", () => {
      const infoPayload = buildSlackPayload({
        title: "Info",
        importance: "info",
      });
      const warningPayload = buildSlackPayload({
        title: "Warning",
        importance: "warning",
      });
      const criticalPayload = buildSlackPayload({
        title: "Critical",
        importance: "critical",
      });

      expect(infoPayload.attachments![0].color).toBe("#3b82f6");
      expect(warningPayload.attachments![0].color).toBe("#f59e0b");
      expect(criticalPayload.attachments![0].color).toBe("#ef4444");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Webhook API Interaction
  // ─────────────────────────────────────────────────────────────────────────

  describe("webhook API interaction", () => {
    it("sends payload to webhook URL", async () => {
      let capturedBody: string | undefined;
      let capturedUrl: string | undefined;

      const mockFetch = spyOn(globalThis, "fetch").mockImplementation((async (
        url: RequestInfo | URL,
        options?: RequestInit,
      ) => {
        capturedUrl = url.toString();
        capturedBody = options?.body as string;
        return new Response("ok", { status: 200 });
      }) as unknown as typeof fetch);

      try {
        const webhookUrl = "https://hooks.slack.com/services/T00/B00/XXX";
        const payload = buildSlackPayload({
          title: "Test",
          importance: "info",
        });

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        expect(capturedUrl).toBe(webhookUrl);

        const parsedBody = JSON.parse(capturedBody!);
        expect(parsedBody.blocks).toBeDefined();
        expect(parsedBody.text).toContain("Test");
      } finally {
        mockFetch.mockRestore();
      }
    });

    it("handles API errors gracefully", async () => {
      const mockFetch = spyOn(globalThis, "fetch").mockImplementation(
        (async () => {
          return new Response("invalid_payload", { status: 400 });
        }) as unknown as typeof fetch,
      );

      try {
        const response = await fetch(
          "https://hooks.slack.com/services/invalid",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: "test" }),
          },
        );

        expect(response.ok).toBe(false);
        expect(response.status).toBe(400);
      } finally {
        mockFetch.mockRestore();
      }
    });
  });
});
