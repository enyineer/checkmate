---
"@checkstack/backend": patch
---

Improved RPC error logging to include full stack traces for procedure errors. Previously, errors inside RPC handlers (such as database table not found errors) resulted in silent 500 responses. Now these errors are logged with detailed information to the backend console for easier debugging.
