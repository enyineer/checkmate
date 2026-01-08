/**
 * Test Preload File
 *
 * This file is loaded BEFORE any test file runs (via bunfig.toml).
 * It ensures that mock.module() is called before the mocked modules
 * are ever imported, preventing side effects like DATABASE_URL checks.
 *
 * The preload uses absolute paths to ensure mocks are applied globally,
 * regardless of which file imports the modules.
 */

import { mock } from "bun:test";
import {
  createMockDbModule,
  createMockLoggerModule,
} from "@checkmate-monitor/test-utils-backend";
import path from "node:path";

// Get absolute paths to the modules we need to mock
const backendSrcDir = path.join(__dirname);
const dbPath = path.join(backendSrcDir, "db");
const loggerPath = path.join(backendSrcDir, "logger");

// Mock database module with absolute path - prevents DATABASE_URL check from throwing
mock.module(dbPath, () => createMockDbModule());

// Mock logger module with absolute path - prevents any logging side effects
mock.module(loggerPath, () => createMockLoggerModule());
