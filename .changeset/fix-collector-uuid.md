---
"@checkstack/healthcheck-frontend": patch
---

Fix collector add button failing in HTTP contexts by replacing `crypto.randomUUID()` with the `uuid` package
