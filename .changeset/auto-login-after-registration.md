---
"@checkstack/auth-backend": patch
"@checkstack/auth-frontend": patch
---

# Auto-login after credential registration

Users are now automatically logged in after successful registration when using the credential (email & password) authentication strategy.

## Changes

### Backend (`@checkstack/auth-backend`)
- Added `autoSignIn: true` to the `emailAndPassword` configuration in better-auth
- Users no longer need to manually log in after registration; a session is created immediately upon successful sign-up

### Frontend (`@checkstack/auth-frontend`)
- Updated `RegisterPage` to use full page navigation after registration to ensure the session state refreshes correctly
- Updated `LoginPage` to use full page navigation after login to ensure fresh permissions state when switching between users
