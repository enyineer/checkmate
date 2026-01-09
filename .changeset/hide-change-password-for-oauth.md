---
"@checkmate-monitor/auth-frontend": patch
---

Hide "Change Password" menu item for non-credential users

The change password feature now only appears in the user menu for users who have
a credential-based account (email/password). Users who authenticated exclusively
via OAuth providers (e.g., GitHub, Google) will no longer see this option since
they don't have a password to change.
