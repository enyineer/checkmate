---
"@checkstack/queue-memory-backend": patch
---

Fixed recurring job flakiness caused by job ID collisions when rescheduling within the same millisecond. Added random suffix to job IDs to ensure uniqueness.
