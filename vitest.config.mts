import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // `tsc` emits CommonJS `.js` next to every source file (gitignored, but
    // present after any local `npm run build`), and Vite's default extension
    // order picks `.js` before `.ts`. That silently runs the suite against
    // the last build — where `vi.mock` cannot intercept `require()` — so
    // resolve the TypeScript sources first, matching a fresh CI checkout.
    extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
  },
  test: {
    globals: true,
    environment: 'happy-dom', // For React hooks and browser APIs
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'sdk', 'artifacts'],
  },
})
