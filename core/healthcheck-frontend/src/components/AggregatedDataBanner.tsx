import { InfoBanner } from "@checkstack/ui";

interface AggregatedDataBannerProps {
  /** Bucket interval in seconds */
  bucketIntervalSeconds: number;
  /** The configured check interval in seconds (optional, for comparison) */
  checkIntervalSeconds?: number;
}

/**
 * Format seconds into a human-readable duration string.
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    const mins = Math.round(seconds / 60);
    return `${mins}min`;
  }
  const hours = Math.round(seconds / 3600);
  return `${hours}h`;
}

/**
 * Banner shown when viewing aggregated health check data.
 * Informs users about the aggregation level due to high data volume.
 */
export function AggregatedDataBanner({
  bucketIntervalSeconds,
  checkIntervalSeconds,
}: AggregatedDataBannerProps) {
  // Only show if bucket interval is larger than check interval (data is being aggregated)
  if (checkIntervalSeconds && bucketIntervalSeconds <= checkIntervalSeconds) {
    return;
  }

  return (
    <InfoBanner variant="info">
      Data is aggregated into {formatDuration(bucketIntervalSeconds)} intervals
      for performance.
    </InfoBanner>
  );
}
