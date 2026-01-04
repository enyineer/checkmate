import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format } from "date-fns";

export interface StatusDataPoint {
  timestamp: Date;
  status: "healthy" | "degraded" | "unhealthy";
}

interface HealthCheckStatusTimelineProps {
  data: StatusDataPoint[];
  height?: number;
}

const statusColors = {
  healthy: "hsl(var(--success))",
  degraded: "hsl(var(--warning))",
  unhealthy: "hsl(var(--destructive))",
};

/**
 * Timeline bar chart showing health check status changes over time.
 * Each bar represents a check run with color indicating status.
 */
export const HealthCheckStatusTimeline: React.FC<
  HealthCheckStatusTimelineProps
> = ({ data, height = 60 }) => {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No status data available
      </div>
    );
  }

  // Transform data for chart (oldest first for timeline)
  const chartData = data.toReversed().map((d) => ({
    timestamp: d.timestamp.getTime(),
    value: 1, // Fixed height for visibility
    status: d.status,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} barGap={1}>
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={["auto", "auto"]}
          tickFormatter={(ts: number) => format(new Date(ts), "HH:mm")}
          stroke="hsl(var(--muted-foreground))"
          fontSize={10}
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
          formatter={(
            _value: number | undefined,
            _name: string | undefined,
            props: { payload?: { status: string } }
          ) => [props.payload?.status ?? "unknown", "Status"]}
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
