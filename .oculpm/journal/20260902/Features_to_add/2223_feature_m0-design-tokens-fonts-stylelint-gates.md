---
schema_version: 1
type: feature
slug: "m0-design-tokens-fonts-stylelint-gates"
status: done
difficulty: high
created_at: "2026-09-02T22:23:43+09:00"
session_id: "20260902-004"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "scripts/sync-design.mjs"
    op: create
  - path: "scripts/check-contrast.mjs"
    op: create
  - path: "scripts/stylelint-chickadee.mjs"
    op: create
  - path: "scripts/stylelint-chickadee.test.mjs"
    op: create
  - path: "stylelint.config.js"
    op: create
  - path: "apps/desktop/src/styles/reset.css"
    op: create
  - path: "apps/desktop/src/styles/physics.css"
    op: create
  - path: "apps/desktop/src/styles/fonts.css"
    op: create
  - path: "apps/desktop/src/assets/fonts/OFL-Plex.txt"
    op: create
  - path: "apps/desktop/src/assets/fonts/OFL-BlackHanSans.txt"
    op: create
  - path: "apps/desktop/index.html"
    op: update
related: []
tags:
  - "m0"
  - "design-tokens"
  - "fonts"
  - "stylelint"
  - "contrast"
  - "a11y"
  - "mcp-tool"
---
[x] M0 · 디자인 토큰·폰트 동봉·게이트 4종 — 가독성 규칙을 린트로 잠갔다

## 추가 기능

- `scripts/sync-design.mjs` — 목업 `design/ink-home.html` 의 `:root`·`[data-theme="dark"]` 블록을 뽑아 앱의 토큰 CSS·TS 맵을 만든다. `--check` 는 바이트 단위 드리프트 게이트. `design/` 은 읽기만 한다(사용자 확정 디자인).
- `scripts/check-contrast.mjs` — 종이 위 텍스트 40쌍 ≥ 7:1, 잉크 배지 위 6쌍 ≥ 4.5:1. `var()` 별칭을 풀고, 예외 목록은 **만료일 필수**(06 §2 — 만료 없는 예외는 6개월 뒤 규칙 자체를 무력화한다).
- Stylelint 커스텀 룰 4개 — 13px 하한 · 트랙 별칭만 · 다크 선택자 allowlist(6 컴포넌트) · 인쇄 물리 범위(본문 단 밖에만).
- 폰트 9벌 동봉 + OFL 전문 2개, `index.html` 에 preload 4개.

## 동작 흐름

**토큰 오버라이드 표(D52).** D11 이 정한 네 가지(`--yellow-text #664300` · `--verdict-*` 신설 · 주간 `--glow-t*` `transparent` · `--dee-k/-blue/-blue-deep/-pink` 삭제)가 아직 목업에 없다 — 「05 · 목업 정리」는 뒤 마일스톤이다. 표가 없으면 `--check` 가 영구히 빨갛거나, 목업을 지금 고쳐 D11 의 순서를 깬다. 그래서 선언된 `OVERRIDES` 상수를 얹고 매 실행마다 적용 내역을 찍는다. `set` 은 목업이 아직 옛 값인지 **단언**하므로, 목업 정리가 끝나면 스크립트가 「이 행을 지워라」라고 알려 준다.

**Black Han Sans 는 상류에 woff2 가 없다(→ D55).** `google/fonts/ofl/blackhansans` 도 `zesstype/Black-Han-Sans` 도 TTF 만 준다. gstatic 이 주는 woff2 는 한국어 **서브셋**이라 05 §1.4 가 금지한다. TTF 를 `ttf2woff2` 로 **컨테이너만** 바꿨다 — 글리프 2,734개 불변, `name` 테이블 불변(RFN 유효), `DSIG` 만 빠진다(WOFF2 규격이 요구). 서브셋이 아니므로 OFL 위반이 아니다. 9파일 합계는 문서가 추정한 ≈8 MB 가 아니라 **2.0 MB**.

## 검증

- `node scripts/sync-design.mjs --check` → 통과(생성물 3개가 목업과 바이트 단위 일치).
- `node scripts/check-contrast.mjs` → 46쌍 통과. **D11 확인: `--yellow-text(#664300)` on `--paper-3(#EFE7D4)` = 7.20:1** — 05 §9 이 실패로 지목한 6.82 가 해소됐다. 가장 빠듯한 쌍은 `--pink-text on --paper-3` 7.04:1.
- `npx vitest run scripts/stylelint-chickadee.test.mjs` → 21 passed(룰마다 터지는 케이스와 통과하는 케이스 한 쌍씩).
- `npx stylelint "apps/desktop/src/styles/*.css"` → 0 problems.
- 폰트 9개 전부 `wOF2` 매직 확인.