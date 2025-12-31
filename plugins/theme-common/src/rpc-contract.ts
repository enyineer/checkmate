import { oc } from "@orpc/contract";
import type { ContractRouterClient } from "@orpc/contract";
import type { ProcedureMetadata } from "@checkmate/common";
import { z } from "zod";

// Theme type - matches ThemeProvider's Theme type
export const ThemeSchema = z.enum(["light", "dark", "system"]);
export type Theme = z.infer<typeof ThemeSchema>;

// Base builder with full metadata support
const _base = oc.$meta<ProcedureMetadata>({});

// Theme RPC Contract
export const themeContract = {
  // Get current user's theme preference
  // User-only - each user reads their own theme
  getTheme: _base.meta({ userType: "user" }).output(
    z.object({
      theme: ThemeSchema,
    })
  ),

  // Set current user's theme preference
  // User-only - each user sets their own theme
  setTheme: _base
    .meta({ userType: "user" })
    .input(
      z.object({
        theme: ThemeSchema,
      })
    )
    .output(z.void()),
};

// Export contract type for frontend
export type ThemeContract = typeof themeContract;

// Export typed client for backend-to-backend communication
export type ThemeClient = ContractRouterClient<typeof themeContract>;
