#!/usr/bin/env bun
/**
 * Custom typecheck script that runs TypeScript checks on all packages
 * with limited concurrency to avoid OOM issues on CI runners.
 *
 * Uses batched execution (4 packages at a time) instead of running
 * all 80+ packages in parallel.
 */

import { $, Glob } from "bun";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const CONCURRENCY = 4;

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
}

async function discoverPackages(): Promise<string[]> {
  const rootPackageJson = JSON.parse(
    readFileSync(path.join(process.cwd(), "package.json"), "utf8")
  ) as PackageJson & { workspaces?: string[] };

  const workspacePatterns = rootPackageJson.workspaces ?? [];
  const packagePaths: string[] = [];

  for (const pattern of workspacePatterns) {
    const glob = new Glob(pattern);
    for await (const match of glob.scan({
      cwd: process.cwd(),
      onlyFiles: false,
    })) {
      const pkgJsonPath = path.join(process.cwd(), match, "package.json");
      if (existsSync(pkgJsonPath)) {
        try {
          const pkgJson = JSON.parse(
            readFileSync(pkgJsonPath, "utf8")
          ) as PackageJson;
          // Only include packages that have a typecheck script
          if (pkgJson.scripts?.typecheck) {
            packagePaths.push(match);
          }
        } catch {
          // Skip invalid package.json files
        }
      }
    }
  }

  return packagePaths;
}

async function runTypecheck(
  packagePath: string
): Promise<{ path: string; success: boolean; errors: string[] }> {
  const result = await $`bun run --cwd ${packagePath} typecheck 2>&1`
    .nothrow()
    .quiet();
  const output = result.stdout.toString();
  const lines = output.split("\n");

  const errorLines = lines.filter((line) => {
    if (line.includes("error TS")) return true;
    if (/\(\d+,\d+\):\s*error/.test(line)) return true;
    return false;
  });

  return {
    path: packagePath,
    success: result.exitCode === 0 && errorLines.length === 0,
    errors: errorLines,
  };
}

async function main() {
  console.log("Running typecheck across all packages...\n");

  const packages = await discoverPackages();
  const total = packages.length;
  console.log(`Found ${total} packages with typecheck scripts.\n`);

  type TypecheckResult = { path: string; success: boolean; errors: string[] };
  const allResults: TypecheckResult[] = [];
  let checked = 0;

  for (let i = 0; i < packages.length; i += CONCURRENCY) {
    const batch = packages.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((pkg) => runTypecheck(pkg))
    );

    // Print results for this batch
    for (const result of batchResults) {
      checked++;
      const status = result.success ? "✓" : "✗";
      const counter = `[${String(checked).padStart(
        String(total).length
      )}/${total}]`;
      console.log(`${counter} ${status} ${result.path}`);
    }

    allResults.push(...batchResults);
  }

  const failures = allResults.filter((r) => !r.success);

  if (failures.length > 0) {
    console.log("\n\nTypeScript errors found:\n");
    for (const failure of failures) {
      console.log(`\n--- ${failure.path} ---`);
      console.log(failure.errors.join("\n"));
    }
    const totalErrors = failures.reduce((sum, f) => sum + f.errors.length, 0);
    console.log(
      `\n\n${totalErrors} error(s) found in ${failures.length} package(s).`
    );
    process.exit(1);
  }

  console.log(`\n✓ All ${total} packages passed typecheck.`);
  process.exit(0);
}

await main();
