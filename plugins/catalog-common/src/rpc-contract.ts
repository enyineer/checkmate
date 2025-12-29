import { oc } from "@orpc/contract";
import { z } from "zod";
import { SystemSchema, GroupSchema, ViewSchema, IncidentSchema } from "./types";
import { permissions } from "./permissions";

// Permission metadata type
export interface CatalogMetadata {
  permissions?: string[];
}

// Base builder with metadata support
const _base = oc.$meta<CatalogMetadata>({});

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
  getEntities: _base
    .meta({ permissions: [permissions.catalogRead.id] })
    .output(
      z.object({
        systems: z.array(SystemSchema),
        groups: z.array(GroupSchema),
      })
    ),

  // Convenience methods - Read permission
  getSystems: _base
    .meta({ permissions: [permissions.catalogRead.id] })
    .output(z.array(SystemSchema)),
  getGroups: _base
    .meta({ permissions: [permissions.catalogRead.id] })
    .output(z.array(GroupSchema)),

  // System management - Manage permission
  createSystem: _base
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(CreateSystemInputSchema)
    .output(SystemSchema),

  updateSystem: _base
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(UpdateSystemInputSchema)
    .output(SystemSchema),

  deleteSystem: _base
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(z.string())
    .output(z.object({ success: z.boolean() })),

  // Group management - Manage permission
  createGroup: _base
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(CreateGroupInputSchema)
    .output(GroupSchema),

  updateGroup: _base
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(UpdateGroupInputSchema)
    .output(GroupSchema),

  deleteGroup: _base
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(z.string())
    .output(z.object({ success: z.boolean() })),

  // System-Group relationships - Manage permission
  addSystemToGroup: _base
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(
      z.object({
        groupId: z.string(),
        systemId: z.string(),
      })
    )
    .output(z.object({ success: z.boolean() })),

  removeSystemFromGroup: _base
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(
      z.object({
        groupId: z.string(),
        systemId: z.string(),
      })
    )
    .output(z.object({ success: z.boolean() })),

  // View management - Read permission
  getViews: _base
    .meta({ permissions: [permissions.catalogRead.id] })
    .output(z.array(ViewSchema)),
  createView: _base
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(CreateViewInputSchema)
    .output(ViewSchema),

  // Incident management - Read permission for get, Manage for create
  getIncidents: _base
    .meta({ permissions: [permissions.catalogRead.id] })
    .output(z.array(IncidentSchema)),
  createIncident: _base
    .meta({ permissions: [permissions.catalogManage.id] })
    .input(CreateIncidentInputSchema)
    .output(IncidentSchema),
};

// Export contract type for frontend
export type CatalogContract = typeof catalogContract;
