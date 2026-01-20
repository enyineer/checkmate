/**
 * Sparkline downsampling utilities for managing large datasets in visualizations.
 */

/** Maximum number of bars to show in a sparkline for readability */
export const MAX_SPARKLINE_BARS = 60;

/**
 * A downsampled bucket containing multiple items aggregated together.
 */
export interface DownsampledBucket<T> {
  /** The original items in this bucket */
  items: T[];
  /** Whether all items in the bucket "passed" (for pass/fail type data) */
  passed: boolean;
  /** Time label for this bucket (range if multiple items) */
  timeLabel?: string;
}

/**
 * Downsample sparkline data to ensure readability.
 * Groups consecutive items into buckets, representing each bucket with
 * a "worst case" status (if any item failed, bucket shows failed).
 *
 * @param items - Array of items to downsample
 * @param options - Configuration options
 * @returns Array of downsampled buckets
 */
export function downsampleSparkline<
  T extends { passed?: boolean; value?: boolean; timeLabel?: string },
>(
  items: T[],
  options: {
    maxBars?: number;
    /** Custom function to determine if an item "passed" */
    getPassed?: (item: T) => boolean;
  } = {},
): DownsampledBucket<T>[] {
  const { maxBars = MAX_SPARKLINE_BARS, getPassed } = options;

  const getItemPassed =
    getPassed ?? ((item: T) => item.passed ?? item.value ?? true);

  if (items.length <= maxBars) {
    // No downsampling needed - return original items wrapped
    return items.map((item) => ({
      items: [item],
      passed: getItemPassed(item),
      timeLabel: item.timeLabel,
    }));
  }

  const bucketSize = Math.ceil(items.length / maxBars);
  const buckets: DownsampledBucket<T>[] = [];

  for (let i = 0; i < items.length; i += bucketSize) {
    const bucketItems = items.slice(i, i + bucketSize);
    // Bucket is "failed" if any item failed (worst case visualization)
    const passed = bucketItems.every((item) => getItemPassed(item));

    const firstItem = bucketItems[0];
    const lastItem = bucketItems.at(-1);
    const startLabel = firstItem?.timeLabel;
    const endLabel = lastItem?.timeLabel;

    buckets.push({
      items: bucketItems,
      passed,
      timeLabel:
        startLabel && endLabel && startLabel !== endLabel
          ? `${startLabel} - ${endLabel}`
          : startLabel,
    });
  }

  return buckets;
}

/**
 * Calculate the bucket size needed for a given item count.
 * Returns 1 if no downsampling is needed.
 */
export function getDownsampleBucketSize(
  itemCount: number,
  maxBars: number = MAX_SPARKLINE_BARS,
): number {
  return itemCount <= maxBars ? 1 : Math.ceil(itemCount / maxBars);
}
