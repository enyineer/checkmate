/**
 * @checkstack/test-utils-frontend
 *
 * Centralized testing utilities for frontend packages in Checkstack.
 * Provides Happy DOM and Testing Library integration for Bun tests.
 *
 * ## Quick Setup (Unit Tests)
 *
 * 1. Add as devDependency:
 *    ```json
 *    "devDependencies": {
 *      "@checkstack/test-utils-frontend": "workspace:*"
 *    }
 *    ```
 *
 * 2. Create bunfig.toml:
 *    ```toml
 *    [test]
 *    preload = ["@checkstack/test-utils-frontend/setup"]
 *    ```
 *
 * 3. Write tests using @testing-library/react
 *
 * ## E2E Testing with Playwright
 *
 * Import from "@checkstack/test-utils-frontend/playwright":
 *    ```typescript
 *    import { createPlaywrightConfig, test, expect } from "@checkstack/test-utils-frontend/playwright";
 *    ```
 */

// Re-export testing library for convenience
export {
  render,
  screen,
  cleanup,
  renderHook,
  act,
  waitFor,
} from "@testing-library/react";
