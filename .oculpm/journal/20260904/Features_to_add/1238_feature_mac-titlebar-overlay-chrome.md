---
schema_version: 1
type: feature
slug: "mac-titlebar-overlay-chrome"
status: done
difficulty: low
created_at: "2026-09-04T12:38:52+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src-tauri/tauri.conf.json"
    op: update
  - path: "apps/desktop/index.html"
    op: update
  - path: "apps/desktop/src/main.tsx"
    op: update
  - path: "apps/desktop/src/styles/app.css"
    op: update
  - path: "apps/desktop/src/components/session/SessionOverlay.css"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/05-frontend.md"
    op: update
related: []
tags:
  - "ui"
  - "tauri"
  - "macos"
  - "d126"
  - "mcp-tool"
---
[x] 창 제목 표시줄을 숨기고 종이를 창 끝까지 (D126) — 신호등 자리 28px 만 비운다

사용자 요청 3 — 「이 창 디자인을 앱과 융화 되도록」. 스크린샷은 창 위 흰 띠 하나였다.

## 추가 기능

- `tauri.conf.json` 의 창에 `titleBarStyle: "Overlay"` + `hiddenTitle: true`. macOS 전용 값이라 Windows·Linux 는 시스템 표시줄을 그대로 쓴다.
- `main.tsx` 가 macOS 에서만 `<html data-chrome="overlay">` 를 세운다. 첫 그리기 **전**이라 여백이 뒤늦게 생겨 한 프레임이 튀는 일이 없다.
- `styles/app.css` — `--chrome-top`(overlay 28px · 그 외 0px)을 `body` 위 여백으로. `.chrome-drag` 는 그 높이만큼의 `position: fixed` 띠이고 `data-tauri-drag-region` 이라 창을 잡아 끄는 자리다. `index.html` 의 `#root` **밖**에 둔다 — 화면 여섯이 각자 뿌리를 갈아 끼워도 이 띠는 한 자리에 남아야 한다.
- 세션 오버레이 `.proof` 만 `inset` 을 직접 받는다(`position: fixed` 는 body 여백을 못 받는다).

## 동작 흐름

창이 뜬다 → macOS 면 `data-chrome="overlay"` → `body` 가 28px 내려온다 → 신호등은 그 빈 띠 위에 뜨고 종이·책상 색은 창 끝까지 간다 → 그 띠를 끌면 창이 움직인다.

`Transparent` 를 쓰지 않은 이유는 표시줄 자리가 그대로 남기 때문이고, `decorations: false` 를 쓰지 않은 이유는 신호등·리사이즈·전체화면을 우리가 다시 만들어야 하기 때문이다 (D126 근거 열).

## 검증

`pnpm exec stylelint` 초록. 실제 창은 이 세션 마지막에 `tauri dev` 로 띄워 확인한다 — Rust 빌드가 도는 자리라 네 요청을 다 넣은 뒤 한 번만 띄운다.