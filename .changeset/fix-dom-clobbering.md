---
"@checkstack/ui": patch
---

Fixed DOM clobbering issue in DynamicForm by prefixing field IDs with 'field-'. Previously, schema fields with names matching native DOM properties (like 'nodeName', 'tagName', 'innerHTML') could shadow those properties, causing floating-ui and React to crash during DOM traversal.
