/**
 * 브라우저 게이트·시각 회귀·mockIPC E2E (06 §1.1·§1.7·§2 · 05 §11).
 *
 * 실 바이너리 E2E(E1~E8)는 여기가 아니다 — `tauri-driver` + WebdriverIO 로 Linux 에서만
 * 돌고(06 §1.5) 설정은 `tests/e2e/wdio.conf.ts` 에 있다.
 *
 * 엔진 둘: `chromium`(WebView2 대리) · `webkit`(WKWebView 대리). 05 §11 이 정한 짝이다.
 * 재시도는 0 — 06 §1.9-3 이 「재시도는 결정론적 층의 버그를 숨긴다」고 정했다.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests',
  // 하네스 자체는 테스트가 아니다.
  testIgnore: ['support/**', 'e2e/**'],
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  // `exactOptionalPropertyTypes` 라 `undefined` 를 넘길 수 없다 — 기본값(코어 수의 절반)을
  // 숫자로 적는다.
  workers: process.env['CI'] ? 2 : 4,
  reporter: process.env['CI'] ? [['github'], ['list']] : [['list']],
  timeout: 30_000,
  expect: {
    // 06 §1.7 — 폰트가 번들이라 CDN 지연 흔들림이 없다.
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, threshold: 0.2, animations: 'disabled' },
  },
  snapshotPathTemplate: 'tests/visual/__screenshots__/linux/{projectName}/{arg}{ext}',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // 최소 창 720×600 (D182 — 반쪽화면이 깨지면 안 된다). 폭 게이트가 720~2560 을 훑는다.
    viewport: { width: 1360, height: 860 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    // `--host 127.0.0.1` 이 필요하다 — 기본값 `localhost` 는 이 기계에서 ::1 로만 열려
    // `baseURL` 의 127.0.0.1 이 붙지 못한다(연결 자체가 안 된다).
    command: `pnpm --filter @chickadee/desktop exec vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
