---
"@checkstack/frontend-api": minor
"@checkstack/dashboard-frontend": minor
"@checkstack/frontend": patch
---

Fix "No QueryClient set" error in containerized builds

**Problem**: The containerized application was throwing "No QueryClient set, use QueryClientProvider to set one" errors during plugin registration. This didn't happen in dev mode.

**Root Cause**: The `@tanstack/react-query` package was being bundled separately in different workspace packages, causing multiple React Query contexts. The `QueryClientProvider` from the main app wasn't visible to plugin code due to this module duplication.

**Changes**:
- `@checkstack/frontend-api`: Export `useQueryClient` from the centralized React Query import, ensuring all packages use the same context
- `@checkstack/dashboard-frontend`: Import `useQueryClient` from `@checkstack/frontend-api` instead of directly from `@tanstack/react-query`, and remove the direct dependency
- `@checkstack/frontend`: Add `@tanstack/react-query` to Vite's `resolve.dedupe` as a safety net
