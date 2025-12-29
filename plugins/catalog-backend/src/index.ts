import { createBackendPlugin } from "@checkmate/backend-api";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { coreServices } from "@checkmate/backend-api";
import * as schema from "./schema";
import { EntityService } from "./services/entity-service";
import { OperationService } from "./services/operation-service";
import { permissionList, permissions } from "@checkmate/catalog-common";

import {
  insertGroupSchema,
  insertIncidentSchema,
  insertSystemSchema,
  insertViewSchema,
} from "./services/types";

export let db: NodePgDatabase<typeof schema> | undefined;

export default createBackendPlugin({
  pluginId: "catalog-backend",
  register(env) {
    env.registerPermissions(permissionList);

    env.registerInit({
      schema,
      deps: {
        router: coreServices.httpRouter,
        logger: coreServices.logger,
      },
      init: async ({ database, router, logger }) => {
        logger.info("Initializing Catalog Backend...");

        const entityService = new EntityService(database);
        const operationService = new OperationService(database);

        // Entities
        router.get(
          "/entities",
          { permission: permissions.catalogRead.id },
          async (c) => {
            const systems = await entityService.getSystems();
            const groups = await entityService.getGroups();
            return c.json({ systems, groups });
          }
        );

        router.post(
          "/entities/systems",
          {
            permission: permissions.catalogManage.id,
            schema: insertSystemSchema,
          },
          async (c) => {
            const body = await c.req.json();
            const system = await entityService.createSystem(body);
            return c.json(system);
          }
        );

        router.put(
          "/entities/systems/:id",
          {
            permission: permissions.catalogManage.id,
            schema: insertSystemSchema.partial(),
          },
          async (c) => {
            const id = c.req.param("id");
            const body = await c.req.json();
            const system = await entityService.updateSystem(id, body);
            return c.json(system);
          }
        );

        router.delete(
          "/entities/systems/:id",
          { permission: permissions.catalogManage.id },
          async (c) => {
            const id = c.req.param("id");
            await entityService.deleteSystem(id);
            return c.json({ success: true });
          }
        );

        router.post(
          "/entities/groups",
          {
            permission: permissions.catalogManage.id,
            schema: insertGroupSchema,
          },
          async (c) => {
            const body = await c.req.json();
            const group = await entityService.createGroup(body);
            return c.json(group);
          }
        );

        router.put(
          "/entities/groups/:id",
          {
            permission: permissions.catalogManage.id,
            schema: insertGroupSchema.partial(),
          },
          async (c) => {
            const id = c.req.param("id");
            const body = await c.req.json();
            const group = await entityService.updateGroup(id, body);
            return c.json(group);
          }
        );

        router.delete(
          "/entities/groups/:id",
          { permission: permissions.catalogManage.id },
          async (c) => {
            const id = c.req.param("id");
            await entityService.deleteGroup(id);
            return c.json({ success: true });
          }
        );

        router.post(
          "/entities/groups/:id/systems",
          { permission: permissions.catalogManage.id },
          async (c) => {
            const groupId = c.req.param("id");
            const body = await c.req.json();
            await entityService.addSystemToGroup({
              groupId,
              systemId: body.systemId,
            });
            return c.json({ success: true });
          }
        );

        router.delete(
          "/entities/groups/:id/systems/:systemId",
          { permission: permissions.catalogManage.id },
          async (c) => {
            const groupId = c.req.param("id");
            const systemId = c.req.param("systemId");
            await entityService.removeSystemFromGroup({ groupId, systemId });
            return c.json({ success: true });
          }
        );

        // Views
        router.get(
          "/views",
          { permission: permissions.catalogRead.id },
          async (c) => {
            const views = await entityService.getViews();
            return c.json(views);
          }
        );

        router.post(
          "/views",
          {
            permission: permissions.catalogManage.id,
            schema: insertViewSchema,
          },
          async (c) => {
            const body = await c.req.json();
            const view = await entityService.createView(body);
            return c.json(view);
          }
        );

        // Incidents
        router.get(
          "/incidents",
          { permission: permissions.catalogRead.id },
          async (c) => {
            const incidents = await operationService.getIncidents();
            return c.json(incidents);
          }
        );

        router.post(
          "/incidents",
          {
            permission: permissions.catalogManage.id,
            schema: insertIncidentSchema,
          },
          async (c) => {
            const body = await c.req.json();
            const incident = await operationService.createIncident(body);
            return c.json(incident);
          }
        );

        logger.info("✅ Catalog Backend initialized.");
      },
    });
  },
});
