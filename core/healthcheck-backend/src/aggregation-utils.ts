import type { CollectorRegistry } from "@checkstack/backend-api";

// ===== Percentile Calculation =====

/**
 * Calculate a percentile from a list of values.
 */
export function calculatePercentile(
  values: number[],
  percentile: number,
): number {
  const sorted = values.toSorted((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// ===== Status Counting =====

export interface StatusCounts {
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
}

/**
 * Count statuses from a list of runs.
 */
export function countStatuses(
  runs: Array<{ status: "healthy" | "degraded" | "unhealthy" | string }>,
): StatusCounts {
  let healthyCount = 0;
  let degradedCount = 0;
  let unhealthyCount = 0;

  for (const r of runs) {
    switch (r.status) {
      case "healthy": {
        healthyCount++;
        break;
      }
      case "degraded": {
        degradedCount++;
        break;
      }
      case "unhealthy": {
        unhealthyCount++;
        break;
      }
    }
  }

  return { healthyCount, degradedCount, unhealthyCount };
}

// ===== Latency Statistics =====

export interface LatencyStats {
  latencySumMs: number | undefined;
  avgLatencyMs: number | undefined;
  minLatencyMs: number | undefined;
  maxLatencyMs: number | undefined;
  p95LatencyMs: number | undefined;
}

/**
 * Calculate latency statistics from a list of latency values.
 */
export function calculateLatencyStats(latencies: number[]): LatencyStats {
  if (latencies.length === 0) {
    return {
      latencySumMs: undefined,
      avgLatencyMs: undefined,
      minLatencyMs: undefined,
      maxLatencyMs: undefined,
      p95LatencyMs: undefined,
    };
  }

  const sum = latencies.reduce((a, b) => a + b, 0);
  return {
    latencySumMs: sum,
    avgLatencyMs: Math.round(sum / latencies.length),
    minLatencyMs: Math.min(...latencies),
    maxLatencyMs: Math.max(...latencies),
    p95LatencyMs: calculatePercentile(latencies, 95),
  };
}

/**
 * Extract latencies from runs, filtering out undefined values.
 */
export function extractLatencies(
  runs: Array<{ latencyMs?: number }>,
): number[] {
  return runs
    .map((r) => r.latencyMs)
    .filter((l): l is number => l !== undefined);
}

// ===== Collector Aggregation =====

/**
 * Aggregate collector data from runs in a bucket.
 * Groups by collector UUID and calls each collector's aggregateResult.
 */
export function aggregateCollectorData(
  runs: Array<{
    status: string;
    latencyMs?: number;
    metadata?: Record<string, unknown>;
  }>,
  collectorRegistry: CollectorRegistry,
): Record<string, unknown> {
  // Group collector data by UUID
  const collectorDataByUuid = new Map<
    string,
    { collectorId: string; metadata: Record<string, unknown>[] }
  >();

  for (const run of runs) {
    const collectors = run.metadata?.collectors as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (!collectors) continue;

    for (const [uuid, data] of Object.entries(collectors)) {
      const collectorId = data._collectorId as string | undefined;
      if (!collectorId) continue;

      if (!collectorDataByUuid.has(uuid)) {
        collectorDataByUuid.set(uuid, { collectorId, metadata: [] });
      }

      // Add metadata without internal fields
      const { _collectorId, _assertionFailed, ...rest } = data;
      collectorDataByUuid.get(uuid)!.metadata.push(rest);
    }
  }

  // Call aggregateResult for each collector
  const result: Record<string, unknown> = {};

  for (const [uuid, { collectorId, metadata }] of collectorDataByUuid) {
    const registered = collectorRegistry.getCollector(collectorId);
    if (!registered?.collector.aggregateResult) continue;

    // Transform metadata to the format expected by aggregateResult
    const runsForAggregation = metadata.map((m) => ({
      status: "healthy" as const,
      metadata: m,
    }));

    const aggregated = registered.collector.aggregateResult(runsForAggregation);
    result[uuid] = {
      _collectorId: collectorId,
      ...aggregated,
    };
  }

  return result;
}

// ===== Cross-Tier Aggregation =====

/**
 * A normalized bucket that can come from any tier.
 * Used as the common format for merging and re-aggregating.
 */
export interface NormalizedBucket {
  bucketStart: Date;
  bucketEndMs: number; // bucketStart.getTime() + bucket duration in ms
  runCount: number;
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
  latencySumMs: number | undefined;
  minLatencyMs: number | undefined;
  maxLatencyMs: number | undefined;
  p95LatencyMs: number | undefined;
  aggregatedResult?: Record<string, unknown>;
  sourceTier: "raw" | "hourly" | "daily";
}

/**
 * Priority order for tiers (lower index = higher priority).
 */
const TIER_PRIORITY: Record<NormalizedBucket["sourceTier"], number> = {
  raw: 0,
  hourly: 1,
  daily: 2,
};

/**
 * Merge buckets from different tiers, preferring most granular data.
 * For overlapping time periods, uses priority: raw > hourly > daily.
 */
export function mergeTieredBuckets(params: {
  rawBuckets: NormalizedBucket[];
  hourlyBuckets: NormalizedBucket[];
  dailyBuckets: NormalizedBucket[];
}): NormalizedBucket[] {
  const { rawBuckets, hourlyBuckets, dailyBuckets } = params;

  // Combine all buckets
  const allBuckets = [...rawBuckets, ...hourlyBuckets, ...dailyBuckets];

  if (allBuckets.length === 0) {
    return [];
  }

  // Sort by start time, then by tier priority (most granular first)
  allBuckets.sort((a, b) => {
    const timeDiff = a.bucketStart.getTime() - b.bucketStart.getTime();
    if (timeDiff !== 0) return timeDiff;
    return TIER_PRIORITY[a.sourceTier] - TIER_PRIORITY[b.sourceTier];
  });

  // Merge overlapping buckets, keeping the most granular tier
  const result: NormalizedBucket[] = [];
  let coveredUntil = 0; // Timestamp up to which we have data

  for (const bucket of allBuckets) {
    const bucketStartMs = bucket.bucketStart.getTime();

    // Skip if this bucket's time range is already covered by higher-priority data
    if (bucketStartMs < coveredUntil) {
      // Check if this bucket extends beyond current coverage
      if (bucket.bucketEndMs > coveredUntil) {
        // Partial overlap - for simplicity, we skip partially overlapping lower-priority buckets
        // This is acceptable because we prefer raw data which is more granular
        continue;
      }
      continue;
    }

    result.push(bucket);
    coveredUntil = bucket.bucketEndMs;
  }

  return result;
}

/**
 * Combine multiple buckets into a single bucket.
 * Used when re-aggregating smaller buckets into larger target buckets.
 */
export function combineBuckets(params: {
  buckets: NormalizedBucket[];
  targetBucketStart: Date;
  targetBucketEndMs: number;
}): NormalizedBucket {
  const { buckets, targetBucketStart, targetBucketEndMs } = params;

  if (buckets.length === 0) {
    return {
      bucketStart: targetBucketStart,
      bucketEndMs: targetBucketEndMs,
      runCount: 0,
      healthyCount: 0,
      degradedCount: 0,
      unhealthyCount: 0,
      latencySumMs: undefined,
      minLatencyMs: undefined,
      maxLatencyMs: undefined,
      p95LatencyMs: undefined,
      aggregatedResult: undefined,
      sourceTier: "raw", // Will be overridden below
    };
  }

  // Aggregate counts (additive)
  let runCount = 0;
  let healthyCount = 0;
  let degradedCount = 0;
  let unhealthyCount = 0;
  let latencySumMs = 0;
  let hasLatencyData = false;

  const minValues: number[] = [];
  const maxValues: number[] = [];
  const p95Values: number[] = [];

  // Track which tier the data primarily comes from
  let lowestPriorityTier: NormalizedBucket["sourceTier"] = "raw";

  // Track aggregatedResults - only preserve if single bucket or all from raw
  const aggregatedResults: Array<Record<string, unknown> | undefined> = [];

  for (const bucket of buckets) {
    runCount += bucket.runCount;
    healthyCount += bucket.healthyCount;
    degradedCount += bucket.degradedCount;
    unhealthyCount += bucket.unhealthyCount;

    if (bucket.latencySumMs !== undefined) {
      latencySumMs += bucket.latencySumMs;
      hasLatencyData = true;
    }

    if (bucket.minLatencyMs !== undefined) {
      minValues.push(bucket.minLatencyMs);
    }
    if (bucket.maxLatencyMs !== undefined) {
      maxValues.push(bucket.maxLatencyMs);
    }
    if (bucket.p95LatencyMs !== undefined) {
      p95Values.push(bucket.p95LatencyMs);
    }

    // Track lowest priority (highest number) tier
    if (TIER_PRIORITY[bucket.sourceTier] > TIER_PRIORITY[lowestPriorityTier]) {
      lowestPriorityTier = bucket.sourceTier;
    }

    aggregatedResults.push(bucket.aggregatedResult);
  }

  // Preserve aggregatedResult if there's exactly one bucket (no re-aggregation needed)
  // or if there's exactly one non-undefined result and all buckets are raw
  let preservedAggregatedResult: Record<string, unknown> | undefined;
  if (buckets.length === 1) {
    preservedAggregatedResult = buckets[0].aggregatedResult;
  } else if (
    lowestPriorityTier === "raw" &&
    aggregatedResults.filter((r) => r !== undefined).length === 1
  ) {
    // All raw buckets, and exactly one has aggregatedResult
    preservedAggregatedResult = aggregatedResults.find((r) => r !== undefined);
  }

  return {
    bucketStart: targetBucketStart,
    bucketEndMs: targetBucketEndMs,
    runCount,
    healthyCount,
    degradedCount,
    unhealthyCount,
    latencySumMs: hasLatencyData ? latencySumMs : undefined,
    minLatencyMs: minValues.length > 0 ? Math.min(...minValues) : undefined,
    maxLatencyMs: maxValues.length > 0 ? Math.max(...maxValues) : undefined,
    // Use max of p95s as conservative upper-bound approximation
    p95LatencyMs: p95Values.length > 0 ? Math.max(...p95Values) : undefined,
    // Preserve aggregatedResult only when no actual re-aggregation is needed
    aggregatedResult: preservedAggregatedResult,
    sourceTier: lowestPriorityTier,
  };
}

/**
 * Re-aggregate a list of normalized buckets into target-sized buckets.
 * Groups source buckets by target bucket boundaries and combines them.
 */
export function reaggregateBuckets(params: {
  sourceBuckets: NormalizedBucket[];
  targetIntervalMs: number;
  rangeStart: Date;
}): NormalizedBucket[] {
  const { sourceBuckets, targetIntervalMs, rangeStart } = params;

  if (sourceBuckets.length === 0) {
    return [];
  }

  const rangeStartMs = rangeStart.getTime();

  // Group source buckets by target bucket index
  const bucketGroups = new Map<number, NormalizedBucket[]>();

  for (const bucket of sourceBuckets) {
    const offsetMs = bucket.bucketStart.getTime() - rangeStartMs;
    const targetIndex = Math.floor(offsetMs / targetIntervalMs);

    if (!bucketGroups.has(targetIndex)) {
      bucketGroups.set(targetIndex, []);
    }
    bucketGroups.get(targetIndex)!.push(bucket);
  }

  // Combine each group into a single target bucket
  const result: NormalizedBucket[] = [];

  for (const [index, buckets] of bucketGroups) {
    const targetBucketStart = new Date(rangeStartMs + index * targetIntervalMs);
    const targetBucketEndMs = targetBucketStart.getTime() + targetIntervalMs;

    result.push(
      combineBuckets({
        buckets,
        targetBucketStart,
        targetBucketEndMs,
      }),
    );
  }

  // Sort by bucket start time
  result.sort((a, b) => a.bucketStart.getTime() - b.bucketStart.getTime());

  return result;
}
