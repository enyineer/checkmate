---
"@checkstack/dashboard-frontend": patch
---

Fixed notification group subscription for catalog groups:
- Fixed group ID format using colon separator instead of dots and missing entity type prefix
- Fixed subscription button state not updating after subscribe/unsubscribe by using refetch instead of invalidateQueries
