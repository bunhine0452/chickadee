import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/tokens.css';
import './styles/reset.css';
import './styles/fonts.css';
import './styles/physics.css';
import './styles/app.css';

import { App } from './App.js';
import { boot } from './boot.js';
import { installAudit } from './devtools/audit.js';

const el = document.getElementById('root');
if (!el) throw new Error('#root 이 없다');

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// `?dev=1` 에서만 계측 손잡이를 붙인다 (05 §10).
installAudit(window.location.search);

void boot().then(async () => {
  // WKWebView 실측 하네스. `VITE_PERF=1` 로 빌드했을 때만 들어간다 — 평소 번들에는
  // 이 분기 자체가 없다(Vite 가 상수 접기로 지운다).
  if (__PERF__) {
    const { runPerf } = await import('./devtools/perfRun.js');
    await runPerf(import.meta.env['VITE_PERF_REPO'] ?? '');
  }
});
