---
"@checkmate-monitor/backend": patch
"@checkmate-monitor/frontend": patch
"@checkmate-monitor/frontend-api": patch
"@checkmate-monitor/auth-frontend": patch
---

Add runtime configuration API for Docker deployments

- Backend: Add `/api/config` endpoint serving `BASE_URL` at runtime
- Backend: Update CORS to use `BASE_URL` and auto-allow Vite dev server
- Backend: `INTERNAL_URL` now defaults to `localhost:3000` (no BASE_URL fallback)
- Frontend API: Add `RuntimeConfigProvider` context for runtime config
- Frontend: Use `RuntimeConfigProvider` from `frontend-api`
- Auth Frontend: Add `useAuthClient()` hook using runtime config
