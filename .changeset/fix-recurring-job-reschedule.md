---
"@checkstack/queue-memory-backend": patch
"@checkstack/queue-api": patch
"@checkstack/queue-bullmq-backend": patch
---

Fix recurring jobs resilience and add logger support

**Rescheduling Fix:**
Previously, recurring job rescheduling logic was inside the `try` block of `processJob()`. When a job handler threw an exception and `maxRetries` was exhausted (or 0), the recurring job would never be rescheduled, permanently breaking the scheduling chain.

This fix moves the rescheduling logic to the `finally` block, ensuring recurring jobs are always rescheduled after execution, regardless of success or failure.

**Heartbeat Mechanism:**
Added a periodic heartbeat (default: 5 seconds) that checks for ready jobs and triggers processing. This ensures jobs are processed even if `setTimeout` callbacks fail to fire (e.g., after system sleep/wake cycles). Configurable via `heartbeatIntervalMs` option; set to 0 to disable.

**Logger Service Integration:**
- Added optional `logger` parameter to `QueuePlugin.createQueue()` interface
- `InMemoryQueue` now uses the provided logger instead of raw `console.error`
- Consistent with the rest of the codebase's logging patterns
