---
"@checkstack/backend": minor
---

### Schema-Scoped Database: Improved Builder Detection and Security

**Features:**
- Implemented `entityKind`-based detection of Drizzle query builders, replacing the hardcoded method name list. This automatically handles new Drizzle methods that use existing builder types.
- Added `ScopedDatabase<TSchema>` type that excludes the relational query API (`db.query.*`) at compile-time, providing better developer experience for plugin authors.

**Security:**
- Blocked access to `db.query.*` (relational query API) in schema-scoped databases because it bypasses schema isolation. Plugins must use the standard query builder API (`db.select().from(table)`) instead.
- Runtime error with helpful message is thrown if `db.query` is accessed, guiding developers to the correct API.

**Documentation:**
- Added comprehensive internal documentation explaining the chain-recording approach, why transactions are required for `SET LOCAL`, and how the proxy works.
