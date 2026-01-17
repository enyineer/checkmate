---
"@checkstack/notification-frontend": patch
---

Fixed notification count badge not updating correctly when notifications are marked as read.

**Root Cause:** When the `NOTIFICATION_READ` signal was received, `signalUnreadCount` state was `undefined` (only set from signals, not initial query data), so it incorrectly defaulted to `1` instead of the actual count from the query. This caused the count to jump to `0` after the first mark-as-read.

**Fix:** Now uses `unreadData?.count` as the fallback value when decrementing the count in the signal handler.
