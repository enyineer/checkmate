import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  bashProvider,
  bashConfigSchemaV1,
  type BashConfig,
} from "./bash-provider";
import type { IntegrationDeliveryContext } from "@checkstack/integration-backend";

/**
 * Unit tests for the Bash Integration Provider.
 *
 * Tests cover:
 * - Config schema validation
 * - Environment variable generation
 * - Script execution (actual bash execution)
 * - Error handling
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
  configOverrides: Partial<BashConfig> = {},
  payloadOverrides: Record<string, unknown> = {},
): IntegrationDeliveryContext<BashConfig> {
  const defaultConfig: BashConfig = {
    script: 'echo "test"',
    timeout: 5000,
    ...configOverrides,
  };

  return {
    event: {
      eventId: "test-plugin.incident.created",
      payload: {
        title: "Test Incident",
        severity: "critical",
        nested: {
          field: "value",
        },
        ...payloadOverrides,
      },
      timestamp: "2024-01-15T10:30:00Z",
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

describe("BashProvider", () => {
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
      expect(bashProvider.id).toBe("bash");
      expect(bashProvider.displayName).toBe("Bash Script");
      expect(bashProvider.description).toContain("shell");
      expect(bashProvider.icon).toBe("Terminal");
    });

    it("has a versioned config schema", () => {
      expect(bashProvider.config).toBeDefined();
      expect(bashProvider.config.version).toBe(1);
    });

    it("has documentation with environment variable examples", () => {
      expect(bashProvider.documentation?.setupGuide).toBeDefined();
      expect(bashProvider.documentation?.setupGuide).toContain("EVENT_ID");
      expect(bashProvider.documentation?.setupGuide).toContain("PAYLOAD_");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Config Schema Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe("config schema", () => {
    it("requires script field", () => {
      expect(() => {
        bashConfigSchemaV1.parse({});
      }).toThrow();
    });

    it("accepts valid script", () => {
      const result = bashConfigSchemaV1.parse({
        script: 'echo "hello"',
      });
      expect(result.script).toBe('echo "hello"');
    });

    it("applies default timeout", () => {
      const result = bashConfigSchemaV1.parse({
        script: "exit 0",
      });
      expect(result.timeout).toBe(30_000);
    });

    it("validates timeout range", () => {
      expect(() => {
        bashConfigSchemaV1.parse({
          script: "exit 0",
          timeout: 500, // Too short
        });
      }).toThrow();
    });

    it("accepts working directory", () => {
      const result = bashConfigSchemaV1.parse({
        script: "pwd",
        workingDirectory: "/tmp",
      });
      expect(result.workingDirectory).toBe("/tmp");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Script Execution - Basic
  // ─────────────────────────────────────────────────────────────────────────

  describe("deliver - basic execution", () => {
    it("executes simple script and returns success", async () => {
      const context = createTestContext({
        script: 'echo "success"',
      });

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("success");
    });

    it("returns failure for non-zero exit code", async () => {
      const context = createTestContext({
        script: "exit 1",
      });

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("exited with code 1");
    });

    it("uses first line of stdout as external ID", async () => {
      const context = createTestContext({
        script: 'echo "first-line"\necho "second-line"',
      });

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("first-line");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Environment Variables
  // ─────────────────────────────────────────────────────────────────────────

  describe("deliver - environment variables", () => {
    it("provides EVENT_ID variable", async () => {
      const context = createTestContext({
        script: 'echo "$EVENT_ID"',
      });

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("test-plugin.incident.created");
    });

    it("provides SUBSCRIPTION_NAME variable", async () => {
      const context = createTestContext({
        script: 'echo "$SUBSCRIPTION_NAME"',
      });

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("Test Subscription");
    });

    it("provides PAYLOAD_* variables for simple fields", async () => {
      const context = createTestContext({
        script: 'echo "$PAYLOAD_TITLE"',
      });

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("Test Incident");
    });

    it("provides PAYLOAD_* variables for nested fields", async () => {
      const context = createTestContext({
        script: 'echo "$PAYLOAD_NESTED_FIELD"',
      });

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("value");
    });

    it("converts dashes and dots to underscores in env keys", async () => {
      const context = createTestContext(
        { script: 'echo "$PAYLOAD_FIELD_NAME"' },
        { "field-name": "dash-value" },
      );

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("dash-value");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error Handling
  // ─────────────────────────────────────────────────────────────────────────

  describe("deliver - error handling", () => {
    it("captures stderr in error message", async () => {
      const context = createTestContext({
        script: 'echo "error message" >&2; exit 1',
      });

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("error message");
    });

    it("handles invalid bash syntax", async () => {
      const context = createTestContext({
        script: "if then fi", // Invalid syntax
      });

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Timeout
  // ─────────────────────────────────────────────────────────────────────────

  describe("deliver - timeout", () => {
    it("times out long-running scripts", async () => {
      const context = createTestContext({
        script: "sleep 10; echo done",
        timeout: 1000,
      });

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("timed out");
    }, 10000);

    it("completes fast scripts within timeout", async () => {
      const context = createTestContext({
        script: "sleep 0.1; echo fast",
        timeout: 5000,
      });

      const result = await bashProvider.deliver(context);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("fast");
    });
  });
});
