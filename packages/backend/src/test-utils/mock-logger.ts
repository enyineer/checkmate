import { mock } from "bun:test";

/**
 * Creates a mock logger instance suitable for unit testing.
 * This mock provides all standard logger methods (info, debug, warn, error)
 * and a child() method that returns another mock logger.
 *
 * @returns A mock logger object
 *
 * @example
 * ```typescript
 * const mockLogger = createMockLogger();
 * myService.setLogger(mockLogger);
 * ```
 */
export function createMockLogger() {
  return {
    info: mock(),
    debug: mock(),
    warn: mock(),
    error: mock(),
    child: mock(() => createMockLogger()),
  };
}

/**
 * Creates a mock logger module export suitable for use with Bun's mock.module().
 *
 * @returns An object with rootLogger property
 *
 * @example
 * ```typescript
 * mock.module("./logger", () => createMockLoggerModule());
 * ```
 */
export function createMockLoggerModule() {
  return {
    rootLogger: createMockLogger(),
  };
}
