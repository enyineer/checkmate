---
"@checkstack/healthcheck-frontend": patch
---

## Fix Counter Chart Multiplier Display

Hide redundant "(1×)" multiplier suffix for single-value counters in auto-charts. For aggregated counter values like "Errors", the displayed value itself represents the count, so showing "(1×)" adds no information and is confusing.
