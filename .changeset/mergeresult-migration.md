---
"@checkstack/backend-api": minor
"@checkstack/backend": patch
"@checkstack/healthcheck-backend": patch
"@checkstack/healthcheck-http-backend": patch
"@checkstack/healthcheck-dns-backend": patch
"@checkstack/healthcheck-postgres-backend": patch
"@checkstack/healthcheck-mysql-backend": patch
"@checkstack/healthcheck-tcp-backend": patch
"@checkstack/healthcheck-tls-backend": patch
"@checkstack/healthcheck-grpc-backend": patch
"@checkstack/healthcheck-script-backend": patch
"@checkstack/healthcheck-ping-backend": patch
"@checkstack/healthcheck-ssh-backend": patch
"@checkstack/healthcheck-redis-backend": patch
"@checkstack/healthcheck-jenkins-backend": patch
"@checkstack/healthcheck-rcon-backend": patch
"@checkstack/collector-hardware-backend": patch
---

Migrate aggregation from batch to incremental (`mergeResult`)

### Breaking Changes (Internal)
- Replaced `aggregateResult(runs[])` with `mergeResult(existing, run)` interface across all HealthCheckStrategy and CollectorStrategy implementations

### New Features
- Added incremental aggregation utilities in `@checkstack/backend-api`:
  - `mergeCounter()` - track occurrences
  - `mergeAverage()` - track sum/count, compute avg
  - `mergeRate()` - track success/total, compute %
  - `mergeMinMax()` - track min/max values
- Exported Zod schemas for internal state: `averageStateSchema`, `rateStateSchema`, `minMaxStateSchema`, `counterStateSchema`

### Improvements
- Enables O(1) storage overhead by maintaining incremental aggregation state
- Prepares for real-time hourly aggregation without batch accumulation
