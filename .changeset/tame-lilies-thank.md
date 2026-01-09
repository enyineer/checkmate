---
"@checkstack/healthcheck-backend": patch
"@checkstack/healthcheck-common": patch
"@checkstack/healthcheck-frontend": patch
"@checkstack/healthcheck-http-backend": patch
"@checkstack/signal-frontend": patch
"@checkstack/ui": patch
---

Improved `counter` and `pie` auto-chart types to show frequency distributions instead of just the latest value. Both chart types now count occurrences of each unique value across all runs/buckets, making them more intuitive for visualizing data like HTTP status codes.

Changed HTTP health check chart annotations: `statusCode` now uses `pie` chart (distribution view), `contentType` now uses `counter` chart (frequency count).

Fixed scrollbar hopping when health check signals update the accordion content. All charts now update silently without layout shift or loading state flicker.

Refactored health check visualization architecture:
- `HealthCheckStatusTimeline` and `HealthCheckLatencyChart` now accept `HealthCheckDiagramSlotContext` directly, handling data transformation internally
- `HealthCheckDiagram` refactored to accept context from parent, ensuring all visualizations share the same data source and update together on signals
- `HealthCheckSystemOverview` simplified to use `useHealthCheckData` hook for consolidated data fetching with automatic signal-driven refresh

Added `silentRefetch()` method to `usePagination` hook for background data refreshes without showing loading indicators.

Fixed `useSignal` hook to use a ref pattern internally, preventing stale closure issues. Callbacks now always access the latest values without requiring manual memoization or refs in consumer components.

Added signal handling to `useHealthCheckData` hook for automatic chart refresh when health check runs complete.
