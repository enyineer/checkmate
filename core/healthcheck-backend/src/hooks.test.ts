import { describe, it, expect } from "bun:test";
import { healthCheckHooks } from "./hooks";

describe("Health Check Hooks", () => {
  it("should have systemDegraded hook with correct ID", () => {
    expect(healthCheckHooks.systemDegraded.id).toBe(
      "healthcheck.system.degraded"
    );
  });

  it("should have systemHealthy hook with correct ID", () => {
    expect(healthCheckHooks.systemHealthy.id).toBe(
      "healthcheck.system.healthy"
    );
  });
});
