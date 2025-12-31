import { describe, it, expect } from "bun:test";
import { createSignal, type Signal, type SignalMessage } from "../src/index";
import { z } from "zod";

describe("createSignal", () => {
  it("should create a signal with the given id and schema", () => {
    const schema = z.object({ message: z.string() });
    const signal = createSignal("test.signal", schema);

    expect(signal.id).toBe("test.signal");
    expect(signal.payloadSchema).toBe(schema);
  });

  it("should create signals with different payload types", () => {
    const stringSignal = createSignal("string.signal", z.string());
    const numberSignal = createSignal("number.signal", z.number());
    const objectSignal = createSignal(
      "object.signal",
      z.object({
        id: z.string(),
        count: z.number(),
        active: z.boolean(),
      })
    );

    expect(stringSignal.id).toBe("string.signal");
    expect(numberSignal.id).toBe("number.signal");
    expect(objectSignal.id).toBe("object.signal");
  });

  it("should validate payload against schema", () => {
    const signal = createSignal(
      "notification.received",
      z.object({
        id: z.string(),
        title: z.string(),
        importance: z.enum(["info", "warning", "critical"]),
      })
    );

    // Valid payload
    const validPayload = {
      id: "n-123",
      title: "Test Notification",
      importance: "info" as const,
    };
    const validResult = signal.payloadSchema.safeParse(validPayload);
    expect(validResult.success).toBe(true);

    // Invalid payload - missing required field
    const invalidPayload = {
      id: "n-123",
      title: "Test",
    };
    const invalidResult = signal.payloadSchema.safeParse(invalidPayload);
    expect(invalidResult.success).toBe(false);

    // Invalid payload - wrong enum value
    const wrongEnumPayload = {
      id: "n-123",
      title: "Test",
      importance: "urgent",
    };
    const wrongEnumResult = signal.payloadSchema.safeParse(wrongEnumPayload);
    expect(wrongEnumResult.success).toBe(false);
  });

  it("should support nested object schemas", () => {
    const signal = createSignal(
      "complex.signal",
      z.object({
        user: z.object({
          id: z.string(),
          name: z.string(),
        }),
        metadata: z.record(z.string(), z.string()),
        tags: z.array(z.string()),
      })
    );

    const payload = {
      user: { id: "u-1", name: "Test User" },
      metadata: { source: "api" },
      tags: ["important", "system"],
    };

    const result = signal.payloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should support optional fields in schema", () => {
    const signal = createSignal(
      "optional.signal",
      z.object({
        required: z.string(),
        optional: z.string().optional(),
      })
    );

    // With optional field
    const withOptional = signal.payloadSchema.safeParse({
      required: "value",
      optional: "optional value",
    });
    expect(withOptional.success).toBe(true);

    // Without optional field
    const withoutOptional = signal.payloadSchema.safeParse({
      required: "value",
    });
    expect(withoutOptional.success).toBe(true);
  });
});

describe("Signal type inference", () => {
  it("should correctly infer payload type from schema", () => {
    const signal = createSignal(
      "typed.signal",
      z.object({
        count: z.number(),
        name: z.string(),
      })
    );

    // TypeScript should infer that payload is { count: number, name: string }
    type InferredPayload = z.infer<typeof signal.payloadSchema>;

    // This test ensures the types compile correctly
    const payload: InferredPayload = { count: 42, name: "test" };
    expect(payload.count).toBe(42);
    expect(payload.name).toBe("test");
  });
});

describe("SignalMessage structure", () => {
  it("should have correct message envelope structure", () => {
    const message: SignalMessage<{ text: string }> = {
      signalId: "test.message",
      payload: { text: "Hello" },
      timestamp: new Date().toISOString(),
    };

    expect(message.signalId).toBe("test.message");
    expect(message.payload.text).toBe("Hello");
    expect(typeof message.timestamp).toBe("string");
  });
});

describe("Signal ID conventions", () => {
  it("should follow dot-notation naming convention", () => {
    const signals = [
      createSignal("notification.received", z.string()),
      createSignal("notification.read", z.string()),
      createSignal("system.maintenance.scheduled", z.string()),
      createSignal("healthcheck.status.changed", z.string()),
    ];

    for (const signal of signals) {
      expect(signal.id).toMatch(/^[a-z]+(\.[a-z]+)+$/);
    }
  });
});
