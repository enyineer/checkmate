---
"@checkstack/healthcheck-frontend": patch
---

- Fixed raw data visualization being cut off when viewing "Last 24 hours" timeframe. The `useHealthCheckData` hook was incorrectly applying pagination limits to chart data queries, causing only the oldest runs to be displayed when there were more runs than the limit. Charts now fetch all runs within the selected date range.
- Updated Status Timeline visualization for raw data to show stacked status distribution (green/yellow/red proportions) instead of the previous "worst status wins" approach. This makes the raw data view consistent with the aggregated data view.
