---
"@checkstack/backend": patch
"@checkstack/backend-api": patch
"@checkstack/healthcheck-backend": patch
---

Fix collector lookup when health check is assigned to a system

Collectors are now stored in the registry with their fully-qualified ID format (ownerPluginId.collectorId) to match how they are referenced in health check configurations. Added `qualifiedId` field to `RegisteredCollector` interface to avoid re-constructing the ID at query time. This fixes the "Collector not found" warning that occurred when executing health checks with assigned systems.
