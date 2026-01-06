---
title: Integration Providers
parent: Backend
---

# Integration Providers

This guide explains how to create custom integration providers that deliver platform events to external systems.

## Overview

An **integration provider** is a plugin that handles event delivery to a specific external system. Examples include:

- **Webhook**: Generic HTTP POST to any endpoint
- **Slack**: Posts messages to Slack channels
- **Jira**: Creates or updates Jira issues
- **PagerDuty**: Triggers alerts in PagerDuty

## Provider Interface

```typescript
interface IntegrationProvider<TConfig> {
  /** Local identifier, namespaced on registration */
  id: string;
  
  /** Display name for UI */
  displayName: string;
  
  /** Description of what this provider does */
  description?: string;
  
  /** Lucide icon name for UI */
  icon?: string;
  
  /** Provider-specific configuration schema */
  config: VersionedConfig<TConfig>;
  
  /** Events this provider can handle (undefined = all) */
  supportedEvents?: string[];
  
  /** Deliver an event to the external system */
  deliver(context: IntegrationDeliveryContext<TConfig>): Promise<IntegrationDeliveryResult>;
  
  /** Optional: Test the provider configuration */
  testConnection?(config: TConfig): Promise<TestConnectionResult>;
}
```

## Creating a Provider Plugin

### 1. Create the Plugin Package

```bash
mkdir -p plugins/integration-myservice-backend/src
```

**package.json**:
```json
{
  "name": "@checkmate-monitor/integration-myservice-backend",
  "version": "0.0.1",
  "type": "module",
  "main": "src/index.ts",
  "dependencies": {
    "@checkmate-monitor/backend-api": "workspace:*",
    "@checkmate-monitor/integration-backend": "workspace:*",
    "@checkmate-monitor/integration-common": "workspace:*",
    "@checkmate-monitor/common": "workspace:*",
    "zod": "^4.2.1"
  }
}
```

### 2. Define the Configuration Schema

Use Zod to define the provider's configuration. Use `secret()` for sensitive fields:

```typescript
// src/provider.ts
import { z } from "zod";
import { Versioned, secret } from "@checkmate-monitor/backend-api";

export const myServiceConfigSchemaV1 = z.object({
  // Required fields
  apiEndpoint: z.string().url().describe("Service API endpoint"),
  
  // Secret fields (encrypted at rest)
  apiKey: secret({ description: "API Key for authentication" }),
  
  // Optional fields with defaults
  timeout: z.number()
    .min(1_000)
    .max(60_000)
    .default(10_000)
    .describe("Request timeout in milliseconds"),
  
  // Enum fields
  priority: z.enum(["low", "medium", "high"])
    .default("medium")
    .describe("Alert priority level"),
});

export type MyServiceConfig = z.infer<typeof myServiceConfigSchemaV1>;
```

### 3. Implement the Provider

```typescript
// src/provider.ts (continued)
import type {
  IntegrationProvider,
  IntegrationDeliveryContext,
  IntegrationDeliveryResult,
  TestConnectionResult,
  VersionedConfig,
} from "@checkmate-monitor/integration-common";

export const myServiceProvider: IntegrationProvider<MyServiceConfig> = {
  id: "myservice",
  displayName: "My Service",
  description: "Deliver events to My Service",
  icon: "Bell", // Lucide icon name

  config: new Versioned({
    version: 1,
    schema: myServiceConfigSchemaV1,
  }) as VersionedConfig<MyServiceConfig>,

  // Optional: Limit which events this provider accepts
  // supportedEvents: ["incident.created", "incident.resolved"],

  async deliver(
    context: IntegrationDeliveryContext<MyServiceConfig>
  ): Promise<IntegrationDeliveryResult> {
    const { event, subscription, providerConfig, logger } = context;

    try {
      logger.debug(`Delivering to My Service: ${event.eventId}`);

      // Make the API call
      const response = await fetch(providerConfig.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${providerConfig.apiKey}`,
        },
        body: JSON.stringify({
          event_type: event.eventId,
          timestamp: event.timestamp,
          delivery_id: event.deliveryId,
          subscription_name: subscription.name,
          data: event.payload,
        }),
        signal: AbortSignal.timeout(providerConfig.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText.slice(0, 200)}`,
          // Optionally request retry after delay
          retryAfterMs: response.status === 429 ? 60_000 : undefined,
        };
      }

      // Parse response to get external ID if available
      const json = await response.json();
      
      return {
        success: true,
        externalId: json.id, // ID from external system
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Delivery failed: ${message}`);

      // Network errors should trigger retry
      if (message.includes("timeout") || message.includes("ECONNREFUSED")) {
        return {
          success: false,
          error: message,
          retryAfterMs: 30_000,
        };
      }

      return {
        success: false,
        error: message,
      };
    }
  },

  // Optional: Test connection functionality
  async testConnection(config: MyServiceConfig): Promise<TestConnectionResult> {
    try {
      const response = await fetch(`${config.apiEndpoint}/health`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
        },
        signal: AbortSignal.timeout(5_000),
      });

      if (response.ok) {
        return { success: true, message: "Connection successful" };
      }

      return {
        success: false,
        message: `Server returned ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },
};
```

### 4. Register the Provider

```typescript
// src/index.ts
import { createBackendPlugin, coreServices } from "@checkmate-monitor/backend-api";
import { integrationProviderExtensionPoint } from "@checkmate-monitor/integration-backend";
import { definePluginMetadata } from "@checkmate-monitor/common";
import { myServiceProvider } from "./provider";

const pluginMetadata = definePluginMetadata({
  pluginId: "integration-myservice",
});

export default createBackendPlugin({
  metadata: pluginMetadata,

  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
      },
      init: async ({ logger }) => {
        logger.debug("Registering My Service Integration Provider...");

        // Get the integration provider extension point
        const extensionPoint = env.getExtensionPoint(
          integrationProviderExtensionPoint
        );

        // Register the provider
        extensionPoint.addProvider(myServiceProvider, pluginMetadata);

        logger.debug("My Service Integration Provider registered.");
      },
    });
  },
});
```

## Delivery Context

The `deliver()` method receives a context object with:

```typescript
interface IntegrationDeliveryContext<TConfig> {
  event: {
    eventId: string;      // Fully qualified: "incident.incident.created"
    payload: Record<string, unknown>;  // Event data
    timestamp: string;    // ISO timestamp
    deliveryId: string;   // Unique delivery attempt ID
  };
  subscription: {
    id: string;           // Subscription ID
    name: string;         // User-defined name
  };
  providerConfig: TConfig;  // Configuration for this subscription
  logger: IntegrationLogger;  // Scoped logger for tracing
}
```

## Delivery Result

Return a result indicating success or failure:

```typescript
interface IntegrationDeliveryResult {
  success: boolean;
  
  /** External ID from target system (e.g., Jira issue key) */
  externalId?: string;
  
  /** Error message if failed */
  error?: string;
  
  /** Request retry after this delay (triggers re-queue) */
  retryAfterMs?: number;
}
```

## Retry Behavior

- Return `retryAfterMs` to request a retry after the specified delay
- The delivery coordinator uses exponential backoff: 1min, 5min, 15min
- Maximum 3 retry attempts before marking as permanently failed
- Network errors (timeout, connection refused) automatically trigger retry

## Best Practices

1. **Use `secret()` for sensitive config**: API keys, tokens, passwords
2. **Set reasonable timeouts**: Default 10 seconds, allow user configuration
3. **Parse error responses**: Include meaningful error messages for debugging
4. **Implement `testConnection`**: Helps users validate their configuration
5. **Log at appropriate levels**: Use `debug` for success, `error` for failures
6. **Handle rate limiting**: Check for 429 responses and respect Retry-After headers
7. **Return external IDs**: Helps users correlate platform events with external records

## Example: Slack Provider

```typescript
export const slackProvider: IntegrationProvider<SlackConfig> = {
  id: "slack",
  displayName: "Slack",
  description: "Post messages to Slack channels",
  icon: "MessageSquare",

  config: new Versioned({
    version: 1,
    schema: z.object({
      webhookUrl: secret({ description: "Slack Incoming Webhook URL" }),
      channel: z.string().optional().describe("Override channel (optional)"),
      username: z.string().default("Checkmate").describe("Bot username"),
      iconEmoji: z.string().default(":robot_face:").describe("Bot icon emoji"),
    }),
  }),

  async deliver(context) {
    const { event, providerConfig } = context;
    
    const response = await fetch(providerConfig.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: providerConfig.channel,
        username: providerConfig.username,
        icon_emoji: providerConfig.iconEmoji,
        text: `*${event.eventId}*\n${JSON.stringify(event.payload, null, 2)}`,
      }),
    });

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    return { success: true };
  },
};
```

## Testing Providers

Use Bun's test framework with mocked fetch:

```typescript
import { describe, it, expect, spyOn } from "bun:test";
import { myServiceProvider } from "./provider";

describe("MyServiceProvider", () => {
  it("delivers events successfully", async () => {
    const mockFetch = spyOn(globalThis, "fetch").mockImplementation(
      async () => new Response(JSON.stringify({ id: "ext-123" }), { status: 200 })
    );

    try {
      const result = await myServiceProvider.deliver({
        event: {
          eventId: "test.event",
          payload: { key: "value" },
          timestamp: new Date().toISOString(),
          deliveryId: "del-1",
        },
        subscription: { id: "sub-1", name: "Test" },
        providerConfig: {
          apiEndpoint: "https://api.example.com",
          apiKey: "secret",
          timeout: 10_000,
          priority: "medium",
        },
        logger: { debug: () => {}, error: () => {} },
      });

      expect(result.success).toBe(true);
      expect(result.externalId).toBe("ext-123");
    } finally {
      mockFetch.mockRestore();
    }
  });
});
```
