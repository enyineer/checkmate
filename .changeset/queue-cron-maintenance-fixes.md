---
"@checkstack/queue-api": minor
"@checkstack/queue-bullmq-backend": minor
"@checkstack/queue-memory-backend": minor
"@checkstack/maintenance-backend": minor
"@checkstack/ui": patch
---

### Queue System
- Added cron pattern support to `scheduleRecurring()` - accepts either `intervalSeconds` or `cronPattern`
- BullMQ backend uses native cron scheduling via `pattern` option
- InMemoryQueue implements wall-clock cron scheduling with `cron-parser`

### Maintenance Backend
- Auto status transitions now use cron pattern `* * * * *` for precise second-0 scheduling
- User notifications are now sent for auto-started and auto-completed maintenances
- Refactored to call `addUpdate` RPC for status changes, centralizing hook/signal/notification logic

### UI
- DateTimePicker now resets seconds and milliseconds to 0 when time is changed
