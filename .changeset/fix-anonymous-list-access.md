---
"@checkstack/backend-api": patch
---

Fix anonymous users not seeing public list endpoints

Anonymous users with global access rules (e.g., `catalog.system.read` assigned to the "anonymous" role) were incorrectly getting empty results from list endpoints with `instanceAccess.listKey`. The middleware now properly checks if anonymous users have global access before filtering.

Added comprehensive test suite for `autoAuthMiddleware` covering:
- Anonymous endpoints (userType: "anonymous")
- Public endpoints with global and instance-level access rules
- Authenticated, user-only, and service-only endpoints
- Single resource access with team-based filtering
