import { useMemo, useRef } from "react";
import {
  usePluginClient,
  accessApiRef,
  useApi,
} from "@checkstack/frontend-api";
import { HealthCheckApi } from "../api";
import {
  healthCheckAccess,
  DEFAULT_RETENTION_CONFIG,
  type RetentionConfig,
  HEALTH_CHECK_RUN_COMPLETED,
} from "@checkstack/healthcheck-common";
import { useSignal } from "@checkstack/signal-frontend";
import type {
  HealthCheckDiagramSlotContext,
  TypedHealthCheckRun,
  TypedAggregatedBucket,
} from "../slots";

interface UseHealthCheckDataProps {
  systemId: string;
  configurationId: string;
  strategyId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  /** Whether the date range is a rolling preset (e.g., 'Last 7 days') that should auto-update */
  isRollingPreset?: boolean;
  /** Callback to update the date range (e.g., to refresh endDate to current time) */
  onDateRangeRefresh?: (newEndDate: Date) => void;
}

interface UseHealthCheckDataResult {
  /** The context to pass to HealthCheckDiagramSlot */
  context: HealthCheckDiagramSlotContext | undefined;
  /** Whether data is currently loading (no previous data available) */
  loading: boolean;
  /** Whether data is being fetched (even if previous data is shown) */
  isFetching: boolean;
  /** Whether aggregated data mode is active */
  isAggregated: boolean;
  /** The resolved retention config */
  retentionConfig: RetentionConfig;
  /** Whether user has access to view detailed data */
  hasAccess: boolean;
  /** Whether access is still loading */
  accessLoading: boolean;
  /** Bucket interval in seconds (only for aggregated mode) */
  bucketIntervalSeconds: number | undefined;
}

/**
 * Hook that handles fetching health check data for visualization.
 * Automatically determines whether to use raw or aggregated data based on:
 * - The selected date range
 * - The configured rawRetentionDays for the assignment
 *
 * Returns a ready-to-use context for HealthCheckDiagramSlot.
 */
export function useHealthCheckData({
  systemId,
  configurationId,
  strategyId,
  dateRange,
  isRollingPreset = false,
  onDateRangeRefresh,
}: UseHealthCheckDataProps): UseHealthCheckDataResult {
  const healthCheckClient = usePluginClient(HealthCheckApi);
  const accessApi = useApi(accessApiRef);

  // Access state
  const { allowed: hasAccess, loading: accessLoading } = accessApi.useAccess(
    healthCheckAccess.details,
  );

  // Calculate date range in days
  const dateRangeDays = useMemo(() => {
    return Math.ceil(
      (dateRange.endDate.getTime() - dateRange.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }, [dateRange.startDate, dateRange.endDate]);

  // Query: Fetch retention config
  const { data: retentionData, isLoading: retentionLoading } =
    healthCheckClient.getRetentionConfig.useQuery(
      { systemId, configurationId },
      { enabled: !!systemId && !!configurationId && hasAccess },
    );

  const retentionConfig =
    retentionData?.retentionConfig ?? DEFAULT_RETENTION_CONFIG;

  // Determine if we should use aggregated data
  // Use >= so that a range equal to retention days uses aggregation (e.g., 7-day range with 7-day retention)
  const isAggregated = dateRangeDays >= retentionConfig.rawRetentionDays;

  // Query: Fetch raw data (when in raw mode)
  // Use 'asc' order for chronological chart display (oldest first, newest last)
  // NOTE: For chart visualization, we fetch ALL runs in the date range (no pagination)
  const {
    data: rawData,
    isLoading: rawLoading,
    refetch: refetchRawData,
  } = healthCheckClient.getDetailedHistory.useQuery(
    {
      systemId,
      configurationId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      sortOrder: "asc",
    },
    {
      enabled:
        !!systemId &&
        !!configurationId &&
        hasAccess &&
        !accessLoading &&
        !retentionLoading &&
        !isAggregated,
      // Keep previous data visible during refetch to prevent layout shift
      placeholderData: (prev) => prev,
    },
  );

  // Query: Fetch aggregated data (when in aggregated mode)
  const {
    data: aggregatedData,
    isLoading: aggregatedLoading,
    refetch: refetchAggregatedData,
  } = healthCheckClient.getDetailedAggregatedHistory.useQuery(
    {
      systemId,
      configurationId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      targetPoints: 500,
    },
    {
      enabled:
        !!systemId &&
        !!configurationId &&
        hasAccess &&
        !accessLoading &&
        !retentionLoading &&
        isAggregated,
      // Keep previous data visible during refetch to prevent layout shift
      placeholderData: (prev) => prev,
    },
  );

  // Listen for realtime health check updates to refresh data silently
  useSignal(HEALTH_CHECK_RUN_COMPLETED, ({ systemId: changedId }) => {
    if (
      changedId === systemId &&
      hasAccess &&
      !accessLoading &&
      !retentionLoading
    ) {
      // Update endDate to current time only for rolling presets (not custom ranges)
      if (isRollingPreset && onDateRangeRefresh) {
        onDateRangeRefresh(new Date());
      }
      // Refetch the appropriate data
      if (isAggregated) {
        void refetchAggregatedData();
      } else {
        void refetchRawData();
      }
    }
  });

  // Transform raw runs to typed format
  const rawRuns = useMemo((): TypedHealthCheckRun<
    Record<string, unknown>
  >[] => {
    if (!rawData?.runs) return [];
    return rawData.runs.map((r) => ({
      id: r.id,
      configurationId,
      systemId,
      status: r.status,
      timestamp: r.timestamp,
      latencyMs: r.latencyMs,
      result: r.result as Record<string, unknown>,
    }));
  }, [rawData, configurationId, systemId]);

  // Transform aggregated buckets
  const aggregatedBuckets = useMemo((): TypedAggregatedBucket<
    Record<string, unknown>
  >[] => {
    if (!aggregatedData?.buckets) return [];
    return aggregatedData.buckets as TypedAggregatedBucket<
      Record<string, unknown>
    >[];
  }, [aggregatedData]);

  const context = useMemo((): HealthCheckDiagramSlotContext | undefined => {
    if (!hasAccess || accessLoading || retentionLoading) {
      return undefined;
    }

    if (isAggregated) {
      // Don't create context with empty buckets during loading
      if (aggregatedBuckets.length === 0) {
        return undefined;
      }
      return {
        type: "aggregated",
        systemId,
        configurationId,
        strategyId,
        buckets: aggregatedBuckets,
      };
    }

    // Don't create context with empty runs during loading
    if (rawRuns.length === 0) {
      return undefined;
    }
    return {
      type: "raw",
      systemId,
      configurationId,
      strategyId,
      runs: rawRuns,
    };
  }, [
    hasAccess,
    accessLoading,
    retentionLoading,
    isAggregated,
    systemId,
    configurationId,
    strategyId,
    rawRuns,
    aggregatedBuckets,
  ]);

  // Keep previous valid context to prevent layout shift during refetch
  const previousContextRef = useRef<
    HealthCheckDiagramSlotContext | undefined
  >();
  if (context) {
    previousContextRef.current = context;
  }

  const isQueryLoading =
    accessLoading ||
    retentionLoading ||
    (isAggregated ? aggregatedLoading : rawLoading);

  // Return previous context while loading to prevent layout shift
  const stableContext =
    context ?? (isQueryLoading ? previousContextRef.current : undefined);

  // Only report loading when we don't have any context to show
  // This prevents showing loading spinner during refetch when we have previous data
  const loading = isQueryLoading && !stableContext;

  return {
    context: stableContext,
    loading,
    isFetching: isQueryLoading,
    isAggregated,
    retentionConfig,
    hasAccess,
    accessLoading,
    bucketIntervalSeconds: aggregatedData?.bucketIntervalSeconds,
  };
}
