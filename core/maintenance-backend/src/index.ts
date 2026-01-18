import * as schema from "./schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { z } from "zod";
import {
  maintenanceAccessRules,
  maintenanceAccess,
  pluginMetadata,
  maintenanceContract,
  maintenanceRoutes,
  MAINTENANCE_UPDATED,
} from "@checkstack/maintenance-common";

import { createBackendPlugin, coreServices } from "@checkstack/backend-api";
import { integrationEventExtensionPoint } from "@checkstack/integration-backend";
import { MaintenanceService } from "./service";
import { createRouter } from "./router";
import { CatalogApi } from "@checkstack/catalog-common";
import { registerSearchProvider } from "@checkstack/command-backend";
import { resolveRoute } from "@checkstack/common";
import { maintenanceHooks } from "./hooks";

// =============================================================================
// Integration Event Payload Schemas
// =============================================================================

const maintenanceCreatedPayloadSchema = z.object({
  maintenanceId: z.string(),
  systemIds: z.array(z.string()),
  title: z.string(),
  description: z.string().optional(),
  status: z.string(),
  startAt: z.string(),
  endAt: z.string(),
});

const maintenanceUpdatedPayloadSchema = z.object({
  maintenanceId: z.string(),
  systemIds: z.array(z.string()),
  title: z.string(),
  description: z.string().optional(),
  status: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  action: z.enum(["updated", "closed"]),
});

// Queue and job constants
const STATUS_TRANSITION_QUEUE = "maintenance-status-transitions";
const STATUS_TRANSITION_JOB_ID = "maintenance-status-transition-check";
const WORKER_GROUP = "maintenance-status-worker";

// =============================================================================
// Plugin Definition
// =============================================================================

export default createBackendPlugin({
  metadata: pluginMetadata,
  register(env) {
    env.registerAccessRules(maintenanceAccessRules);

    // Register hooks as integration events
    const integrationEvents = env.getExtensionPoint(
      integrationEventExtensionPoint,
    );

    integrationEvents.registerEvent(
      {
        hook: maintenanceHooks.maintenanceCreated,
        displayName: "Maintenance Created",
        description: "Fired when a new maintenance is scheduled",
        category: "Maintenance",
        payloadSchema: maintenanceCreatedPayloadSchema,
      },
      pluginMetadata,
    );

    integrationEvents.registerEvent(
      {
        hook: maintenanceHooks.maintenanceUpdated,
        displayName: "Maintenance Updated",
        description: "Fired when a maintenance is updated or closed",
        category: "Maintenance",
        payloadSchema: maintenanceUpdatedPayloadSchema,
      },
      pluginMetadata,
    );

    // Store service reference for afterPluginsReady
    let maintenanceService: MaintenanceService;

    env.registerInit({
      schema,
      deps: {
        logger: coreServices.logger,
        rpc: coreServices.rpc,
        rpcClient: coreServices.rpcClient,
        signalService: coreServices.signalService,
        queueManager: coreServices.queueManager,
      },
      init: async ({ logger, database, rpc, rpcClient, signalService }) => {
        logger.debug("🔧 Initializing Maintenance Backend...");

        const catalogClient = rpcClient.forPlugin(CatalogApi);

        maintenanceService = new MaintenanceService(
          database as NodePgDatabase<typeof schema>,
        );
        const router = createRouter(
          maintenanceService,
          signalService,
          catalogClient,
          logger,
        );
        rpc.registerRouter(router, maintenanceContract);

        // Register "Create Maintenance" command in the command palette
        registerSearchProvider({
          pluginMetadata,
          commands: [
            {
              id: "create",
              title: "Create Maintenance",
              subtitle: "Schedule a maintenance window",
              iconName: "Wrench",
              route:
                resolveRoute(maintenanceRoutes.routes.config) +
                "?action=create",
              requiredAccessRules: [maintenanceAccess.maintenance.manage],
            },
            {
              id: "manage",
              title: "Manage Maintenance",
              subtitle: "Manage maintenance windows",
              iconName: "Wrench",
              shortcuts: ["meta+shift+m", "ctrl+shift+m"],
              route: resolveRoute(maintenanceRoutes.routes.config),
              requiredAccessRules: [maintenanceAccess.maintenance.manage],
            },
          ],
        });

        logger.debug("✅ Maintenance Backend initialized.");
      },
      afterPluginsReady: async ({
        queueManager,
        emitHook,
        logger,
        signalService,
      }) => {
        // Schedule the recurring status transition check job
        const queue = queueManager.getQueue<Record<string, never>>(
          STATUS_TRANSITION_QUEUE,
        );

        // Subscribe to process status transition check jobs
        await queue.consume(
          async () => {
            logger.debug("⏰ Checking maintenance status transitions...");

            // Get maintenances that need to start
            const toStart = await maintenanceService.getMaintenancesToStart();
            for (const maintenance of toStart) {
              const updated = await maintenanceService.transitionStatus(
                maintenance.id,
                "in_progress",
                "Maintenance started automatically",
              );

              if (updated) {
                logger.info(
                  `Maintenance "${updated.title}" transitioned to in_progress`,
                );

                // Emit hook for integrations
                await emitHook(maintenanceHooks.maintenanceUpdated, {
                  maintenanceId: updated.id,
                  systemIds: updated.systemIds,
                  title: updated.title,
                  description: updated.description,
                  status: updated.status,
                  startAt: updated.startAt.toISOString(),
                  endAt: updated.endAt.toISOString(),
                  action: "updated" as const,
                });

                // Send signal for real-time UI updates
                await signalService.broadcast(MAINTENANCE_UPDATED, {
                  maintenanceId: updated.id,
                  systemIds: updated.systemIds,
                  action: "updated",
                });
              }
            }

            // Get maintenances that need to complete
            const toComplete =
              await maintenanceService.getMaintenancesToComplete();
            for (const maintenance of toComplete) {
              const updated = await maintenanceService.transitionStatus(
                maintenance.id,
                "completed",
                "Maintenance completed automatically",
              );

              if (updated) {
                logger.info(
                  `Maintenance "${updated.title}" transitioned to completed`,
                );

                // Emit hook for integrations
                await emitHook(maintenanceHooks.maintenanceUpdated, {
                  maintenanceId: updated.id,
                  systemIds: updated.systemIds,
                  title: updated.title,
                  description: updated.description,
                  status: updated.status,
                  startAt: updated.startAt.toISOString(),
                  endAt: updated.endAt.toISOString(),
                  action: "closed" as const,
                });

                // Send signal for real-time UI updates
                await signalService.broadcast(MAINTENANCE_UPDATED, {
                  maintenanceId: updated.id,
                  systemIds: updated.systemIds,
                  action: "closed",
                });
              }
            }

            if (toStart.length > 0 || toComplete.length > 0) {
              logger.debug(
                `Status transitions: ${toStart.length} started, ${toComplete.length} completed`,
              );
            }
          },
          {
            consumerGroup: WORKER_GROUP,
            maxRetries: 0, // Status checks should not retry
          },
        );

        // Schedule to run every minute (60 seconds)
        await queue.scheduleRecurring(
          {}, // Empty payload - the job just triggers a check
          {
            jobId: STATUS_TRANSITION_JOB_ID,
            intervalSeconds: 60,
          },
        );

        logger.debug("✅ Maintenance status transition job scheduled.");
      },
    });
  },
});

// Re-export hooks for other plugins to use
export { maintenanceHooks } from "./hooks";
