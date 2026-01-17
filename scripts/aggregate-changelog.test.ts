import { describe, expect, test } from "bun:test";
import { isDependencyOnlyChangelog } from "./aggregate-changelog";

describe("isDependencyOnlyChangelog", () => {
  test("returns true for changelog with only Updated dependencies entries", () => {
    const changelog = `### Patch Changes

- Updated dependencies [4eed42d]
  - @checkstack/frontend-api@0.3.0`;

    expect(isDependencyOnlyChangelog(changelog)).toBe(true);
  });

  test("returns true for changelog with multiple Updated dependencies entries", () => {
    const changelog = `### Patch Changes

- Updated dependencies [4eed42d]
  - @checkstack/frontend-api@0.3.0
- Updated dependencies [7a23261]
  - @checkstack/common@0.3.0`;

    expect(isDependencyOnlyChangelog(changelog)).toBe(true);
  });

  test("returns false for changelog with actual changes", () => {
    const changelog = `### Minor Changes

- 7a23261: ## TanStack Query Integration

  Migrated all frontend components to use \`usePluginClient\` hook.`;

    expect(isDependencyOnlyChangelog(changelog)).toBe(false);
  });

  test("returns false for changelog with mixed changes and dependencies", () => {
    const changelog = `### Minor Changes

- 7a23261: ## TanStack Query Integration

  Migrated all frontend components to use \`usePluginClient\` hook.

### Patch Changes

- Updated dependencies [7a23261]
  - @checkstack/frontend-api@0.2.0`;

    expect(isDependencyOnlyChangelog(changelog)).toBe(false);
  });

  test("returns true for empty changelog", () => {
    expect(isDependencyOnlyChangelog("")).toBe(true);
  });

  test("returns true for changelog with only headers and no bullet points", () => {
    const changelog = `### Patch Changes

`;
    expect(isDependencyOnlyChangelog(changelog)).toBe(true);
  });

  test("handles changelog with patch description (not dependency)", () => {
    const changelog = `### Patch Changes

- d20d274: Initial release of all @checkstack packages.`;

    expect(isDependencyOnlyChangelog(changelog)).toBe(false);
  });

  test("handles major changes correctly", () => {
    const changelog = `### Major Changes

- 8e43507: BREAKING: \`getSystems\` now returns \`{ systems: [...] }\` instead of plain array`;

    expect(isDependencyOnlyChangelog(changelog)).toBe(false);
  });
});
