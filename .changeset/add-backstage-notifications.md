---
"@checkstack/notification-backstage-backend": minor
---

Add Backstage notification provider plugin

This new plugin enables forwarding Checkstack notifications to external Backstage instances via the Backstage Notifications REST API.

**Features:**
- Admin configuration for Backstage instance URL and API token
- User configuration for custom entity reference (e.g., `user:default/john.doe`)
- Automatic entity reference generation from user email when not specified
- Severity mapping from Checkstack importance levels to Backstage severity
- Full admin and user setup instructions
