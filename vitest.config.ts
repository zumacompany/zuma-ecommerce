const path = require('node:path')
const { defineConfig } = require('vitest/config')

module.exports = defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      'server-only': path.resolve(__dirname, 'tests/support/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['components/**/*.test.tsx', 'jsdom'],
    ],
    globals: true,
    include: [
      'src/**/*.test.ts',
      'lib/**/*.test.ts',
      'components/**/*.test.tsx',
    ],
  },
})
