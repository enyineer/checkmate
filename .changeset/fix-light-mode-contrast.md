---
"@checkmate-monitor/ui": patch
"@checkmate-monitor/catalog-frontend": patch
---

Fix light mode contrast for semantic color tokens

Updated the theme system to use a two-tier pattern for semantic colors:
- Base tokens (`text-destructive`, `text-success`, etc.) are used for text on light backgrounds (`bg-{color}/10`)
- Foreground tokens (`text-destructive-foreground`, etc.) are now white/contrasting and used for text on solid backgrounds

This fixes poor contrast issues with components like the "Incident" badge which had dark red text on a bright red background in light mode.

Components updated: Alert, InfoBanner, HealthBadge, Badge, PermissionDenied, SystemDetailPage
