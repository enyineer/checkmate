---
"@checkstack/backend-api": patch
"@checkstack/backend": patch
"@checkstack/frontend": patch
"@checkstack/incident-common": patch
"@checkstack/maintenance-common": patch
"@checkstack/healthcheck-common": patch
---

Fixed anonymous user access to public endpoints

Anonymous users were incorrectly denied access to public endpoints with instance-level access rules (idParam). The RPC middleware now correctly checks if anonymous users have global access via the anonymous role before denying access to single-resource endpoints.

Additionally, bulk access rules (`bulkIncident`, `bulkMaintenance`, `bulkStatus`) were not being registered with the plugin system, preventing them from being synced to the anonymous role. These rules are now included in the access rule registration arrays.

Added startup validation to detect unregistered access rules: If a procedure contract references an access rule that isn't registered with the plugin system, the backend will now throw an error at startup instead of failing silently at runtime.

Fixed frontend query retry behavior: API calls that return 401/403 errors are no longer retried, as these are definitive auth responses that won't succeed on retry. This prevents unnecessary loading states and network requests.

This fix ensures that:
- Anonymous users can view health check status, incidents, and maintenances on public status pages
- Dashboard badges for incidents and maintenances are visible to anonymous users
- Health check charts are visible to anonymous users
- Unregistered access rules are caught early at startup, not at runtime
- 401/403 errors fail fast without retries

