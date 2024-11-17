import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      include: ['src/releases.ts'],
      reporter: ['text'],
    },
  },
})
