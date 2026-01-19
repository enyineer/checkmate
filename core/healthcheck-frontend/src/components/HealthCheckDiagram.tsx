import { ExtensionSlot } from "@checkstack/frontend-api";
import { InfoBanner } from "@checkstack/ui";
import {
  HealthCheckDiagramSlot,
  type HealthCheckDiagramSlotContext,
} from "../slots";
import { AggregatedDataBanner } from "./AggregatedDataBanner";

interface HealthCheckDiagramProps {
  /** The context from useHealthCheckData - handles both raw and aggregated modes */
  context: HealthCheckDiagramSlotContext;
  /** Whether the data is aggregated (for showing the info banner) */
  isAggregated?: boolean;
  /** The bucket interval in seconds (from aggregated response) */
  bucketIntervalSeconds?: number;
  /** The check interval in seconds (for comparison in banner) */
  checkIntervalSeconds?: number;
}

/**
 * Component that renders the diagram extension slot with the provided context.
 * Expects parent component to fetch data via useHealthCheckData and pass context.
 */
export function HealthCheckDiagram({
  context,
  isAggregated = false,
  bucketIntervalSeconds,
  checkIntervalSeconds,
}: HealthCheckDiagramProps) {
  return (
    <>
      {isAggregated && bucketIntervalSeconds && (
        <AggregatedDataBanner
          bucketIntervalSeconds={bucketIntervalSeconds}
          checkIntervalSeconds={checkIntervalSeconds}
        />
      )}
      <ExtensionSlot slot={HealthCheckDiagramSlot} context={context} />
    </>
  );
}

/**
 * Wrapper that shows access message when user lacks access.
 */
export function HealthCheckDiagramAccessGate({
  hasAccess,
  children,
}: {
  hasAccess: boolean;
  children: React.ReactNode;
}) {
  if (!hasAccess) {
    return (
      <InfoBanner variant="info">
        Additional strategy-specific visualizations are available with the
        &quot;Read Health Check Details&quot; access rule.
      </InfoBanner>
    );
  }
  return <>{children}</>;
}
