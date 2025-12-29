import { baseContractBuilder } from "@checkmate/backend-api";
import { z } from "zod";
import { SystemSchema, GroupSchema, ViewSchema, IncidentSchema } from "./types";
import { permissions } from "./permissions";

// No longer need to define CatalogMetadata or create base - use baseContractBuilder from backend-api

// Input schemas that match the service layer expectations
const CreateSystemInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(["healthy", "degraded", "unhealthy"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const UpdateSystemInputSchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().optional(),
    description: z.string().nullable().optional(), // Allow nullable for updates
    owner: z.string().nullable().optional(),
    status: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(), // Allow nullable
  }),
});

const CreateGroupInputSchema = z.object({
  name: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const UpdateGroupInputSchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(), // Allow nullable
  }),
});

const CreateViewInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  configuration: z.unknown(),
});

const CreateIncidentInputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
  severity: z.string().optional(),
  systemId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
});

// Catalog RPC Contract using oRPC's contract-first pattern
export const catalogContract = {
  // Entity management - Read permission
  getEntities: baseContractBuilder
    .meta({ permissions: [permissions.catalogRead.id] })
    .output(
      z.object({
        systems: z.array(SystemSchema),
        groups: z.array(GroupSchema),
      })
    ),

  // Convenience methods - Read permission
  getSystems: baseContractBuilder
    .meta({ permissions: [permissions.catalogRead.id] })
    .output(z.array(SystemSchema)),
  getGroups: baseContractBuilder
    .meta({ permissions: [permissions.catalogRead.id] })
    .output(z.array(GroupSchema)),

  // System management - Manage permission
  createSystem: baseContractBuilder
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(CreateSystemInputSchema)
    .output(SystemSchema),

  updateSystem: baseContractBuilder
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(UpdateSystemInputSchema)
    .output(SystemSchema),

  deleteSystem: baseContractBuilder
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(z.string())
    .output(z.object({ success: z.boolean() })),

  // Group management - Manage permission
  createGroup: baseContractBuilder
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(CreateGroupInputSchema)
    .output(GroupSchema),

  updateGroup: baseContractBuilder
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(UpdateGroupInputSchema)
    .output(GroupSchema),

  deleteGroup: baseContractBuilder
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(z.string())
    .output(z.object({ success: z.boolean() })),

  // System-Group relationships - Manage permission
  addSystemToGroup: baseContractBuilder
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(
      z.object({
        groupId: z.string(),
        systemId: z.string(),
      })
    )
    .output(z.object({ success: z.boolean() })),

  removeSystemFromGroup: baseContractBuilder
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(
      z.object({
        groupId: z.string(),
        systemId: z.string(),
      })
    )
    .output(z.object({ success: z.boolean() })),

  // View management - Read permission
  getViews: baseContractBuilder
    .meta({ permissions: [permissions.catalogRead.id] })
    .output(z.array(ViewSchema)),
  createView: baseContractBuilder
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(CreateViewInputSchema)
    .output(ViewSchema),

  // Incident management - Read permission for get, Manage for create
  getIncidents: baseContractBuilder
    .meta({ permissions: [permissions.catalogRead.id] })
    .output(z.array(IncidentSchema)),
  createIncident: baseContractBuilder
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(CreateIncidentInputSchema)
    .output(IncidentSchema),
};

// Export contract type for frontend
export type CatalogContract = typeof catalogContract;
