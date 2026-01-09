---
"@checkmate-monitor/auth-frontend": minor
"@checkmate-monitor/ui": patch
---

# Auth Settings Page Refactoring

## Auth Frontend

Refactored the `AuthSettingsPage` into modular, self-contained tab components:

- **New Components**: Created `UsersTab`, `RolesTab`, `StrategiesTab`, and `ApplicationsTab` components
- **Dynamic Tab Visibility**: Tabs are now conditionally shown based on user permissions
- **Auto-Select Logic**: Automatically selects the first available tab if the current tab becomes inaccessible
- **Self-Contained State**: Each tab component manages its own state, handlers, and dialogs, reducing prop drilling

## UI Package

- **Responsive Tabs**: Tabs now use column layout on small screens and row layout on medium+ screens
