import { implement, ORPCError } from "@orpc/server";
import type { RpcContext } from "@checkmate/backend-api";
import { themeContract } from "@checkmate/theme-common";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// Create implementer from contract with our context
const os = implement(themeContract).$context<RpcContext>();

export const createThemeRouter = (db: NodePgDatabase<typeof schema>) => {
  const getTheme = os.getTheme.handler(async ({ context }) => {
    const userId = context.user?.id as string | undefined;

    if (!userId) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Unauthorized",
      });
    }

    // Query user theme preference
    const preferences = await db
      .select({ theme: schema.userThemePreference.theme })
      .from(schema.userThemePreference)
      .where(eq(schema.userThemePreference.userId, userId))
      .limit(1);

    // Return preference or default to 'system'
    const theme = preferences[0]?.theme || "system";
    return { theme: theme as "light" | "dark" | "system" };
  });

  const setTheme = os.setTheme.handler(async ({ input, context }) => {
    const userId = context.user?.id as string | undefined;

    if (!userId) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Unauthorized",
      });
    }

    const { theme } = input;

    // Upsert theme preference
    await db
      .insert(schema.userThemePreference)
      .values([
        {
          userId,
          theme,
          updatedAt: new Date(),
        },
      ])
      .onConflictDoUpdate({
        target: [schema.userThemePreference.userId],
        set: {
          theme,
          updatedAt: new Date(),
        },
      });
  });

  return os.router({
    getTheme,
    setTheme,
  });
};

export type ThemeRouter = ReturnType<typeof createThemeRouter>;
