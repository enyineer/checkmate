/**
 * ExpandedResultView - Displays health check result data in a structured format.
 */

interface ExpandedResultViewProps {
  result: Record<string, unknown>;
}

/**
 * Displays the result data in a structured format.
 * Shows collector results as cards with key-value pairs.
 */
export function ExpandedResultView({ result }: ExpandedResultViewProps) {
  const metadata = result.metadata as Record<string, unknown> | undefined;
  const rawCollectors = metadata?.collectors;

  // Type guard for collectors object
  const collectors: Record<string, Record<string, unknown>> | undefined =
    rawCollectors &&
    typeof rawCollectors === "object" &&
    !Array.isArray(rawCollectors)
      ? (rawCollectors as Record<string, Record<string, unknown>>)
      : undefined;

  // Check if we have collectors to display
  const collectorEntries = collectors ? Object.entries(collectors) : [];

  // Extract connection time as typed value
  const connectionTimeMs = metadata?.connectionTimeMs as number | undefined;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Status: </span>
          <span className="font-medium">{String(result.status)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Latency: </span>
          <span className="font-medium">{String(result.latencyMs)}ms</span>
        </div>
        {connectionTimeMs !== undefined && (
          <div>
            <span className="text-muted-foreground">Connection: </span>
            <span className="font-medium">{connectionTimeMs}ms</span>
          </div>
        )}
      </div>

      {collectorEntries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Collector Results</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {collectorEntries.map(([collectorId, collectorResult]) => (
              <CollectorResultCard
                key={collectorId}
                collectorId={collectorId}
                result={collectorResult}
              />
            ))}
          </div>
        </div>
      )}

      {result.message ? (
        <div className="text-sm text-muted-foreground">
          {String(result.message)}
        </div>
      ) : undefined}
    </div>
  );
}

interface CollectorResultCardProps {
  collectorId: string;
  result: Record<string, unknown>;
}

/**
 * Card displaying a single collector's result values.
 */
function CollectorResultCard({
  collectorId,
  result,
}: CollectorResultCardProps) {
  if (!result || typeof result !== "object") {
    return;
  }

  // Filter out null/undefined values
  const entries = Object.entries(result).filter(
    ([, value]) => value !== null && value !== undefined,
  );

  return (
    <div className="rounded-md border bg-card p-3 space-y-2">
      <h5 className="text-sm font-medium text-primary">{collectorId}</h5>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {entries.map(([key, value]) => (
          <div key={key} className="contents">
            <span className="text-muted-foreground truncate">
              {formatKey(key)}
            </span>
            <span className="font-mono text-xs truncate" title={String(value)}>
              {formatValue(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Format a camelCase key to a readable label.
 */
function formatKey(key: string): string {
  return key
    .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Format a value for display.
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (Array.isArray(value)) {
    return value.length > 3
      ? `[${value.slice(0, 3).join(", ")}…]`
      : `[${value.join(", ")}]`;
  }
  if (typeof value === "object") return JSON.stringify(value);
  const str = String(value);
  return str.length > 50 ? `${str.slice(0, 47)}…` : str;
}
