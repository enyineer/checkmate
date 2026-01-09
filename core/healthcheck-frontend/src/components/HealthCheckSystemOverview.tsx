import React, { useState } from "react";
import { useApi, type SlotContext } from "@checkstack/frontend-api";
import { useSignal } from "@checkstack/signal-frontend";
import { healthCheckApiRef } from "../api";
import { SystemDetailsSlot } from "@checkstack/catalog-common";
import { HEALTH_CHECK_RUN_COMPLETED } from "@checkstack/healthcheck-common";
import {
  HealthBadge,
  LoadingSpinner,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Tooltip,
  Pagination,
  usePagination,
  DateRangeFilter,
} from "@checkstack/ui";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { HealthCheckSparkline } from "./HealthCheckSparkline";
import { HealthCheckLatencyChart } from "./HealthCheckLatencyChart";
import { HealthCheckStatusTimeline } from "./HealthCheckStatusTimeline";
import { HealthCheckDiagram } from "./HealthCheckDiagram";
import { useHealthCheckData } from "../hooks/useHealthCheckData";

import type {
  StateThresholds,
  HealthCheckStatus,
} from "@checkstack/healthcheck-common";

type SlotProps = SlotContext<typeof SystemDetailsSlot>;

interface HealthCheckOverviewItem {
  configurationId: string;
  strategyId: string;
  name: string;
  state: HealthCheckStatus;
  intervalSeconds: number;
  lastRunAt?: Date;
  stateThresholds?: StateThresholds;
  recentStatusHistory: HealthCheckStatus[];
}

interface ExpandedRowProps {
  item: HealthCheckOverviewItem;
  systemId: string;
}

const ExpandedDetails: React.FC<ExpandedRowProps> = ({ item, systemId }) => {
  const api = useApi(healthCheckApiRef);

  // Date range state for filtering
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>(() => {
    // Default to last 24 hours
    const end = new Date();
    const start = new Date();
    start.setHours(start.getHours() - 24);
    return { startDate: start, endDate: end };
  });

  // Use shared hook for chart data - handles both raw and aggregated modes
  // and includes signal handling for automatic refresh
  const {
    context: chartContext,
    loading: chartLoading,
    isAggregated,
    retentionConfig,
  } = useHealthCheckData({
    systemId,
    configurationId: item.configurationId,
    strategyId: item.strategyId,
    dateRange,
    limit: 1000,
  });

  // Paginated history for the table
  const {
    items: runs,
    loading,
    pagination,
  } = usePagination({
    fetchFn: (params: {
      limit: number;
      offset: number;
      systemId: string;
      configurationId: string;
      startDate?: Date;
    }) =>
      api.getHistory({
        systemId: params.systemId,
        configurationId: params.configurationId,
        limit: params.limit,
        offset: params.offset,
        startDate: params.startDate,
        // Don't pass endDate - backend defaults to 'now' so new runs are included
      }),
    getItems: (response) => response.runs,
    getTotal: (response) => response.total,
    extraParams: {
      systemId,
      configurationId: item.configurationId,
      startDate: dateRange.startDate,
    },
    defaultLimit: 10,
  });

  // Listen for realtime health check updates to refresh history table
  // Charts are refreshed automatically by useHealthCheckData
  useSignal(HEALTH_CHECK_RUN_COMPLETED, ({ systemId: changedId }) => {
    if (changedId === systemId) {
      pagination.silentRefetch();
    }
  });

  const thresholdDescription = item.stateThresholds
    ? item.stateThresholds.mode === "consecutive"
      ? `Consecutive mode: Healthy after ${item.stateThresholds.healthy.minSuccessCount} success(es), Degraded after ${item.stateThresholds.degraded.minFailureCount} failure(s), Unhealthy after ${item.stateThresholds.unhealthy.minFailureCount} failure(s)`
      : `Window mode (${item.stateThresholds.windowSize} runs): Degraded at ${item.stateThresholds.degraded.minFailureCount}+ failures, Unhealthy at ${item.stateThresholds.unhealthy.minFailureCount}+ failures`
    : "Using default thresholds";

  // Render charts - charts handle data transformation internally
  const renderCharts = () => {
    if (chartLoading) {
      return <LoadingSpinner />;
    }

    if (!chartContext) {
      return;
    }

    // Check if we have data to show
    const hasData =
      chartContext.type === "raw"
        ? chartContext.runs.length > 0
        : chartContext.buckets.length > 0;

    if (!hasData) {
      return;
    }

    return (
      <div className="space-y-4">
        {/* Status Timeline */}
        <div>
          <h4 className="text-sm font-medium mb-2">Status Timeline</h4>
          <HealthCheckStatusTimeline context={chartContext} height={50} />
        </div>

        {/* Latency Chart */}
        <div>
          <h4 className="text-sm font-medium mb-2">Response Latency</h4>
          <HealthCheckLatencyChart
            context={chartContext}
            height={150}
            showAverage
          />
        </div>

        {/* Extension Slot for custom strategy-specific diagrams */}
        <HealthCheckDiagram
          context={chartContext}
          isAggregated={isAggregated}
          rawRetentionDays={retentionConfig.rawRetentionDays}
        />
      </div>
    );
  };

  return (
    <div className="p-4 bg-muted/30 border-t space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Strategy:</span>{" "}
          <span className="font-medium">{item.strategyId}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Interval:</span>{" "}
          <span className="font-medium">{item.intervalSeconds}s</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Thresholds:</span>{" "}
          <Tooltip content={thresholdDescription} />
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Time Range:</span>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Charts Section */}
      {renderCharts()}

      {loading ? (
        <LoadingSpinner />
      ) : runs.length > 0 ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <HealthBadge status={run.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(run.timestamp), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            total={pagination.total}
            limit={pagination.limit}
            onPageSizeChange={pagination.setLimit}
            showPageSize
            showTotal
          />
        </>
      ) : (
        <div className="text-center text-muted-foreground py-4">
          No runs recorded yet
        </div>
      )}
    </div>
  );
};

export function HealthCheckSystemOverview(props: SlotProps) {
  const systemId = props.system.id;
  const api = useApi(healthCheckApiRef);

  // Fetch health check overview
  const [overview, setOverview] = React.useState<HealthCheckOverviewItem[]>([]);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [expandedRow, setExpandedRow] = React.useState<string | undefined>();

  const fetchOverview = React.useCallback(() => {
    api.getSystemHealthOverview({ systemId }).then((data) => {
      setOverview(
        data.checks.map((check) => ({
          configurationId: check.configurationId,
          strategyId: check.strategyId,
          name: check.configurationName,
          state: check.status,
          intervalSeconds: check.intervalSeconds,
          lastRunAt: check.recentRuns[0]?.timestamp
            ? new Date(check.recentRuns[0].timestamp)
            : undefined,
          stateThresholds: check.stateThresholds,
          recentStatusHistory: check.recentRuns.map((r) => r.status),
        }))
      );
      setInitialLoading(false);
    });
  }, [api, systemId]);

  React.useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Listen for realtime health check updates - merge into existing state to avoid remounting expanded content
  useSignal(HEALTH_CHECK_RUN_COMPLETED, ({ systemId: changedId }) => {
    if (changedId === systemId) {
      // Fetch fresh data but merge it into existing state to preserve object identity
      // for unchanged items, preventing unnecessary re-renders of expanded content
      api.getSystemHealthOverview({ systemId }).then((data) => {
        setOverview((prev) => {
          // Create a map of new items for quick lookup
          const newItemsMap = new Map(
            data.checks.map((item) => [item.configurationId, item])
          );

          // Update existing items in place, add new ones
          const merged = prev.map((existing) => {
            const updated = newItemsMap.get(existing.configurationId);
            if (updated) {
              newItemsMap.delete(existing.configurationId);
              // Map API response to our internal format
              const mappedItem: HealthCheckOverviewItem = {
                configurationId: updated.configurationId,
                strategyId: updated.strategyId,
                name: updated.configurationName,
                state: updated.status,
                intervalSeconds: updated.intervalSeconds,
                lastRunAt: updated.recentRuns[0]?.timestamp
                  ? new Date(updated.recentRuns[0].timestamp)
                  : undefined,
                stateThresholds: updated.stateThresholds,
                recentStatusHistory: updated.recentRuns.map((r) => r.status),
              };
              // Return updated data but preserve reference if nothing changed
              return JSON.stringify(existing) === JSON.stringify(mappedItem)
                ? existing
                : mappedItem;
            }
            return existing;
          });

          // Add any new items that weren't in the previous list
          for (const newItem of newItemsMap.values()) {
            merged.push({
              configurationId: newItem.configurationId,
              strategyId: newItem.strategyId,
              name: newItem.configurationName,
              state: newItem.status,
              intervalSeconds: newItem.intervalSeconds,
              lastRunAt: newItem.recentRuns[0]?.timestamp
                ? new Date(newItem.recentRuns[0].timestamp)
                : undefined,
              stateThresholds: newItem.stateThresholds,
              recentStatusHistory: newItem.recentRuns.map((r) => r.status),
            });
          }

          // Remove items that no longer exist
          return merged.filter((item) =>
            data.checks.some((c) => c.configurationId === item.configurationId)
          );
        });
      });
    }
  });

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  if (overview.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No health checks configured
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {overview.map((item) => {
        const isExpanded = expandedRow === item.configurationId;

        return (
          <div key={item.configurationId} className="rounded-md border bg-card">
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              onClick={() =>
                setExpandedRow(isExpanded ? undefined : item.configurationId)
              }
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Last run:{" "}
                    {item.lastRunAt
                      ? formatDistanceToNow(item.lastRunAt, { addSuffix: true })
                      : "never"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {item.recentStatusHistory.length > 0 && (
                  <HealthCheckSparkline
                    runs={item.recentStatusHistory.map((status) => ({
                      status,
                    }))}
                  />
                )}
                <HealthBadge status={item.state} />
              </div>
            </button>
            {isExpanded && <ExpandedDetails item={item} systemId={systemId} />}
          </div>
        );
      })}
    </div>
  );
}
