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
      // 브라우저 게이트의 시드를 굽는 것도 여기서 돈다 (D108).
      'tests/support/**/*.test.ts',
      'scripts/**/*.test.ts',
    ],
    environment: 'node',
  },
});
