---
"@checkstack/incident-backend": patch
"@checkstack/maintenance-backend": patch
"@checkstack/incident-common": patch
"@checkstack/maintenance-common": patch
"@checkstack/ui": patch
---

Fix creator display in incident and maintenance status updates

- Show the creator's profile name instead of UUID in status updates
- For maintenances, now properly displays the creator name (was missing)
- For incidents, replaces UUID with human-readable profile name
- System-generated updates (automatic maintenance transitions) show no creator
