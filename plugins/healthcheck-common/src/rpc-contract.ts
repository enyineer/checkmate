import { oc } from "@orpc/contract";
import { z } from "zod";
import { permissions } from "./index";
import type {
  HealthCheckStrategyDto,
  HealthCheckConfiguration,
  HealthCheckRun,
} from "./index";
import {
  CreateHealthCheckConfigurationSchema,
  UpdateHealthCheckConfigurationSchema,
  AssociateHealthCheckSchema,
} from "./index";

// Permission metadata type
export interface HealthCheckMetadata {
  permissions?: string[];
}

// Base builder with metadata support
const _base = oc.$meta<HealthCheckMetadata>({});

// Zod schemas for return types
const HealthCheckStrategyDtoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  configSchema: z.record(z.string(), z.unknown()),
}) satisfies z.ZodType<HealthCheckStrategyDto>;

const HealthCheckConfigurationSchema = z.object({
  id: z.string(),
  name: z.string(),
  strategyId: z.string(),
  config: z.record(z.string(), z.unknown()),
  intervalSeconds: z.number(),
}) satisfies z.ZodType<HealthCheckConfiguration>;

const HealthCheckRunSchema = z.object({
  id: z.string(),
  configurationId: z.string(),
  systemId: z.string(),
  status: z.enum(["healthy", "unhealthy", "degraded"]),
  result: z.record(z.string(), z.unknown()),
  timestamp: z.string(),
}) satisfies z.ZodType<HealthCheckRun>;

// Health Check RPC Contract using oRPC's contract-first pattern
export const healthCheckContract = {
  // Strategy management - Read permission
  getStrategies: _base
    .meta({ permissions: [permissions.healthCheckRead.id] })
    .output(z.array(HealthCheckStrategyDtoSchema)),

  // Configuration management - Read permission for list, Manage for mutations
  getConfigurations: _base
    .meta({ permissions: [permissions.healthCheckRead.id] })
    .output(z.array(HealthCheckConfigurationSchema)),

  createConfiguration: _base
    .meta({ permissions: [permissions.healthCheckManage.id] })
    .input(CreateHealthCheckConfigurationSchema)
    .output(HealthCheckConfigurationSchema),

  updateConfiguration: _base
    .meta({ permissions: [permissions.healthCheckManage.id] })
    .input(
      z.object({
        id: z.string(),
        body: UpdateHealthCheckConfigurationSchema,
      })
    )
    .output(HealthCheckConfigurationSchema),

  deleteConfiguration: _base
    .meta({ permissions: [permissions.healthCheckManage.id] })
    .input(z.string())
    .output(z.void()),

  // System association - Read permission for get, Manage for mutations
  getSystemConfigurations: _base
    .meta({ permissions: [permissions.healthCheckRead.id] })
    .input(z.string())
    .output(z.array(HealthCheckConfigurationSchema)),

  associateSystem: _base
    .meta({ permissions: [permissions.healthCheckManage.id] })
    .input(
      z.object({
        systemId: z.string(),
        body: AssociateHealthCheckSchema,
      })
    )
    .output(z.void()),

  disassociateSystem: _base
    .meta({ permissions: [permissions.healthCheckManage.id] })
    .input(
      z.object({
        systemId: z.string(),
        configId: z.string(),
      })
    )
    .output(z.void()),

  // History - Read permission
  getHistory: _base
    .meta({ permissions: [permissions.healthCheckRead.id] })
    .input(
      z.object({
        systemId: z.string().optional(),
        configurationId: z.string().optional(),
        limit: z.number().optional(),
      })
    )
    .output(z.array(HealthCheckRunSchema)),
};

// Export contract type for frontend
export type HealthCheckContract = typeof healthCheckContract;

// Keep old interface for backwards compatibility during migration
export interface HealthCheckRpcContract {
  getStrategies: () => Promise<HealthCheckStrategyDto[]>;
  getConfigurations: () => Promise<HealthCheckConfiguration[]>;
  createConfiguration: (
    input: z.infer<typeof CreateHealthCheckConfigurationSchema>
  ) => Promise<HealthCheckConfiguration>;
  updateConfiguration: (input: {
    id: string;
    body: z.infer<typeof UpdateHealthCheckConfigurationSchema>;
  }) => Promise<HealthCheckConfiguration>;
  deleteConfiguration: (id: string) => Promise<void>;
  getSystemConfigurations: (
    systemId: string
  ) => Promise<HealthCheckConfiguration[]>;
  associateSystem: (input: {
    systemId: string;
    body: z.infer<typeof AssociateHealthCheckSchema>;
  }) => Promise<void>;
  disassociateSystem: (input: {
    systemId: string;
    configId: string;
  }) => Promise<void>;
  getHistory: (params: {
    systemId?: string;
    configurationId?: string;
    limit?: number;
  }) => Promise<HealthCheckRun[]>;
}
