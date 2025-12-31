import { describe, it, expect, mock } from "bun:test";
import { enrichUser } from "./user";
import { User } from "better-auth/types";

// Mock Drizzle DB
const createMockDb = (data: { roles?: unknown[]; permissions?: unknown[] }) => {
  const mockDb: any = {
    select: mock(() => mockDb),
    from: mock(() => mockDb),
    innerJoin: mock(() => mockDb),
    where: mock(() => mockDb),
  };

  // Mock thenable for different chains
  // eslint-disable-next-line unicorn/no-thenable
  mockDb.then = (resolve: (arg0: unknown) => void) => {
    // Determine which call this is based on the 'from' call
    // const lastFrom =
    //   mockDb.from.mock.calls[mockDb.from.mock.calls.length - 1][0];

    // We need to look at the schema name or some identifier.
    // Since we are mocking the schema as well, we can check equality.
    // However, for a simple mock, we can just alternate or use a counter.

    // In enrichUser:
    // 1. select from userRole (inner join role)
    // 2. select from rolePermission (inner join permission) -> for each role

    // Let's use a simpler approach: track call count for this specific mock instance
    if (!mockDb._callCount) mockDb._callCount = 0;
    mockDb._callCount++;

    if (mockDb._callCount === 1) {
      return resolve(data.roles || []);
    }
    return resolve(data.permissions || []);
  };

  return mockDb;
};

describe("enrichUser", () => {
  const baseUser: User = {
    id: "user-1",
    email: "test@example.com",
    emailVerified: true,
    name: "Test User",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should enrich user with admin role and wildcard permission", async () => {
    const mockDb = createMockDb({
      roles: [{ roleId: "admin" }],
    });

    const result = await enrichUser(baseUser, mockDb);

    expect(result.roles).toContain("admin");
    expect(result.permissions).toContain("*");
  });

  it("should enrich user with custom roles and permissions", async () => {
    const mockDb = createMockDb({
      roles: [{ roleId: "editor" }, { roleId: "viewer" }],
      permissions: [{ permissionId: "blog.read" }],
    });

    // Note: Our simple mock returns the same permissions for ALL roles if there are multiple roles.
    // In enrichUser, it loops through roles.
    // If we have 2 roles, enrichUser will call select from rolePermission twice.
    // Our mock needs to handle multiple calls if we want to be precise.

    let callCount = 0;
    // eslint-disable-next-line unicorn/no-thenable
    mockDb.then = (resolve: (arg0: unknown) => void) => {
      callCount++;
      if (callCount === 1) return resolve([{ roleId: "editor" }]);
      if (callCount === 2) return resolve([{ permissionId: "blog.edit" }]);
      return resolve([]);
    };

    const result = await enrichUser(baseUser, mockDb);

    expect(result.roles).toContain("editor");
    expect(result.permissions).toContain("blog.edit");
  });

  it("should handle user with no roles", async () => {
    const mockDb = createMockDb({
      roles: [],
    });

    const result = await enrichUser(baseUser, mockDb);

    expect(result.roles).toEqual([]);
    expect(result.permissions).toEqual([]);
  });
});
