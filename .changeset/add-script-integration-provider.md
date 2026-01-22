---
"@checkstack/integration-script-backend": minor
"@checkstack/healthcheck-script-backend": minor
"@checkstack/ui": major
"@checkstack/common": patch
---

Add script execution support and migrate CodeEditor to Monaco

**Integration providers** (`@checkstack/integration-script-backend`):
- **Script** - Execute TypeScript/JavaScript with context object
- **Bash** - Execute shell scripts with environment variables ($EVENT_ID, $PAYLOAD_*)

**Health check collectors** (`@checkstack/healthcheck-script-backend`):
- **InlineScriptCollector** - Run TypeScript directly for health checks
- **ExecuteCollector** - Bash syntax highlighting for command field

**CodeEditor migration to Monaco** (`@checkstack/ui`):
- Replaced CodeMirror with Monaco Editor (VS Code's editor)
- Full TypeScript/JavaScript IntelliSense with custom type definitions
- Added `generateTypeDefinitions()` for JSON Schema → TypeScript conversion
- Removed all CodeMirror dependencies

**Type updates** (`@checkstack/common`):
- Added `javascript`, `typescript`, and `bash` to `EditorType` union
