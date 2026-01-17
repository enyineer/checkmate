---
"@checkstack/backend-api": patch
"@checkstack/auth-backend": minor
"@checkstack/auth-common": minor
"@checkstack/auth-frontend": minor
"@checkstack/auth-saml-backend": minor
"@checkstack/auth-ldap-backend": minor
"@checkstack/ui": patch
---

Add group-to-role mapping for SAML and LDAP authentication

**Features:**
- SAML and LDAP users can now be automatically assigned Checkstack roles based on their directory group memberships
- Configure group mappings in the authentication strategy settings with dynamic role dropdowns
- Managed role sync: roles configured in mappings are fully synchronized (added when user gains group, removed when user leaves group)
- Unmanaged roles (manually assigned, not in any mapping) are preserved during sync
- Optional default role for all users from a directory

**Bug Fix:**
- Fixed `x-options-resolver` not working for fields inside arrays with `.default([])` in DynamicForm schemas
