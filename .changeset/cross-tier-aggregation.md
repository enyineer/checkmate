---
"@checkstack/healthcheck-backend": minor
"@checkstack/healthcheck-frontend": patch
---

### Cross-Tier Data Aggregation

Implements intelligent cross-tier querying for health check history, enabling seamless data retrieval across raw, hourly, and daily storage tiers.

**What changed:**
- `getAggregatedHistory` now queries all three tiers (raw, hourly, daily) in parallel
- Added `NormalizedBucket` type for unified bucket format across tiers
- Added `mergeTieredBuckets()` to merge data with priority (raw > hourly > daily)
- Added `combineBuckets()` and `reaggregateBuckets()` for re-aggregation to target bucket size
- Raw data preserves full granularity when available (uses target bucket interval)

**Why:**
- Previously, the API only queried raw runs, which are retained for a limited period (default 7 days)
- For longer time ranges, data was missing because hourly/daily aggregates weren't queried
- The retention job only runs periodically, so we can't assume tier boundaries based on config
- Querying all tiers ensures no gaps in data coverage

**Technical details:**
- Additive metrics (counts, latencySum) are summed correctly for accurate averages
- p95 latency uses max of source p95s as conservative upper-bound approximation
- `aggregatedResult` (strategy-specific) is preserved for raw-only buckets
