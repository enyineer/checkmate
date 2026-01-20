import React from "react";
import type { HealthCheckStatus } from "@checkstack/healthcheck-common";
import { cn } from "@checkstack/ui";
import { SparklineTooltip } from "./SparklineTooltip";

interface HealthCheckSparklineProps {
  runs: Array<{
    status: HealthCheckStatus;
  }>;
  className?: string;
}

const statusColors: Record<HealthCheckStatus, string> = {
  healthy: "bg-success",
  degraded: "bg-warning",
  unhealthy: "bg-destructive",
};

/**
 * Sparkline visualization showing recent health check runs.
 * Each run is represented as a small colored rectangle.
 * Runs are displayed oldest (left) to newest (right) for consistency
 * with other time-based charts.
 */
export const HealthCheckSparkline: React.FC<HealthCheckSparklineProps> = ({
  runs,
  className,
}) => {
  // Runs come in chronological order from API (oldest first, newest last)
  // Ensure we show 25 slots (with empty placeholders if fewer runs)
  const slots = Array.from({ length: 25 }, (_, i) => runs[i]?.status);

  return (
    <div className={cn("flex gap-0.5 items-center", className)}>
      {slots.map((status, index) => (
        <SparklineTooltip key={index} content={status || "No data"}>
          <div
            className={cn(
              "w-2 h-4 rounded-sm transition-all hover:scale-110",
              status ? statusColors[status] : "bg-muted/40",
            )}
          />
        </SparklineTooltip>
      ))}
    </div>
  );
};
