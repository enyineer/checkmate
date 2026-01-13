---
"@checkstack/healthcheck-common": minor
"@checkstack/healthcheck-backend": minor
"@checkstack/healthcheck-frontend": minor
"@checkstack/healthcheck-http-backend": patch
---

Add UUID-based collector identification for better multiple collector support

**Breaking Change**: Existing health check configurations with collectors need to be recreated.

- Each collector instance now has a unique UUID assigned on creation
- Collector results are stored under the UUID key with `_collectorId` and `_assertionFailed` metadata
- Auto-charts correctly display separate charts for each collector instance
- Charts are now grouped by collector instance with clear headings
- Assertion status card shows pass/fail for each collector
- Renamed "Success" to "HTTP Success" to clarify it's about HTTP request success
- Fixed deletion of collectors not persisting to database
- Fixed duplicate React key warnings in auto-chart grid
