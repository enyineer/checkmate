---
"@checkstack/ui": patch
"@checkstack/healthcheck-frontend": patch
---

Fixed 24-hour date range not returning correct data and improved chart display

- Fixed missing `endDate` parameter in raw data queries causing data to extend beyond selected time range
- Fixed incorrect 24-hour date calculation using `setHours()` - now uses `date-fns` `subHours()` for correct date math
- Refactored `DateRangePreset` from string union to enum for improved type safety and IDE support
- Exported `getPresetRange` function for reuse across components
- Changed chart x-axis domain from `["auto", "auto"]` to `["dataMin", "dataMax"]` to remove padding gaps
