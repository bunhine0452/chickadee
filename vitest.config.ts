import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'packages/*/src/**/*.test.tsx', 'scripts/**/*.test.mjs', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
