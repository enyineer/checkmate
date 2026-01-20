---
"@checkstack/ui": minor
"@checkstack/frontend": patch
"@checkstack/api-docs-frontend": patch
"@checkstack/auth-frontend": patch
"@checkstack/catalog-frontend": patch
"@checkstack/healthcheck-frontend": patch
"@checkstack/incident-frontend": patch
"@checkstack/integration-frontend": patch
"@checkstack/maintenance-frontend": patch
"@checkstack/notification-frontend": patch
"@checkstack/queue-frontend": patch
---

Add icon support to PageLayout and improve mobile responsiveness

**PageLayout Icons:**
- Added required `icon` prop to `PageLayout` and `PageHeader` components that accepts a Lucide icon component reference
- Icons are rendered with consistent `h-6 w-6 text-primary` styling
- Updated all page components to include appropriate icons in their headers

**Mobile Layout Improvements:**
- Standardized responsive padding in main app shell (`p-3` on mobile, `p-6` on desktop)
- Added `CardHeaderRow` component for mobile-safe card headers with proper wrapping
- Improved `DateRangeFilter` responsive behavior with vertical stacking on mobile
- Migrated pages to use `PageLayout` for consistent responsive behavior
