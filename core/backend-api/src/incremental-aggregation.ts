import { z } from "zod";

/**
 * Incremental aggregation utilities for real-time metrics.
 * These utilities enable O(1) memory aggregation without storing raw data.
 *
 * Each pattern provides:
 * - A Zod schema for validation/serialization
 * - A TypeScript interface (inferred from schema)
 * - A merge function for incremental updates
 */

// ===== Counter Pattern =====

/**
 * Zod schema for accumulated counter state.
 */
export const counterStateSchema = z.object({
  count: z.number(),
});

/**
 * Accumulated counter state.
 */
export type CounterState = z.infer<typeof counterStateSchema>;

/**
 * Incrementally merge a counter.
 * Use for tracking occurrences (errorCount, requestCount, etc.)
 *
 * @param existing - Previous counter state (undefined for first run)
 * @param increment - Value to add (boolean true = 1, false = 0, or direct number)
 */
export function mergeCounter(
  existing: CounterState | undefined,
  increment: boolean | number,
): CounterState {
  const value =
    typeof increment === "boolean" ? (increment ? 1 : 0) : increment;
  return {
    count: (existing?.count ?? 0) + value,
  };
}

// ===== Average Pattern =====

/**
 * Zod schema for accumulated average state.
 * Internal `_sum` and `_count` fields enable accurate averaging.
 */
export const averageStateSchema = z.object({
  /** Internal: sum of all values */
  _sum: z.number(),
  /** Internal: count of values */
  _count: z.number(),
  /** Computed average (rounded) */
  avg: z.number(),
});

/**
 * Accumulated average state.
 */
export type AverageState = z.infer<typeof averageStateSchema>;

/**
 * Incrementally merge an average.
 * Use for tracking averages (avgResponseTimeMs, avgExecutionTimeMs, etc.)
 *
 * @param existing - Previous average state (undefined for first run)
 * @param value - New value to incorporate (undefined skipped)
 */
export function mergeAverage(
  existing: AverageState | undefined,
  value: number | undefined,
): AverageState {
  if (value === undefined) {
    // No new value, return existing or initial state
    return existing ?? { _sum: 0, _count: 0, avg: 0 };
  }

  const sum = (existing?._sum ?? 0) + value;
  const count = (existing?._count ?? 0) + 1;

  return {
    _sum: sum,
    _count: count,
    // Round to 1 decimal place to preserve precision for float metrics (e.g., load averages)
    avg: Math.round((sum / count) * 10) / 10,
  };
}

// ===== Rate Pattern =====

/**
 * Zod schema for accumulated rate state (percentage).
 * Internal `_success` and `_total` fields enable accurate rate calculation.
 */
export const rateStateSchema = z.object({
  /** Internal: count of successes */
  _success: z.number(),
  /** Internal: total count */
  _total: z.number(),
  /** Computed rate as percentage (0-100, rounded) */
  rate: z.number(),
});

/**
 * Accumulated rate state (percentage).
 */
export type RateState = z.infer<typeof rateStateSchema>;

/**
 * Incrementally merge a rate (percentage).
 * Use for tracking success rates, availability percentages, etc.
 *
 * @param existing - Previous rate state (undefined for first run)
 * @param success - Whether this run was successful (undefined skipped)
 */
export function mergeRate(
  existing: RateState | undefined,
  success: boolean | undefined,
): RateState {
  if (success === undefined) {
    // No new value, return existing or initial state
    return existing ?? { _success: 0, _total: 0, rate: 0 };
  }

  const successCount = (existing?._success ?? 0) + (success ? 1 : 0);
  const total = (existing?._total ?? 0) + 1;

  return {
    _success: successCount,
    _total: total,
    rate: Math.round((successCount / total) * 100),
  };
}

// ===== MinMax Pattern =====

/**
 * Zod schema for accumulated min/max state.
 */
export const minMaxStateSchema = z.object({
  min: z.number(),
  max: z.number(),
});

/**
 * Accumulated min/max state.
 */
export type MinMaxState = z.infer<typeof minMaxStateSchema>;

/**
 * Incrementally merge min/max values.
 * Use for tracking min/max latency, memory, etc.
 *
 * @param existing - Previous min/max state (undefined for first run)
 * @param value - New value to incorporate (undefined skipped)
 */
export function mergeMinMax(
  existing: MinMaxState | undefined,
  value: number | undefined,
): MinMaxState {
  if (value === undefined) {
    // No new value, return existing or initial state
    return existing ?? { min: 0, max: 0 };
  }

  if (existing === undefined) {
    // First value
    return { min: value, max: value };
  }

  return {
    min: Math.min(existing.min, value),
    max: Math.max(existing.max, value),
  };
}
