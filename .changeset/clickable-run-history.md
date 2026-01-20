---
"@checkstack/healthcheck-backend": minor
"@checkstack/healthcheck-common": minor
"@checkstack/healthcheck-frontend": minor
---

### Clickable Run History with Deep Linking

**Backend (`healthcheck-backend`):**
- Added `getRunById` service method to fetch a single health check run by ID

**Schema (`healthcheck-common`):**
- Added `getRunById` RPC procedure for fetching individual runs
- Added `historyRun` route for deep linking to specific runs (`/history/:systemId/:configurationId/:runId`)

**Frontend (`healthcheck-frontend`):**
- Table rows in Recent Runs and Run History now navigate to detailed view instead of expanding inline
- Added "Selected Run" card that displays when navigating to a specific run
- Extracted `ExpandedResultView` into reusable component
- Fixed layout shift during table pagination by preserving previous data while loading
- Removed accordion expansion in favor of consistent navigation UX
