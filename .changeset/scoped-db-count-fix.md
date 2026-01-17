---
"@checkstack/backend": patch
"@checkstack/healthcheck-backend": patch
---

Fixed 500 errors on healthcheck `getHistory` and `getDetailedHistory` endpoints caused by the scoped database proxy not handling Drizzle's `$count()` utility method.

**Root Cause:** The `$count()` method returns a Promise directly (not a query builder), bypassing the chain-replay mechanism used for schema isolation. This caused queries to run without the proper `search_path`, resulting in database errors.

**Changes:**
- Added explicit `$count` method handling in `scoped-db.ts` to wrap count operations in transactions with proper schema isolation
- Wrapped `$count` return values with `Number()` in healthcheck service to handle BigInt serialization
