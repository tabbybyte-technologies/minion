/**
 * Cross-runtime test utilities
 * Provides unified test interface for both Bun and Node.js
 */

// Detect if we're running in Bun or Node.js
const isBun = typeof globalThis.Bun !== 'undefined';

let testFramework;

if (isBun) {
  // Use Bun's test framework
  const bunTest = await import('bun:test');
  testFramework = {
    test: bunTest.test,
    expect: bunTest.expect,
    describe: bunTest.describe || ((name, fn) => fn()),
    beforeEach: bunTest.beforeEach || (() => {}),
    afterEach: bunTest.afterEach || (() => {})
  };
} else {
  // Use Node.js built-in test (Node 18+) with basic assertion
  const nodeTest = await import('node:test');
  const assert = await import('node:assert');
  
  testFramework = {
    test: nodeTest.test,
    expect: (actual) => ({
      toBe: (expected) => assert.strictEqual(actual, expected),
      toEqual: (expected) => assert.deepStrictEqual(actual, expected),
      toThrow: (expectedError) => {
        // For testing functions that should throw
        if (typeof actual === 'function') {
          assert.throws(actual, expectedError);
        } else {
          assert.fail('Expected function to throw');
        }
      },
      toBeTruthy: () => assert.ok(actual),
      toBeFalsy: () => assert.ok(!actual),
      toContain: (item) => {
        if (Array.isArray(actual)) {
          assert.ok(actual.includes(item));
        } else if (typeof actual === 'string') {
          assert.ok(actual.includes(item));
        } else {
          assert.fail('Expected array or string');
        }
      }
    }),
    describe: (name, fn) => fn(),
    beforeEach: () => {},
    afterEach: () => {}
  };
}

export const { test, expect, describe, beforeEach, afterEach } = testFramework;
export const runtime = isBun ? 'bun' : 'node';
