import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";

export interface LatencyDataPoint {
  timestamp: Date;
  latencyMs: number;
  status: "healthy" | "degraded" | "unhealthy";
}

interface HealthCheckLatencyChartProps {
  data: LatencyDataPoint[];
  height?: number;
  showAverage?: boolean;
}

/**
 * Area chart showing health check latency over time.
 * Uses HSL CSS variables for theming consistency.
 */
export const HealthCheckLatencyChart: React.FC<
  HealthCheckLatencyChartProps
> = ({ data, height = 200, showAverage = true }) => {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No latency data available
      </div>
    );
  }

  // Calculate average latency
  const avgLatency =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.latencyMs, 0) / data.length
      : 0;

  // Transform data for chart (oldest first for timeline)
  const chartData = data.toReversed().map((d) => ({
    timestamp: d.timestamp.getTime(),
    latencyMs: d.latencyMs,
    status: d.status,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={["auto", "auto"]}
          tickFormatter={(ts: number) => format(new Date(ts), "HH:mm")}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickFormatter={(v: number) => `${v}ms`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
          labelFormatter={(ts: number) =>
            format(new Date(ts), "MMM d, HH:mm:ss")
          }
          formatter={(value: number | undefined) => [
            `${value ?? 0}ms`,
            "Latency",
          ]}
        />
        {showAverage && (
          <ReferenceLine
            y={avgLatency}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            label={{
              value: `Avg: ${avgLatency.toFixed(0)}ms`,
              position: "right",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 12,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="latencyMs"
          stroke="hsl(var(--primary))"
          fill="url(#latencyGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
