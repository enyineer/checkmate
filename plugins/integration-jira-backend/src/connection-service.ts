import type { ConfigService, Logger } from "@checkmate-monitor/backend-api";
import {
  JiraConnectionSchema,
  type JiraConnection,
  type JiraConnectionRedacted,
} from "@checkmate-monitor/integration-jira-common";

/**
 * Config key prefix for Jira connections.
 */
const CONNECTION_KEY_PREFIX = "connection.";

/**
 * Schema version for Jira connections.
 */
const CONNECTION_SCHEMA_VERSION = 1;

/**
 * Service for managing site-wide Jira connections using ConfigService.
 */
export function createConnectionService(deps: {
  configService: ConfigService;
  logger: Logger;
}) {
  const { configService, logger } = deps;

  return {
    /**
     * List all Jira connections (redacted - no API tokens).
     */
    async listConnections(): Promise<JiraConnectionRedacted[]> {
      const keys = await configService.list();
      const connectionKeys = keys.filter((k) =>
        k.startsWith(CONNECTION_KEY_PREFIX)
      );

      const connections: JiraConnectionRedacted[] = [];
      for (const key of connectionKeys) {
        const connection = await configService.get(
          key,
          JiraConnectionSchema,
          CONNECTION_SCHEMA_VERSION
        );
        if (connection) {
          const { apiToken: _apiToken, ...redacted } = connection;
          connections.push(redacted);
        }
      }

      return connections;
    },

    /**
     * Get a single connection (redacted).
     */
    async getConnection(
      id: string
    ): Promise<JiraConnectionRedacted | undefined> {
      const connection = await configService.get(
        `${CONNECTION_KEY_PREFIX}${id}`,
        JiraConnectionSchema,
        CONNECTION_SCHEMA_VERSION
      );
      if (!connection) {
        return undefined;
      }

      const { apiToken: _apiToken, ...redacted } = connection;
      return redacted;
    },

    /**
     * Get a connection with full credentials (for internal use only).
     */
    async getConnectionWithCredentials(
      id: string
    ): Promise<JiraConnection | undefined> {
      return configService.get(
        `${CONNECTION_KEY_PREFIX}${id}`,
        JiraConnectionSchema,
        CONNECTION_SCHEMA_VERSION
      );
    },

    /**
     * Create a new Jira connection.
     */
    async createConnection(input: {
      name: string;
      baseUrl: string;
      email: string;
      apiToken: string;
    }): Promise<JiraConnectionRedacted> {
      const id = crypto.randomUUID();
      const now = new Date();

      const connection: JiraConnection = {
        id,
        ...input,
        createdAt: now,
        updatedAt: now,
      };

      await configService.set(
        `${CONNECTION_KEY_PREFIX}${id}`,
        JiraConnectionSchema,
        CONNECTION_SCHEMA_VERSION,
        connection
      );
      logger.info(`Created Jira connection: ${input.name} (${id})`);

      const { apiToken: _apiToken, ...redacted } = connection;
      return redacted;
    },

    /**
     * Update an existing Jira connection.
     */
    async updateConnection(
      id: string,
      updates: {
        name?: string;
        baseUrl?: string;
        email?: string;
        apiToken?: string;
      }
    ): Promise<JiraConnectionRedacted | undefined> {
      const existing = await configService.get(
        `${CONNECTION_KEY_PREFIX}${id}`,
        JiraConnectionSchema,
        CONNECTION_SCHEMA_VERSION
      );
      if (!existing) {
        return undefined;
      }

      const updated: JiraConnection = {
        ...existing,
        ...updates,
        // Preserve existing API token if not provided in updates
        apiToken: updates.apiToken || existing.apiToken,
        updatedAt: new Date(),
      };

      await configService.set(
        `${CONNECTION_KEY_PREFIX}${id}`,
        JiraConnectionSchema,
        CONNECTION_SCHEMA_VERSION,
        updated
      );
      logger.info(`Updated Jira connection: ${updated.name} (${id})`);

      const { apiToken: _apiToken, ...redacted } = updated;
      return redacted;
    },

    /**
     * Delete a Jira connection.
     */
    async deleteConnection(id: string): Promise<boolean> {
      const existing = await configService.get(
        `${CONNECTION_KEY_PREFIX}${id}`,
        JiraConnectionSchema,
        CONNECTION_SCHEMA_VERSION
      );
      if (!existing) {
        return false;
      }

      await configService.delete(`${CONNECTION_KEY_PREFIX}${id}`);
      logger.info(`Deleted Jira connection: ${id}`);
      return true;
    },
  };
}

export type ConnectionService = ReturnType<typeof createConnectionService>;
