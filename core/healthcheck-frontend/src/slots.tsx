import { createSlot, createSlotExtension } from "@checkmate/frontend-api";
import type { PluginMetadata } from "@checkmate/common";
import type { HealthCheckStatus } from "@checkmate/healthcheck-common";

/**
 * Context provided to custom health check diagram extensions.
 * Plugins can contribute strategy-specific visualizations.
 */
export interface HealthCheckDiagramSlotContext<
  TMetadata = Record<string, unknown>
> {
  systemId: string;
  configurationId: string;
  strategyId: string;
  /** Runs with migrated, typed metadata for visualization */
  runs: Array<{
    id: string;
    status: HealthCheckStatus;
    timestamp: Date;
    latencyMs?: number;
    /** Strategy-specific metadata (already migrated to latest version) */
    metadata?: TMetadata;
  }>;
}

/**
 * Extension slot for custom health check diagrams.
 * Strategy plugins can contribute their own visualizations for check results.
 */
export const HealthCheckDiagramSlot = createSlot<HealthCheckDiagramSlotContext>(
  "healthcheck.diagram"
);

/**
 * Helper for creating strategy-specific diagram extensions.
 * Wraps the component with strategy ID filtering so the component
 * is only rendered for the specified strategy/strategies.
 *
 * @example
 * ```tsx
 * import { httpCheckMetadata } from "@checkmate/http-check-common";
 *
 * createStrategyDiagramExtension({
 *   id: "http-check.response-chart",
 *   forStrategies: httpCheckMetadata,
 *   component: HttpResponseTimeChart,
 * });
 * ```
 */
export function createStrategyDiagramExtension(options: {
  id: string;
  /** Strategy plugin metadata(s) this extension applies to */
  forStrategies: PluginMetadata | PluginMetadata[];
  component: React.ComponentType<HealthCheckDiagramSlotContext>;
}) {
  const strategyIds = Array.isArray(options.forStrategies)
    ? options.forStrategies.map((m) => m.pluginId)
    : [options.forStrategies.pluginId];

  return createSlotExtension(HealthCheckDiagramSlot, {
    id: options.id,
    component: (ctx: HealthCheckDiagramSlotContext) => {
      if (!strategyIds.includes(ctx.strategyId)) {
        return;
      }
      return <options.component {...ctx} />;
    },
  });
}
