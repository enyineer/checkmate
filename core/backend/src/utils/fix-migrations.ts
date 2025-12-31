import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { rootLogger } from "../logger";

/**
 * Fixes Drizzle-generated migrations to be schema-agnostic by removing
 * hardcoded "public" schema references from foreign key constraints.
 *
 * This is necessary because our architecture uses per-plugin schemas
 * (e.g., plugin_catalog-backend) but Drizzle hardcodes "public" in
 * foreign key references when no schema is explicitly defined.
 *
 * @param migrationsFolder - Path to the folder containing .sql migration files
 */
export function fixMigrationsSchemaReferences(migrationsFolder: string): void {
  try {
    const files = readdirSync(migrationsFolder).filter((f) =>
      f.endsWith(".sql")
    );

    if (files.length === 0) {
      return;
    }

    let fixedCount = 0;

    for (const file of files) {
      const filePath = path.join(migrationsFolder, file);
      const originalContent = readFileSync(filePath, "utf8");

      // Remove "public". prefix from all table references
      const fixedContent = originalContent.replaceAll('"public".', "");

      if (fixedContent !== originalContent) {
        writeFileSync(filePath, fixedContent);
        fixedCount++;
        rootLogger.debug(`   -> Fixed schema references in ${file}`);
      }
    }

    if (fixedCount > 0) {
      rootLogger.debug(
        `   -> Fixed ${fixedCount} migration file(s) with hardcoded schema references`
      );
    }
  } catch (error) {
    rootLogger.warn(
      `Failed to fix migration schema references: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
