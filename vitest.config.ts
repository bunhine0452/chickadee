import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/*/src/**/*.test.ts',
      'packages/*/src/**/*.test.tsx',
      // 화면 컴포넌트는 apps/desktop 에 산다 (05 §5 디렉터리).
      'apps/*/src/**/*.test.ts',
      'apps/*/src/**/*.test.tsx',
      'scripts/**/*.test.mjs',
      'scripts/**/*.test.ts',
    ],
    environment: 'node',
  },
});
