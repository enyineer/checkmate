---
"@checkstack/maintenance-backend": minor
---

Add automatic maintenance status transitions

Maintenances now automatically transition from `scheduled` to `in_progress` when their `startAt` time is reached, and from `in_progress` to `completed` when their `endAt` time is reached. A recurring queue job runs every minute to check and transition statuses. Integration hooks and real-time signals are emitted upon each transition.
