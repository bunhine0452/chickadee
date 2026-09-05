---
schema_version: 1
type: feature
slug: "macos-icon-rounded-tile"
status: done
difficulty: low
created_at: "2026-09-04T13:30:17+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/logo/chickadee-logo-macos.svg"
    op: create
  - path: "design/logo/chickadee-logo-macos-16.svg"
    op: create
  - path: "design/logo/export.cjs"
    op: update
  - path: "design/logo/README.md"
    op: update
  - path: "apps/desktop/src-tauri/icons/icon.icns"
    op: update
  - path: "apps/desktop/src-tauri/icons/icon.png"
    op: update
  - path: "apps/desktop/src-tauri/icons/128x128.png"
    op: update
  - path: "apps/desktop/src-tauri/icons/128x128@2x.png"
    op: update
  - path: "apps/desktop/src-tauri/icons/64x64.png"
    op: update
  - path: "apps/desktop/src-tauri/icons/32x32.png"
    op: update
  - path: "docs/00-overview.md"
    op: update
related: []
tags:
  - "design"
  - "icon"
  - "macos"
  - "d135"
  - "mcp-tool"
---
[x] 앱 아이콘을 애플 아이콘 격자의 둥근 사각형으로 (D135) — 그림은 그대로, 담는 모양만

사용자 요청 — Dock 스크린샷과 함께 「내 앱의 모양 고쳐줘 · 둥근 사각형 형식으로」. 옆의 세 앱은 둥근 타일인데 이 앱만 각진 정사각이었다.

## 추가 기능

**바뀐 것은 담는 모양뿐이다.** 링·새·색·비율은 원본(`chickadee-logo-no-background.svg`)의 좌표 그대로이고, 원본의 크림 **정사각**이 같은 크림의 **타일**이 되었다 — 애플 아이콘 격자: 1024 캔버스 · 824 타일 · 반지름 22.5% 의 이어지는(continuous) 모서리 · 둘레 100px 투명.

- `chickadee-logo-macos.svg` — 32px 이상. 타일 경로는 초타원(n=5)의 사분면 넷을 직선 변으로 이어 만든다(점 260개). 평범한 `rx` 둥근 사각형이 아니라 모서리 곡률이 이어지는 모양이라 Dock 에서 옆 아이콘들과 같은 실루엣이 된다.
- `chickadee-logo-macos-16.svg` — icns 의 16px 슬롯 전용. 타일은 같고 안에 든 것만 파비콘과 같은 **머리 크롭**이다. 이미 있던 규칙을 따랐다(README 「16px 판정」): 전신 배지는 16px 에서 3단 열 1개로 불합격, 머리 크롭은 4열 합격 — 새로 재 보니 타일 전신 0열, 타일 머리 크롭 4열이었다.
- 그림자는 넣지 않았다. 애플 템플릿에는 있지만 이 앱의 그림자는 전부 하드 오프셋(리소그래프)이라 흐린 그림자를 섞으면 언어가 둘이 된다.

Windows 의 `icon.ico` 와 `Square*Logo.png` 는 **건드리지 않았다** — 그 타일은 시스템이 배경을 깔아 주는 자리라 여백을 넣으면 그림만 작아진다.

## 동작 흐름

`node design/logo/export.cjs` 한 줄이 전부다. Playwright 로 SVG 를 굽고, macOS 에서는 `iconutil` 로 icns 열 장(16~512 와 @2x)까지 만든 뒤 `apps/desktop/src-tauri/icons/` 의 `icon.icns`·`icon.png`·`128x128*`·`64x64`·`128x128`·`32x32` 를 덮어쓴다. 다른 OS 에서는 PNG 만 굽고 커밋된 icns 를 그대로 둔다.

## 검증

- 128·256px 렌더를 눈으로 확인 — 둥근 타일 안에 배지, 둘레는 투명.
- `iconutil -c iconset` 로 되풀어 열 장(16~1024)이 다 들어갔는지 확인.
- 대조 시트의 16px 3단 판정을 다시 돌려 타일 머리 크롭 `4열/4px/합격`.
- **돌고 있는 앱 바이너리에 새 icns 가 박혀 있는지 바이트로 대조** — `target/debug/chickadee-app`(13:28:28 재시작)에 새 icns 있음, 예전 것 없음. 즉 지금 Dock 에 뜬 것이 새 아이콘이다.
- `pnpm lint` 초록.

## 메모

Dock 이 예전 그림을 캐시로 들고 있으면 `killall Dock` 이면 지워진다 — 사용자 바탕화면을 건드리는 명령이라 여기서 돌리지 않았다.