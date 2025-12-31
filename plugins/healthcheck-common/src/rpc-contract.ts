import { oc } from "@orpc/contract";
import type { ContractRouterClient } from "@orpc/contract";
import type { ProcedureMetadata } from "@checkmate/common";
import { z } from "zod";
import { permissions } from "./permissions";
import {
  HealthCheckStrategyDtoSchema,
  HealthCheckConfigurationSchema,
  CreateHealthCheckConfigurationSchema,
  UpdateHealthCheckConfigurationSchema,
  AssociateHealthCheckSchema,
  HealthCheckRunSchema,
} from "./schemas";

// Base builder with full metadata support
const _base = oc.$meta<ProcedureMetadata>({});

// Health Check RPC Contract using oRPC's contract-first pattern
export const healthCheckContract = {
  // ==========================================================================
  // STRATEGY MANAGEMENT (userType: "user" with read permission)
  // ==========================================================================

  getStrategies: _base
    .meta({ userType: "user", permissions: [permissions.healthCheckRead.id] })
    .output(z.array(HealthCheckStrategyDtoSchema)),

  // ==========================================================================
  // CONFIGURATION MANAGEMENT (userType: "user")
  // ==========================================================================

  getConfigurations: _base
    .meta({ userType: "user", permissions: [permissions.healthCheckRead.id] })
    .output(z.array(HealthCheckConfigurationSchema)),

  createConfiguration: _base
    .meta({ userType: "user", permissions: [permissions.healthCheckManage.id] })
    .input(CreateHealthCheckConfigurationSchema)
    .output(HealthCheckConfigurationSchema),

  updateConfiguration: _base
    .meta({ userType: "user", permissions: [permissions.healthCheckManage.id] })
    .input(
      z.object({
        id: z.string(),
        body: UpdateHealthCheckConfigurationSchema,
      })
    )
    .output(HealthCheckConfigurationSchema),

  deleteConfiguration: _base
    .meta({ userType: "user", permissions: [permissions.healthCheckManage.id] })
    .input(z.string())
    .output(z.void()),

  // ==========================================================================
  // SYSTEM ASSOCIATION (userType: "user")
  // ==========================================================================

  getSystemConfigurations: _base
    .meta({ userType: "user", permissions: [permissions.healthCheckRead.id] })
    .input(z.string())
    .output(z.array(HealthCheckConfigurationSchema)),

  associateSystem: _base
    .meta({ userType: "user", permissions: [permissions.healthCheckManage.id] })
    .input(
      z.object({
        systemId: z.string(),
        body: AssociateHealthCheckSchema,
      })
    )
    .output(z.void()),

  disassociateSystem: _base
    .meta({ userType: "user", permissions: [permissions.healthCheckManage.id] })
    .input(
      z.object({
        systemId: z.string(),
        configId: z.string(),
      })
    )
    .output(z.void()),

  // ==========================================================================
  // HISTORY (userType: "user" with read permission)
  // ==========================================================================

  getHistory: _base
    .meta({ userType: "user", permissions: [permissions.healthCheckRead.id] })
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

// Export typed client for backend-to-backend communication
export type HealthCheckClient = ContractRouterClient<
  typeof healthCheckContract
>;
