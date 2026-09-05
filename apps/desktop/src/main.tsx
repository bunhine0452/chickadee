import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/tokens.css';
import './styles/reset.css';
import './styles/fonts.css';
// 배치 층 (D182). 리셋 뒤·화면 CSS 앞이다 — 뼈대는 화면이 언제든 덮을 수 있어야 한다.
import './styles/layout.css';
import './styles/app.css';

import { App } from './App.js';
import { boot } from './boot.js';
import { installAudit } from './devtools/audit.js';

// 제목 표시줄이 없는 창은 macOS 뿐이다 (D126 · `tauri.conf.json` 의 `titleBarStyle`).
// 신호등이 지나는 자리를 비우는 것은 CSS 가 하고, 여기서는 그 스위치만 켠다 — 첫 그리기
// 전에 세워야 여백이 생기며 한 프레임이 튀지 않는다.
if (navigator.userAgent.includes('Macintosh')) {
  document.documentElement.dataset['chrome'] = 'overlay';
}

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
