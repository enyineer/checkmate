import { z } from "zod";
import { Versioned } from "@checkmate-monitor/backend-api";
import type {
  IntegrationProvider,
  IntegrationDeliveryContext,
  IntegrationDeliveryResult,
  TestConnectionResult,
  VersionedConfig,
} from "@checkmate-monitor/integration-common";
import { JiraSubscriptionConfigSchema } from "@checkmate-monitor/integration-jira-common";
import type { ConnectionService } from "./connection-service";
import { createJiraClientFromConnection } from "./jira-client";
import { expandTemplate } from "./template-engine";

/**
 * Jira subscription config type.
 */
export type JiraProviderConfig = z.infer<typeof JiraSubscriptionConfigSchema>;

/**
 * Create the Jira integration provider.
 */
export function createJiraProvider(deps: {
  connectionService: ConnectionService;
}): IntegrationProvider<JiraProviderConfig> {
  const { connectionService } = deps;

  return {
    id: "jira",
    displayName: "Jira",
    description: "Create Jira issues from integration events",
    icon: "Ticket",
    config: new Versioned({
      version: 1,
      schema: JiraSubscriptionConfigSchema,
    }) as VersionedConfig<JiraProviderConfig>,

    documentation: {
      setupGuide: `
## Jira Integration Setup

1. **Create a Jira Connection**: First, set up a site-wide Jira connection with your Atlassian credentials.
2. **Configure the Subscription**: Select your connection, project, and issue type.
3. **Set Up Templates**: Use \`{{payload.property}}\` syntax to dynamically populate issue fields from event data.

### Template Syntax

Use double curly braces to reference event payload properties:
- \`{{payload.title}}\` - Direct property access
- \`{{payload.system.name}}\` - Nested property access

If a property is missing, the placeholder will be preserved in the output for debugging.
      `.trim(),
      examplePayload: JSON.stringify(
        {
          eventType: "incident.created",
          timestamp: "2024-01-15T10:30:00Z",
          payload: {
            title: "Database Connectivity Issue",
            description: "Unable to connect to production database",
            severity: "high",
            system: {
              id: "sys-123",
              name: "Production Database",
            },
          },
        },
        undefined,
        2
      ),
    },

    async deliver(
      context: IntegrationDeliveryContext<JiraProviderConfig>
    ): Promise<IntegrationDeliveryResult> {
      const { providerConfig, event, logger } = context;
      const {
        connectionId,
        projectKey,
        issueTypeId,
        summaryTemplate,
        descriptionTemplate,
        priorityId,
        fieldMappings,
      } = providerConfig;

      // Get the connection with credentials
      const connection = await connectionService.getConnectionWithCredentials(
        connectionId
      );
      if (!connection) {
        return {
          success: false,
          error: `Jira connection not found: ${connectionId}`,
        };
      }

      // Create Jira client
      const client = createJiraClientFromConnection(connection, logger);

      // Expand templates using the event payload
      const payload = event.payload as Record<string, unknown>;
      const summary = expandTemplate(summaryTemplate, payload);
      const description = descriptionTemplate
        ? expandTemplate(descriptionTemplate, payload)
        : undefined;

      // Build additional fields from field mappings
      const additionalFields: Record<string, unknown> = {};
      if (fieldMappings) {
        for (const mapping of fieldMappings) {
          const value = expandTemplate(mapping.template, payload);
          additionalFields[mapping.fieldKey] = value;
        }
      }

      try {
        // Create the issue
        const result = await client.createIssue({
          projectKey,
          issueTypeId,
          summary,
          description,
          priorityId,
          additionalFields:
            Object.keys(additionalFields).length > 0
              ? additionalFields
              : undefined,
        });

        logger.info(`Created Jira issue: ${result.key}`, {
          issueId: result.id,
          issueKey: result.key,
          project: projectKey,
        });

        return {
          success: true,
          externalId: result.key,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(`Failed to create Jira issue: ${message}`, { error });

        // Check if it's a rate limit error
        if (
          message.includes("429") ||
          message.toLowerCase().includes("rate limit")
        ) {
          return {
            success: false,
            error: `Rate limited by Jira: ${message}`,
            retryAfterMs: 60_000, // Retry after 1 minute
          };
        }

        return {
          success: false,
          error: `Failed to create Jira issue: ${message}`,
        };
      }
    },

    async testConnection(
      config: JiraProviderConfig
    ): Promise<TestConnectionResult> {
      const connection = await connectionService.getConnectionWithCredentials(
        config.connectionId
      );
      if (!connection) {
        return {
          success: false,
          message: `Jira connection not found: ${config.connectionId}`,
        };
      }

      // We can't create a logger here in testConnection, so we create a minimal one
      const minimalLogger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      };

      const client = createJiraClientFromConnection(connection, minimalLogger);
      return client.testConnection();
    },
  };
}

export type JiraProvider = ReturnType<typeof createJiraProvider>;
