import { oc } from "@orpc/contract";
import type { ContractRouterClient } from "@orpc/contract";
import { z } from "zod";

// Theme type - matches ThemeProvider's Theme type
export const ThemeSchema = z.enum(["light", "dark", "system"]);
export type Theme = z.infer<typeof ThemeSchema>;

// Base builder for oRPC contract
const _base = oc;

// Theme RPC Contract
export const themeContract = {
  // Get current user's theme preference
  // No permission required - users can read their own theme
  getTheme: _base.output(
    z.object({
      theme: ThemeSchema,
    })
  ),

  // Set current user's theme preference
  // No permission required - users can set their own theme
  setTheme: _base
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
