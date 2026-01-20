---
"@checkstack/healthcheck-backend": patch
"@checkstack/healthcheck-common": patch
"@checkstack/healthcheck-frontend": patch
"@checkstack/ui": patch
---

### Health Check Aggregation & UI Fixes

**Backend (`healthcheck-backend`):**
- Fixed tail-end bucket truncation where the last aggregated bucket was cut off at the interval boundary instead of extending to the query end date
- Added `rangeEnd` parameter to `reaggregateBuckets()` to properly extend the last bucket
- Fixed cross-tier merge logic (`mergeTieredBuckets`) to prevent hourly aggregates from blocking fresh raw data

**Schema (`healthcheck-common`):**
- Added `bucketEnd` field to `AggregatedBucketBaseSchema` so frontends know the actual end time of each bucket

**Frontend (`healthcheck-frontend`):**
- Updated all components to use `bucket.bucketEnd` instead of calculating from `bucketIntervalSeconds`
- Fixed aggregation mode detection: changed `>` to `>=` so 7-day queries use aggregated data when `rawRetentionDays` is 7
- Added ref-based memoization in `useHealthCheckData` to prevent layout shift during signal-triggered refetches
- Exposed `isFetching` state to show loading spinner during background refetches
- Added debounced custom date range with Apply button to prevent fetching on every field change
- Added validation preventing start date >= end date in custom ranges
- Added sparkline downsampling: when there are 60+ data points, they are aggregated into buckets with informative tooltips

**UI (`ui`):**
- Fixed `DateRangeFilter` presets to use true sliding windows (removed `startOfDay` from 7-day and 30-day ranges)
- Added `disabled` prop to `DateRangeFilter` and `DateTimePicker` components
- Added `onCustomChange` prop to `DateRangeFilter` for debounced custom date handling
- Improved layout: custom date pickers now inline with preset buttons on desktop
- Added responsive mobile layout: date pickers stack vertically with down arrow
- Added validation error display for invalid date ranges

