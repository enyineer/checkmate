import { createPlaywrightConfig } from "@checkstack/test-utils-frontend/playwright";

export default createPlaywrightConfig({
  baseURL: "http://localhost:5173",
});
