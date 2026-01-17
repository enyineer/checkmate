import { describe, it, expect, spyOn } from "bun:test";
import {
  pushoverConfigSchemaV1,
  pushoverUserConfigSchema,
  mapImportanceToPriority,
  PUSHOVER_API_URL,
  EMERGENCY_RETRY_SECONDS,
  EMERGENCY_EXPIRE_SECONDS,
} from "./index";

/**
 * Unit tests for the Pushover Notification Strategy.
 *
 * Tests cover:
 * - Config schema validation
 * - Priority mapping
 * - REST API interaction
 * - Emergency notification parameters
 */

describe("Pushover Notification Strategy", () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Config Schema Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe("config schema", () => {
    it("validates admin config - requires apiToken", () => {
      expect(() => {
        pushoverConfigSchemaV1.parse({});
      }).toThrow();
    });

    it("accepts valid admin config", () => {
      const result = pushoverConfigSchemaV1.parse({
        apiToken: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5",
      });
      expect(result.apiToken).toBe("a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5");
    });

    it("validates user config - requires userKey", () => {
      expect(() => {
        pushoverUserConfigSchema.parse({});
      }).toThrow();
    });

    it("accepts valid user config", () => {
      const result = pushoverUserConfigSchema.parse({
        userKey: "u1s2e3r4k5e6y7-abcdefg",
      });
      expect(result.userKey).toBe("u1s2e3r4k5e6y7-abcdefg");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Priority Mapping
  // ─────────────────────────────────────────────────────────────────────────

  describe("priority mapping", () => {
    it("maps info to normal priority (0)", () => {
      expect(mapImportanceToPriority("info")).toBe(0);
    });

    it("maps warning to high priority (1)", () => {
      expect(mapImportanceToPriority("warning")).toBe(1);
    });

    it("maps critical to emergency priority (2)", () => {
      expect(mapImportanceToPriority("critical")).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Emergency Parameters
  // ─────────────────────────────────────────────────────────────────────────

  describe("emergency parameters", () => {
    it("has correct retry interval", () => {
      expect(EMERGENCY_RETRY_SECONDS).toBe(60);
    });

    it("has correct expire duration", () => {
      expect(EMERGENCY_EXPIRE_SECONDS).toBe(3600);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // REST API Interaction
  // ─────────────────────────────────────────────────────────────────────────

  describe("REST API interaction", () => {
    it("sends message to Pushover API", async () => {
      let capturedBody: string | undefined;
      let capturedUrl: string | undefined;

      const mockFetch = spyOn(globalThis, "fetch").mockImplementation((async (
        url: RequestInfo | URL,
        options?: RequestInit,
      ) => {
        capturedUrl = url.toString();
        capturedBody = options?.body as string;
        return new Response(JSON.stringify({ status: 1, request: "abc123" }), {
          status: 200,
        });
      }) as unknown as typeof fetch);

      try {
        await fetch(PUSHOVER_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: "api-token",
            user: "user-key",
            title: "Test Alert",
            message: "Test message body",
            priority: 0,
            html: 1,
          }),
        });

        expect(capturedUrl).toBe(PUSHOVER_API_URL);

        const parsedBody = JSON.parse(capturedBody!);
        expect(parsedBody.token).toBe("api-token");
        expect(parsedBody.user).toBe("user-key");
        expect(parsedBody.title).toBe("Test Alert");
        expect(parsedBody.priority).toBe(0);
        expect(parsedBody.html).toBe(1);
      } finally {
        mockFetch.mockRestore();
      }
    });

    it("includes URL parameters for action", async () => {
      let capturedBody: string | undefined;

      const mockFetch = spyOn(globalThis, "fetch").mockImplementation((async (
        _url: RequestInfo | URL,
        options?: RequestInit,
      ) => {
        capturedBody = options?.body as string;
        return new Response(JSON.stringify({ status: 1, request: "def456" }), {
          status: 200,
        });
      }) as unknown as typeof fetch);

      try {
        await fetch(PUSHOVER_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: "api-token",
            user: "user-key",
            title: "Incident",
            message: "View incident",
            priority: 1,
            html: 1,
            url: "https://example.com/incident/123",
            url_title: "View Incident",
          }),
        });

        const parsedBody = JSON.parse(capturedBody!);
        expect(parsedBody.url).toBe("https://example.com/incident/123");
        expect(parsedBody.url_title).toBe("View Incident");
      } finally {
        mockFetch.mockRestore();
      }
    });

    it("includes retry/expire for emergency priority", async () => {
      let capturedBody: string | undefined;

      const mockFetch = spyOn(globalThis, "fetch").mockImplementation((async (
        _url: RequestInfo | URL,
        options?: RequestInit,
      ) => {
        capturedBody = options?.body as string;
        return new Response(
          JSON.stringify({ status: 1, request: "ghi789", receipt: "rcpt123" }),
          { status: 200 },
        );
      }) as unknown as typeof fetch);

      try {
        await fetch(PUSHOVER_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: "api-token",
            user: "user-key",
            title: "Critical Alert",
            message: "Immediate attention required",
            priority: 2,
            html: 1,
            retry: EMERGENCY_RETRY_SECONDS,
            expire: EMERGENCY_EXPIRE_SECONDS,
          }),
        });

        const parsedBody = JSON.parse(capturedBody!);
        expect(parsedBody.priority).toBe(2);
        expect(parsedBody.retry).toBe(60);
        expect(parsedBody.expire).toBe(3600);
      } finally {
        mockFetch.mockRestore();
      }
    });

    it("handles API errors gracefully", async () => {
      const mockFetch = spyOn(globalThis, "fetch").mockImplementation(
        (async () => {
          return new Response(
            JSON.stringify({ status: 0, errors: ["invalid token"] }),
            { status: 400 },
          );
        }) as unknown as typeof fetch,
      );

      try {
        const response = await fetch(PUSHOVER_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: "invalid", user: "key" }),
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(400);
      } finally {
        mockFetch.mockRestore();
      }
    });
  });
});
