import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  scriptProvider,
  scriptConfigSchemaV1,
  type ScriptConfig,
} from "./provider";
import type { IntegrationDeliveryContext } from "@checkstack/integration-backend";

/**
 * Unit tests for the Script Integration Provider.
 *
 * Tests cover:
 * - Config schema validation
 * - Successful script execution
 * - Context access (event payload, subscription info)
 * - Error handling
 * - Timeout protection
 * - Console logging
 */

// Mock logger
const mockLogger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
};

// Create a test delivery context
function createTestContext(
  configOverrides: Partial<ScriptConfig> = {},
): IntegrationDeliveryContext<ScriptConfig> {
  const defaultConfig: ScriptConfig = {
    script: 'return { id: "test" };',
    timeout: 5000,
    ...configOverrides,
  };

  return {
    event: {
      eventId: "test-plugin.incident.created",
      payload: {
        incidentId: "inc-123",
        title: "Test Incident",
        severity: "critical",
      },
      timestamp: new Date().toISOString(),
      deliveryId: "del-456",
    },
    subscription: {
      id: "sub-789",
      name: "Test Subscription",
    },
    providerConfig: defaultConfig,
    logger: mockLogger,
  };
}

describe("ScriptProvider", () => {
  beforeEach(() => {
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Provider Metadata
  // ─────────────────────────────────────────────────────────────────────────

  describe("metadata", () => {
    it("has correct basic metadata", () => {
      expect(scriptProvider.id).toBe("script");
      expect(scriptProvider.displayName).toBe("Script");
      expect(scriptProvider.description).toContain("TypeScript");
      expect(scriptProvider.icon).toBe("Code");
    });

    it("has a versioned config schema", () => {
      expect(scriptProvider.config).toBeDefined();
      expect(scriptProvider.config.version).toBe(1);
    });

    it("has documentation", () => {
      expect(scriptProvider.documentation?.setupGuide).toBeDefined();
      expect(scriptProvider.documentation?.setupGuide).toContain(
        "context.event.payload",
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Config Schema Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe("config schema", () => {
    it("requires script field", () => {
      expect(() => {
        scriptConfigSchemaV1.parse({});
      }).toThrow();
    });

    it("accepts valid script", () => {
      const result = scriptConfigSchemaV1.parse({
        script: 'console.log("hello");',
      });
      expect(result.script).toBe('console.log("hello");');
    });

    it("applies default timeout", () => {
      const result = scriptConfigSchemaV1.parse({
        script: "return 1;",
      });
      expect(result.timeout).toBe(10_000);
    });

    it("validates timeout range", () => {
      expect(() => {
        scriptConfigSchemaV1.parse({
          script: "return 1;",
          timeout: 500, // Too short
        });
      }).toThrow();

      expect(() => {
        scriptConfigSchemaV1.parse({
          script: "return 1;",
          timeout: 100_000, // Too long
        });
      }).toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Script Execution - Basic
  // ─────────────────────────────────────────────────────────────────────────

  describe("deliver - basic execution", () => {
    it("executes simple script and returns success", async () => {
      const context = createTestContext({
        script: 'return { id: "executed" };',
      });

      const result = await scriptProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("executed");
    });

    it("handles script with no return value", async () => {
      const context = createTestContext({
        script: "const x = 1 + 1;",
      });

      const result = await scriptProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBeUndefined();
    });

    it("handles async script", async () => {
      const context = createTestContext({
        script: `
          await Promise.resolve();
          return { id: "async-result" };
        `,
      });

      const result = await scriptProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("async-result");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Script Execution - Context Access
  // ─────────────────────────────────────────────────────────────────────────

  describe("deliver - context access", () => {
    it("can access event payload", async () => {
      const context = createTestContext({
        script: `
          const title = context.event.payload.title;
          return { id: title };
        `,
      });

      const result = await scriptProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("Test Incident");
    });

    it("can access event metadata", async () => {
      const context = createTestContext({
        script: `
          return { id: context.event.eventId };
        `,
      });

      const result = await scriptProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("test-plugin.incident.created");
    });

    it("can access subscription info", async () => {
      const context = createTestContext({
        script: `
          return { id: context.subscription.name };
        `,
      });

      const result = await scriptProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("Test Subscription");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Script Execution - Console Logging
  // ─────────────────────────────────────────────────────────────────────────

  describe("deliver - console logging", () => {
    it("captures console.log calls", async () => {
      const context = createTestContext({
        script: `
          console.log("Hello from script");
          return { id: "logged" };
        `,
      });

      await scriptProvider.deliver(context);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Hello from script"),
      );
    });

    it("captures console.warn calls", async () => {
      const context = createTestContext({
        script: `
          console.warn("Warning message");
          return { id: "warned" };
        `,
      });

      await scriptProvider.deliver(context);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Warning message"),
      );
    });

    it("captures console.error calls", async () => {
      const context = createTestContext({
        script: `
          console.error("Error message");
          return { id: "errored" };
        `,
      });

      await scriptProvider.deliver(context);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Error message"),
      );
    });

    it("logs objects as JSON", async () => {
      const context = createTestContext({
        script: `
          console.log({ key: "value" });
          return { id: "json" };
        `,
      });

      await scriptProvider.deliver(context);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('{"key":"value"}'),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Script Execution - Error Handling
  // ─────────────────────────────────────────────────────────────────────────

  describe("deliver - error handling", () => {
    it("handles script syntax errors", async () => {
      const context = createTestContext({
        script: "const x = {", // Invalid syntax
      });

      const result = await scriptProvider.deliver(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Script error");
    });

    it("handles runtime errors", async () => {
      const context = createTestContext({
        script: `
          throw new Error("Script failed");
        `,
      });

      const result = await scriptProvider.deliver(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Script failed");
    });

    it("handles undefined variable access", async () => {
      const context = createTestContext({
        script: `
          return undefinedVariable.property;
        `,
      });

      const result = await scriptProvider.deliver(context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Script Execution - Timeout
  // ─────────────────────────────────────────────────────────────────────────

  describe("deliver - timeout", () => {
    it("times out long-running scripts", async () => {
      const context = createTestContext({
        script: `
          await new Promise(resolve => setTimeout(resolve, 5000));
          return { id: "never" };
        `,
        timeout: 1000, // Use minimum allowed timeout
      });

      const result = await scriptProvider.deliver(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("timed out");
    }, 10000);

    it("completes fast scripts within timeout", async () => {
      const context = createTestContext({
        script: `
          await new Promise(resolve => setTimeout(resolve, 10));
          return { id: "fast" };
        `,
        timeout: 5000,
      });

      const result = await scriptProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("fast");
    });
  });
});
