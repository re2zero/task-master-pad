/**
 * Test utilities for MCP server integration tests.
 */

/**
 * Creates a mock logger instance for testing purposes.
 * The logger methods are simple empty functions to suppress output during tests.
 * @returns {object} A mock logger object.
 */
export function mockLog() {
  return {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    log: () => {},
  };
} 