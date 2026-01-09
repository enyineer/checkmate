---
"@checkmate-monitor/frontend-api": minor
"@checkmate-monitor/auth-frontend": minor
"@checkmate-monitor/catalog-frontend": patch
"@checkmate-monitor/healthcheck-frontend": patch
"@checkmate-monitor/incident-frontend": patch
"@checkmate-monitor/maintenance-frontend": patch
"@checkmate-monitor/queue-frontend": patch
"@checkmate-monitor/notification-frontend": patch
"@checkmate-monitor/integration-frontend": patch
"@checkmate-monitor/api-docs-frontend": patch
---

### User Menu Loading State Fix

Fixed user menu items "popping in" one after another due to independent async permission checks.

**Changes:**
- Added `UserMenuItemsContext` interface with `permissions` and `hasCredentialAccount` to `@checkmate-monitor/frontend-api`
- `LoginNavbarAction` now pre-fetches all permissions and credential account info before rendering the menu
- All user menu item components now use the passed context for synchronous permission checks instead of async hooks
- Uses `qualifyPermissionId` helper for fully-qualified permission IDs

**Result:** All menu items appear simultaneously when the user menu opens.
