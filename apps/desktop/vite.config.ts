import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri 는 고정 포트를 기대한다 — 실패해도 다른 포트로 흘러가지 않게 strictPort.
export default defineConfig({
  plugins: [react()],
  /**
   * WKWebView 실측 하네스를 켜는 스위치. **리터럴로 박아야** 롤업이 `if (false)` 를 접고
   * 그 안의 동적 import 까지 통째로 지운다 — `import.meta.env.VITE_PERF` 로 두면 런타임
   * 조회라 죽은 가지가 남고, 개발용 코드가 릴리스 번들에 실린다.
   */
  define: { __PERF__: JSON.stringify(process.env['VITE_PERF'] === '1') },
  clearScreen: false,
  server: { port: 1420, strictPort: true, watch: { ignored: ['**/src-tauri/**'] } },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // WebView 최소 사양에 맞춘다 (WKWebView / WebView2 / WebKitGTK).
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: true,
  },
});
