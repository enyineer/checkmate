import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format } from "date-fns";
import type { HealthCheckDiagramSlotContext } from "../slots";

interface HealthCheckStatusTimelineProps {
  context: HealthCheckDiagramSlotContext;
  height?: number;
}

const statusColors = {
  healthy: "hsl(var(--success))",
  degraded: "hsl(var(--warning))",
  unhealthy: "hsl(var(--destructive))",
};

/**
 * Timeline bar chart showing health check status changes over time.
 * For raw data: each bar represents a check run with color indicating status.
 * For aggregated data: each bar shows the distribution of statuses in that bucket.
 */
export const HealthCheckStatusTimeline: React.FC<
  HealthCheckStatusTimelineProps
> = ({ context, height = 60 }) => {
  if (context.type === "aggregated") {
    const buckets = context.buckets;

    if (buckets.length === 0) {
      return (
        <div
          className="flex items-center justify-center text-muted-foreground"
          style={{ height }}
        >
          No status data available
        </div>
      );
    }

    const chartData = buckets.map((d) => ({
      timestamp: new Date(d.bucketStart).getTime(),
      healthy: d.healthyCount,
      degraded: d.degradedCount,
      unhealthy: d.unhealthyCount,
      total: d.runCount,
    }));

    // Use daily format for intervals >= 6 hours, otherwise include time
    const timeFormat =
      (buckets[0]?.bucketIntervalSeconds ?? 3600) >= 21_600
        ? "MMM d"
        : "MMM d HH:mm";

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} barGap={1}>
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(ts: number) => format(new Date(ts), timeFormat)}
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return;
              // Note: payload[0].payload is typed as `any` in recharts - this is a recharts limitation.
              const data = payload[0].payload as (typeof chartData)[number];
              return (
                <div
                  className="rounded-md border bg-popover p-2 text-sm shadow-md"
                  style={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <p className="text-muted-foreground mb-1">
                    {format(new Date(data.timestamp), "MMM d, HH:mm")}
                  </p>
                  <div className="space-y-0.5">
                    <p className="text-success">Healthy: {data.healthy}</p>
                    <p className="text-warning">Degraded: {data.degraded}</p>
                    <p className="text-destructive">
                      Unhealthy: {data.unhealthy}
                    </p>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="healthy" stackId="status" fill={statusColors.healthy} />
          <Bar
            dataKey="degraded"
            stackId="status"
            fill={statusColors.degraded}
          />
          <Bar
            dataKey="unhealthy"
            stackId="status"
            fill={statusColors.unhealthy}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Raw data path
  const runs = context.runs;

  if (runs.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No status data available
      </div>
    );
  }

  const chartData = runs.toReversed().map((d) => ({
    timestamp: new Date(d.timestamp).getTime(),
    value: 1, // Fixed height for visibility
    status: d.status,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} barGap={1}>
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(ts: number) => format(new Date(ts), "HH:mm")}
          stroke="hsl(var(--muted-foreground))"
          fontSize={10}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return;
            // Note: payload[0].payload is typed as `any` in recharts - this is a recharts limitation.
            const data = payload[0].payload as (typeof chartData)[number];
            return (
              <div
                className="rounded-md border bg-popover p-2 text-sm shadow-md"
                style={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <p className="text-muted-foreground">
                  {format(new Date(data.timestamp), "MMM d, HH:mm:ss")}
                </p>
                <p className="font-medium capitalize">{data.status}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={statusColors[entry.status as keyof typeof statusColors]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
