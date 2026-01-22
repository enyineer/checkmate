---
"@checkstack/integration-frontend": patch
---

Improve subscription creation UX by requiring event selection before showing provider configuration

The provider configuration section now waits for an event to be selected before rendering, preventing template validation errors when no payload properties are available yet.
