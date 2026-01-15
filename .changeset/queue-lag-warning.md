---
"@checkstack/queue-common": minor
"@checkstack/queue-backend": minor
"@checkstack/queue-frontend": minor
"@checkstack/queue-api": minor
"@checkstack/backend": minor
"@checkstack/dashboard-frontend": minor
"@checkstack/test-utils-backend": patch
---

# Queue Lag Warning

Added a queue lag warning system that displays alerts when pending jobs exceed configurable thresholds.

## Features

- **Backend Stats API**: New `getStats`, `getLagStatus`, and `updateLagThresholds` RPC endpoints
- **Signal-based Updates**: `QUEUE_LAG_CHANGED` signal for real-time frontend updates
- **Aggregated Stats**: `QueueManager.getAggregatedStats()` sums stats across all queues
- **Configurable Thresholds**: Warning (default 100) and Critical (default 500) thresholds stored in config
- **Dashboard Integration**: Queue lag alert displayed on main Dashboard (access-gated)
- **Queue Settings Page**: Lag alert and Performance Tuning guidance card with concurrency tips

## UI Changes

- Queue lag alert banner appears on Dashboard and Queue Settings when pending jobs exceed thresholds
- New "Performance Tuning" card with concurrency settings guidance and bottleneck indicators
