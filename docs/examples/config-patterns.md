---
---
# Configuration Patterns

Common patterns for managing plugin configuration. See [Versioned Configs](../backend/versioned-configs.md) and [Config Service](../backend/config-service.md).

## Basic Config Schema

```typescript
import { z } from "zod";
import { configString, configNumber, configBoolean } from "@checkmate-monitor/backend-api";

const configSchema = z.object({
  // Simple fields using factory functions
  enabled: configBoolean({}).default(true).describe("Enable this feature"),
  maxItems: configNumber({}).min(1).max(1000).default(100).describe("Maximum items"),
  
  // Secret field (encrypted at rest)
  apiKey: configString({ "x-secret": true }).describe("API key for external service"),
  
  // Optional with default
  retryAttempts: configNumber({}).default(3).describe("Number of retries"),
});

type MyConfig = z.infer<typeof configSchema>;
```

## Available Factory Functions

| Factory | Base Type | Common Metadata |
|---------|-----------|-----------------|
| `configString({})` | `z.string()` | `x-secret`, `x-color`, `x-hidden`, `x-options-resolver` |
| `configNumber({})` | `z.number()` | Chart annotations |
| `configBoolean({})` | `z.boolean()` | Toggle fields |

## Metadata Keys

```typescript
// Secret - encrypted in database, redacted for frontend
apiKey: configString({ "x-secret": true })

// Color picker UI
primaryColor: configString({ "x-color": true })

// Hidden from form UI (auto-populated fields)
connectionId: configString({ "x-hidden": true })

// Dynamic options from backend resolver
projectKey: configString({ 
  "x-options-resolver": "projectOptions",
  "x-depends-on": ["connectionId"],
  "x-searchable": true,
})
```

---

## Config Versioning

```typescript
export class MyPlugin implements QueuePlugin<MyConfig> {
  configVersion = 2; // Increment when schema changes
  configSchema = configSchema;
  
  migrations = [
    {
      fromVersion: 1,
      toVersion: 2,
      migrate: (old: any) => ({
        ...old,
        // Add new field with default
        newField: old.newField ?? "default-value",
        // Rename field
        renamedField: old.oldFieldName,
      }),
    },
  ];
}
```

---

## Accessing Config in Handlers

```typescript
// Get redacted config (safe for frontend)
getConfiguration: os.handler(async ({ context }) => {
  const config = await context.configService.getRedacted(
    pluginId,
    plugin.configSchema,
    plugin.configVersion
  );
  return { pluginId, config };
}),

// Get full config (backend only)
const fullConfig = await context.configService.get(
  pluginId,
  plugin.configSchema,
  plugin.configVersion
);
```

---

## Saving Config

```typescript
updateConfiguration: os.handler(async ({ input, context }) => {
  await context.configService.set(
    input.pluginId,
    input.config,
    plugin.configSchema,
    plugin.configVersion
  );
  return { success: true };
}),
```

---

## Testing Configuration (delayMultiplier)

For queue plugins or time-sensitive tests:

```typescript
const configSchema = z.object({
  concurrency: configNumber({}).default(10),
  // Testing-only option
  delayMultiplier: configNumber({}).min(0).max(1).default(1)
    .describe("Delay multiplier (default: 1). Only change for testing purposes."),
});

// In tests
const queue = new InMemoryQueue("test", {
  concurrency: 10,
  delayMultiplier: 0.01, // 100x faster
});
```

---

## See Also

- [Versioned Configs](../backend/versioned-configs.md)
- [Config Service](../backend/config-service.md)
- [Secrets Encryption](../security/secrets.md)
