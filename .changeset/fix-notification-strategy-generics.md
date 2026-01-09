---
"@checkmate-monitor/backend-api": patch
"@checkmate-monitor/notification-backend": patch
---

Fixed TypeScript generic contravariance issue in notification strategy registration.

The `register` and `addStrategy` methods now use generic type parameters instead of `unknown`, allowing notification strategy plugins with typed OAuth configurations to be registered without compiler errors. This fixes contravariance issues where function parameters in `StrategyOAuthConfig<TConfig>` could not be assigned when `TConfig` was a specific type.
