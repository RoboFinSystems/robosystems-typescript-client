/**
 * Vitest setup file
 * Runs before all tests
 */

import { afterEach, beforeAll, vi } from 'vitest'

// Mock global fetch if it doesn't exist (Node.js environment)
beforeAll(() => {
  if (!global.fetch) {
    global.fetch = vi.fn()
  }
  // Ensure globalThis.fetch is also available (used by SDK client)
  if (!globalThis.fetch) {
    globalThis.fetch = global.fetch
  }
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})
