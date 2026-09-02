import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri 는 고정 포트를 기대한다 — 실패해도 다른 포트로 흘러가지 않게 strictPort.
export default defineConfig({
  plugins: [react()],
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
