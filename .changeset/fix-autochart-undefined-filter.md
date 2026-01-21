---
"@checkstack/healthcheck-frontend": patch
---

Fix runtime error in AutoChartGrid when mapping over values with undefined elements

The filter functions `getAllBooleanValuesWithTime` and `getAllStringValuesWithTime` incorrectly checked `v !== null` instead of `v !== undefined`, allowing undefined elements to pass through and crash when accessing `.value`.
