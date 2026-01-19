---
"@checkstack/healthcheck-backend": minor
"@checkstack/healthcheck-common": minor
"@checkstack/healthcheck-frontend": minor
---

### Dynamic Bucket Sizing for Health Check Visualization

Implements industry-standard dynamic bucket sizing for health check data aggregation, following patterns from Grafana/VictoriaMetrics.

**What changed:**
- Replaced fixed `bucketSize: "hourly" | "daily" | "auto"` with dynamic `targetPoints` parameter (default: 500)
- Bucket interval is now calculated as `(endDate - startDate) / targetPoints` with a minimum of 1 second
- Added `bucketIntervalSeconds` to aggregated response and individual buckets
- Updated chart components to use dynamic time formatting based on bucket interval

**Why:**
- A 24-hour view with 1-second health checks previously returned 86,400+ data points, causing lag
- Now returns ~500 data points regardless of timeframe, ensuring consistent chart performance
- Charts still preserve visual fidelity through proper aggregation

**Breaking Change:**
- `bucketSize` parameter removed from `getAggregatedHistory` and `getDetailedAggregatedHistory` endpoints
- Use `targetPoints` instead (defaults to 500 if not specified)

---

### Collector Aggregated Charts Fix

Fixed issue where collector auto-charts (like HTTP request response time charts) were not showing in aggregated data mode.

**What changed:**
- Added `aggregatedResultSchema` to `CollectorDtoSchema`
- Backend now returns collector aggregated schemas via `getCollectors` endpoint
- Frontend `useStrategySchemas` hook now merges collector aggregated schemas
- Service now calls each collector's `aggregateResult()` when building buckets
- Aggregated collector data stored in `aggregatedResult.collectors[uuid]`

**Why:**
- Previously only strategy-level aggregated results were computed
- Collectors like HTTP Request Collector have their own `aggregateResult` method
- Without calling these, fields like `avgResponseTimeMs` and `successRate` were missing from aggregated buckets

