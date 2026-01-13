import { describe, expect, it, mock, beforeEach, type Mock } from "bun:test";
import { oc } from "@orpc/contract";
import { call, implement } from "@orpc/server";
import { z } from "zod";
import { autoAuthMiddleware, RpcContext } from "./rpc";
import { createMockRpcContext } from "./test-utils";
import { access, accessPair, ProcedureMetadata } from "@checkstack/common";

// =============================================================================
// TEST CONTRACT DEFINITIONS
// =============================================================================

const _base = oc.$meta<ProcedureMetadata>({});

/**
 * Test contracts for different access patterns.
 */
const testContracts = {
  // Anonymous endpoint - no auth required
  anonymousEndpoint: _base
    .meta({ userType: "anonymous" })
    .output(z.object({ message: z.string() })),

  // Public endpoint with global access rules only (no instance access)
  publicGlobalEndpoint: _base
    .meta({
      userType: "public",
      access: [access("resource", "read", "Test access")],
    })
    .output(z.object({ message: z.string() })),

  // Public endpoint with list filtering
  publicListEndpoint: _base
    .meta({
      userType: "public",
      access: [
        accessPair(
          "system",
          { read: "View systems", manage: "Manage systems" },
          { listKey: "systems", readIsPublic: true }
        ).read,
      ],
    })
    .output(
      z.object({
        systems: z.array(z.object({ id: z.string(), name: z.string() })),
      })
    ),

  // Authenticated endpoint
  authenticatedEndpoint: _base
    .meta({ userType: "authenticated" })
    .output(z.object({ message: z.string() })),

  // User-only endpoint
  userOnlyEndpoint: _base
    .meta({ userType: "user" })
    .output(z.object({ message: z.string() })),

  // Service-only endpoint
  serviceOnlyEndpoint: _base
    .meta({ userType: "service" })
    .output(z.object({ message: z.string() })),

  // Single resource endpoint with idParam
  singleResourceEndpoint: _base
    .meta({
      userType: "public",
      access: [
        accessPair(
          "system",
          { read: "View systems", manage: "Manage systems" },
          { idParam: "systemId", readIsPublic: true }
        ).read,
      ],
    })
    .input(z.object({ systemId: z.string() }))
    .output(z.object({ system: z.object({ id: z.string() }).nullable() })),
};

// =============================================================================
// TEST ROUTER IMPLEMENTATION
// =============================================================================

/**
 * Create the test router using implement + contract pattern.
 */
function createTestRouter() {
  return implement(testContracts)
    .$context<RpcContext>()
    .use(autoAuthMiddleware)
    .router({
      anonymousEndpoint: implement(testContracts.anonymousEndpoint)
        .$context<RpcContext>()
        .handler(async () => ({
          message: "success",
        })),

      publicGlobalEndpoint: implement(testContracts.publicGlobalEndpoint)
        .$context<RpcContext>()
        .handler(async () => ({
          message: "success",
        })),

      publicListEndpoint: implement(testContracts.publicListEndpoint)
        .$context<RpcContext>()
        .handler(async () => ({
          systems: [
            { id: "sys-1", name: "System 1" },
            { id: "sys-2", name: "System 2" },
            { id: "sys-3", name: "System 3" },
          ],
        })),

      authenticatedEndpoint: implement(testContracts.authenticatedEndpoint)
        .$context<RpcContext>()
        .handler(async () => ({
          message: "success",
        })),

      userOnlyEndpoint: implement(testContracts.userOnlyEndpoint)
        .$context<RpcContext>()
        .handler(async () => ({
          message: "success",
        })),

      serviceOnlyEndpoint: implement(testContracts.serviceOnlyEndpoint)
        .$context<RpcContext>()
        .handler(async () => ({
          message: "success",
        })),

      singleResourceEndpoint: implement(testContracts.singleResourceEndpoint)
        .$context<RpcContext>()
        .handler(async ({ input }) => ({
          system: { id: input.systemId },
        })),
    });
}

describe("autoAuthMiddleware", () => {
  let mockContext: RpcContext;
  let router: ReturnType<typeof createTestRouter>;

  beforeEach(() => {
    mockContext = createMockRpcContext();
    router = createTestRouter();
  });

  // ==========================================================================
  // ANONYMOUS ENDPOINTS (userType: "anonymous")
  // ==========================================================================

  describe("anonymous endpoints (userType: anonymous)", () => {
    it("should allow access without authentication", async () => {
      const result = await call(router.anonymousEndpoint, undefined, {
        context: mockContext,
      });
      expect(result).toEqual({ message: "success" });
    });

    it("should skip all access rule checks", async () => {
      const result = await call(router.anonymousEndpoint, undefined, {
        context: mockContext,
      });
      expect(result).toEqual({ message: "success" });
      // getAnonymousAccessRules should NOT be called for anonymous endpoints
      expect(mockContext.auth.getAnonymousAccessRules).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PUBLIC ENDPOINTS - Global Access Rules
  // ==========================================================================

  describe("public endpoints with global access rules", () => {
    it("should allow anonymous users with matching access rule", async () => {
      // Mock anonymous role has the required access rule
      (
        mockContext.auth.getAnonymousAccessRules as Mock<
          () => Promise<string[]>
        >
      ).mockResolvedValue(["test-plugin.resource.read"]);

      const result = await call(router.publicGlobalEndpoint, undefined, {
        context: mockContext,
      });
      expect(result).toEqual({ message: "success" });
      expect(mockContext.auth.getAnonymousAccessRules).toHaveBeenCalled();
    });

    it("should reject anonymous users without matching access rule", async () => {
      // Mock anonymous role does NOT have the required access rule
      (
        mockContext.auth.getAnonymousAccessRules as Mock<
          () => Promise<string[]>
        >
      ).mockResolvedValue([]);

      await expect(
        call(router.publicGlobalEndpoint, undefined, { context: mockContext })
      ).rejects.toThrow();
    });

    it("should allow authenticated users with matching access rule", async () => {
      mockContext.user = {
        type: "user",
        id: "user-1",
        accessRules: ["test-plugin.resource.read"],
      };

      const result = await call(router.publicGlobalEndpoint, undefined, {
        context: mockContext,
      });
      expect(result).toEqual({ message: "success" });
      expect(mockContext.auth.getAnonymousAccessRules).not.toHaveBeenCalled();
    });

    it("should reject authenticated users without matching access rule", async () => {
      mockContext.user = {
        type: "user",
        id: "user-1",
        accessRules: ["other.permission"],
      };

      await expect(
        call(router.publicGlobalEndpoint, undefined, { context: mockContext })
      ).rejects.toThrow();
    });

    it("should allow users with wildcard access rule", async () => {
      mockContext.user = {
        type: "user",
        id: "user-1",
        accessRules: ["*"],
      };

      const result = await call(router.publicGlobalEndpoint, undefined, {
        context: mockContext,
      });
      expect(result).toEqual({ message: "success" });
    });

    it("should allow service users without checking access rules", async () => {
      mockContext.user = {
        type: "service",
        pluginId: "other-plugin",
      };

      const result = await call(router.publicGlobalEndpoint, undefined, {
        context: mockContext,
      });
      expect(result).toEqual({ message: "success" });
    });
  });

  // ==========================================================================
  // PUBLIC ENDPOINTS - List Filtering (Regression test for anonymous access)
  // ==========================================================================

  describe("public endpoints with list filtering (instanceAccess.listKey)", () => {
    it("should return all items for anonymous users WITH global access", async () => {
      // Anonymous role HAS the required access rule
      (
        mockContext.auth.getAnonymousAccessRules as Mock<
          () => Promise<string[]>
        >
      ).mockResolvedValue(["test-plugin.system.read"]);

      const result = await call(router.publicListEndpoint, undefined, {
        context: mockContext,
      });

      // Should return all systems since anonymous has global access
      expect(result.systems).toHaveLength(3);
      expect(result.systems.map((s) => s.id)).toEqual([
        "sys-1",
        "sys-2",
        "sys-3",
      ]);
    });

    it("should return empty list for anonymous users WITHOUT global access", async () => {
      // Anonymous role does NOT have the required access rule
      (
        mockContext.auth.getAnonymousAccessRules as Mock<
          () => Promise<string[]>
        >
      ).mockResolvedValue([]);

      const result = await call(router.publicListEndpoint, undefined, {
        context: mockContext,
      });

      // Should return empty list since anonymous has no access
      expect(result.systems).toHaveLength(0);
    });

    it("should return all items for anonymous users with wildcard access", async () => {
      // Anonymous role has wildcard access
      (
        mockContext.auth.getAnonymousAccessRules as Mock<
          () => Promise<string[]>
        >
      ).mockResolvedValue(["*"]);

      const result = await call(router.publicListEndpoint, undefined, {
        context: mockContext,
      });

      // Should return all systems
      expect(result.systems).toHaveLength(3);
    });

    it("should filter items via S2S for authenticated users without global access", async () => {
      mockContext.user = {
        type: "user",
        id: "user-1",
        accessRules: [], // No global access
      };

      // Mock S2S call returns only accessible IDs
      (
        mockContext.auth.getAccessibleResourceIds as Mock<
          () => Promise<string[]>
        >
      ).mockResolvedValue(["sys-1", "sys-3"]);

      const result = await call(router.publicListEndpoint, undefined, {
        context: mockContext,
      });

      // Should return only filtered systems
      expect(result.systems).toHaveLength(2);
      expect(result.systems.map((s) => s.id)).toEqual(["sys-1", "sys-3"]);
    });

    it("should return all items for authenticated users with global access", async () => {
      mockContext.user = {
        type: "user",
        id: "user-1",
        accessRules: ["test-plugin.system.read"], // Has global access
      };

      // S2S should return all items when user has global access
      (
        mockContext.auth.getAccessibleResourceIds as Mock<
          () => Promise<string[]>
        >
      ).mockResolvedValue(["sys-1", "sys-2", "sys-3"]);

      const result = await call(router.publicListEndpoint, undefined, {
        context: mockContext,
      });

      expect(result.systems).toHaveLength(3);
    });
  });

  // ==========================================================================
  // AUTHENTICATED ENDPOINTS
  // ==========================================================================

  describe("authenticated endpoints (userType: authenticated)", () => {
    it("should reject unauthenticated requests", async () => {
      // No user in context
      await expect(
        call(router.authenticatedEndpoint, undefined, { context: mockContext })
      ).rejects.toThrow("Authentication required");
    });

    it("should allow authenticated users", async () => {
      mockContext.user = {
        type: "user",
        id: "user-1",
        accessRules: [],
      };

      const result = await call(router.authenticatedEndpoint, undefined, {
        context: mockContext,
      });
      expect(result).toEqual({ message: "success" });
    });

    it("should allow service users", async () => {
      mockContext.user = {
        type: "service",
        pluginId: "other-plugin",
      };

      const result = await call(router.authenticatedEndpoint, undefined, {
        context: mockContext,
      });
      expect(result).toEqual({ message: "success" });
    });
  });

  // ==========================================================================
  // USER-ONLY ENDPOINTS
  // ==========================================================================

  describe("user-only endpoints (userType: user)", () => {
    it("should reject service users", async () => {
      mockContext.user = {
        type: "service",
        pluginId: "other-plugin",
      };

      await expect(
        call(router.userOnlyEndpoint, undefined, { context: mockContext })
      ).rejects.toThrow("This endpoint is for users only");
    });

    it("should allow real users", async () => {
      mockContext.user = {
        type: "user",
        id: "user-1",
        accessRules: [],
      };

      const result = await call(router.userOnlyEndpoint, undefined, {
        context: mockContext,
      });
      expect(result).toEqual({ message: "success" });
    });
  });

  // ==========================================================================
  // SERVICE-ONLY ENDPOINTS
  // ==========================================================================

  describe("service-only endpoints (userType: service)", () => {
    it("should reject real users", async () => {
      mockContext.user = {
        type: "user",
        id: "user-1",
        accessRules: [],
      };

      await expect(
        call(router.serviceOnlyEndpoint, undefined, { context: mockContext })
      ).rejects.toThrow("This endpoint is for services only");
    });

    it("should allow service users", async () => {
      mockContext.user = {
        type: "service",
        pluginId: "other-plugin",
      };

      const result = await call(router.serviceOnlyEndpoint, undefined, {
        context: mockContext,
      });
      expect(result).toEqual({ message: "success" });
    });
  });

  // ==========================================================================
  // SINGLE RESOURCE ACCESS
  // ==========================================================================

  describe("single resource access (instanceAccess.idParam)", () => {
    it("should deny anonymous users access to single resources", async () => {
      // Anonymous role has the access rule
      (
        mockContext.auth.getAnonymousAccessRules as Mock<
          () => Promise<string[]>
        >
      ).mockResolvedValue(["test-plugin.system.read"]);

      await expect(
        call(
          router.singleResourceEndpoint,
          { systemId: "sys-1" },
          { context: mockContext }
        )
      ).rejects.toThrow("Authentication required to access system:sys-1");
    });

    it("should check team access via S2S for authenticated users", async () => {
      mockContext.user = {
        type: "user",
        id: "user-1",
        accessRules: [],
      };

      (
        mockContext.auth.checkResourceTeamAccess as Mock<
          () => Promise<{ hasAccess: boolean }>
        >
      ).mockResolvedValue({ hasAccess: true });

      const result = await call(
        router.singleResourceEndpoint,
        { systemId: "sys-1" },
        { context: mockContext }
      );

      expect(result.system?.id).toBe("sys-1");
      expect(mockContext.auth.checkResourceTeamAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          resourceId: "sys-1",
        })
      );
    });

    it("should deny access when team access check fails", async () => {
      mockContext.user = {
        type: "user",
        id: "user-1",
        accessRules: [],
      };

      (
        mockContext.auth.checkResourceTeamAccess as Mock<
          () => Promise<{ hasAccess: boolean }>
        >
      ).mockResolvedValue({ hasAccess: false });

      await expect(
        call(
          router.singleResourceEndpoint,
          { systemId: "sys-1" },
          { context: mockContext }
        )
      ).rejects.toThrow("Access denied to resource system:sys-1");
    });
  });
});
