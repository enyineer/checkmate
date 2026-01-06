import { implement, ORPCError } from "@orpc/server";
import type { RpcContext } from "@checkmate-monitor/backend-api";
import { autoAuthMiddleware } from "@checkmate-monitor/backend-api";
import { jiraContract } from "@checkmate-monitor/integration-jira-common";
import type { ConnectionService } from "./connection-service";
import { createJiraClientFromConnection } from "./jira-client";
import type { Logger } from "@checkmate-monitor/backend-api";

interface RouterDeps {
  connectionService: ConnectionService;
  logger: Logger;
}

/**
 * Create the Jira RPC router.
 */
export function createJiraRouter(deps: RouterDeps) {
  const { connectionService, logger } = deps;

  const os = implement(jiraContract)
    .$context<RpcContext>()
    .use(autoAuthMiddleware);

  return os.router({
    // ==========================================================================
    // CONNECTION MANAGEMENT
    // ==========================================================================

    listConnections: os.listConnections.handler(async () => {
      return connectionService.listConnections();
    }),

    getConnection: os.getConnection.handler(async ({ input }) => {
      const connection = await connectionService.getConnection(input.id);
      if (!connection) {
        throw new ORPCError("NOT_FOUND", {
          message: "Jira connection not found",
        });
      }
      return connection;
    }),

    createConnection: os.createConnection.handler(async ({ input }) => {
      return connectionService.createConnection(input);
    }),

    updateConnection: os.updateConnection.handler(async ({ input }) => {
      const connection = await connectionService.updateConnection(
        input.id,
        input.updates
      );
      if (!connection) {
        throw new ORPCError("NOT_FOUND", {
          message: "Jira connection not found",
        });
      }
      return connection;
    }),

    deleteConnection: os.deleteConnection.handler(async ({ input }) => {
      const success = await connectionService.deleteConnection(input.id);
      if (!success) {
        throw new ORPCError("NOT_FOUND", {
          message: "Jira connection not found",
        });
      }
      return { success };
    }),

    testConnection: os.testConnection.handler(async ({ input }) => {
      const connection = await connectionService.getConnectionWithCredentials(
        input.id
      );
      if (!connection) {
        return { success: false, message: "Jira connection not found" };
      }

      const client = createJiraClientFromConnection(connection, logger);
      return client.testConnection();
    }),

    // ==========================================================================
    // JIRA API PROXIES
    // ==========================================================================

    getProjects: os.getProjects.handler(async ({ input }) => {
      const connection = await connectionService.getConnectionWithCredentials(
        input.connectionId
      );
      if (!connection) {
        throw new ORPCError("NOT_FOUND", {
          message: "Jira connection not found",
        });
      }

      const client = createJiraClientFromConnection(connection, logger);
      return client.getProjects();
    }),

    getIssueTypes: os.getIssueTypes.handler(async ({ input }) => {
      const connection = await connectionService.getConnectionWithCredentials(
        input.connectionId
      );
      if (!connection) {
        throw new ORPCError("NOT_FOUND", {
          message: "Jira connection not found",
        });
      }

      const client = createJiraClientFromConnection(connection, logger);
      return client.getIssueTypes(input.projectKey);
    }),

    getFields: os.getFields.handler(async ({ input }) => {
      const connection = await connectionService.getConnectionWithCredentials(
        input.connectionId
      );
      if (!connection) {
        throw new ORPCError("NOT_FOUND", {
          message: "Jira connection not found",
        });
      }

      const client = createJiraClientFromConnection(connection, logger);
      return client.getFields(input.projectKey, input.issueTypeId);
    }),

    getPriorities: os.getPriorities.handler(async ({ input }) => {
      const connection = await connectionService.getConnectionWithCredentials(
        input.connectionId
      );
      if (!connection) {
        throw new ORPCError("NOT_FOUND", {
          message: "Jira connection not found",
        });
      }

      const client = createJiraClientFromConnection(connection, logger);
      return client.getPriorities();
    }),
  });
}

export type JiraRouter = ReturnType<typeof createJiraRouter>;
