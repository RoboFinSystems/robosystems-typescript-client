import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom', // For React hooks and browser APIs
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'sdk/**', // Generated SDK
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        'scripts/**',
        'bin/**',
        'prepare.js',
      ],
    },
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'sdk'],
  },
})
