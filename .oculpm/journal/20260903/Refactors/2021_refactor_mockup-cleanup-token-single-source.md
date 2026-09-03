---
schema_version: 1
type: refactor
slug: "mockup-cleanup-token-single-source"
status: done
difficulty: high
created_at: "2026-09-03T20:21:47+09:00"
session_id: "20260903-009"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/src/ink/base.css"
    op: create
  - path: "design/src/ink/ink-home.src.html"
    op: create
  - path: "design/src/ink/build.py"
    op: update
  - path: "design/src/ink/ink-session.src.html"
    op: update
  - path: "design/src/ink/t0.js"
    op: update
  - path: "design/src/ink/t1.js"
    op: update
  - path: "design/src/ink/t2.js"
    op: update
  - path: "design/src/ink/session.css"
    op: update
  - path: "design/src/ink/shared.css"
    op: update
  - path: "design/ink-home.html"
    op: update
  - path: "design/ink-session.html"
    op: update
  - path: "design/README.md"
    op: update
  - path: "scripts/sync-design.mjs"
    op: update
related: []
tags:
  - "design"
  - "tokens"
  - "mockup"
  - "D52"
  - "D11"
  - "D3"
  - "D14"
  - "mcp-tool"
---
[x] 목업 정리 — 토큰 단일 출처를 design/src/ink 로 옮기고 앱과 어긋난 목업 동작 8건 수정

## 동기

05 §12 「토큰 단일 출처 잇기」와 05 구현 체크리스트 마지막 줄(「목업 정리」). 지금까지는
`build.py` 가 `ink-home.html` 에서 토큰 블록을 잘라 세션에 인라인하고, `sync-design.mjs` 는
같은 목업에서 뽑은 값 위에 `OVERRIDES` 표(D52)를 얹었다. 방향을 뒤집는다.

## 변경 요약

**A. 단일 출처 뒤집기**

- `design/src/ink/tokens.css` 신설 = 새 단일 출처(주간/야간 토큰 + `[data-theme="dark"] body`).
  D11 의 넷(`--yellow-text #664300`, `--verdict-*` 신설, 주간 `--glow-t*` transparent,
  `--dee-k/-blue/-blue-deep/-pink` 삭제)과 D56·D95 의 판정 글자·면 색을 이 파일 안으로 옮겼다.
- `design/src/ink/base.css` 신설 = 리셋·조판 강제·종이 결·판 어긋남·Dee 잉크 겹.
- `design/src/ink/ink-home.src.html` 신설 — 홈도 `build.py` 가 굽는다. `build.py` 는
  `@base-css`/`@base-svg` 특수 처리를 버리고 `@include` 하나로 통일했다.
- `sync-design.mjs` 원본을 `design/src/ink/tokens.css` 로 바꾸고 `OVERRIDES = []`.
  표 자체는 남겨 뒀다(D52 의 탈출구) — 다시 쓸 때는 결정 등록부를 먼저 거친다.

**B. 앱과 어긋난 목업 동작 (05 체크리스트 · D3·D8·D11·D14)**

- `t0.js` 다시 찍기 판은 정답이어도 `+1겹` 없음, 문구 「원래 겹으로 돌아옴」 (D3)
- `t0.js` LLM 프롬프트 헤더 `c.file` → base name (D8)
- `t1.js` `total` = 비공백 줄 (20 → 18), 빈 줄은 판정 목록에서도 뺀다 (D14).
  같은 줄의 `T.total`(정의된 적 없음 → NaN)도 `T.res.total` 로 고쳤다.
- `t2.js` 「거의 맞았어요」 문턱 66 → 65
- `blink`(홈 오늘 스탬프) 제거 → 정적 점선 + `.vh` 「오늘」 라벨, `spin 9s` 제거 → 정지한
  점선 링, `peek` `infinite` → `2` (D11). 잠긴 노드 `shake` 는 CSS·키프레임·JS 모두 제거.
- 세션 `.ladder` → `.reprint` (앱 `ReprintLadder.css` 와 같은 이름)
- Google Fonts `<link>` 위에 「목업 전용」 주석 (06 §3.2)

## 검증

- `pnpm design:sync` 뒤 앱 토큰 diff 는 **주석 5줄뿐**(생성물 머리말의 원본 경로 2줄 +
  tokens.ts 1줄 + 판정 별칭 묶음 주석 2줄). 선언·값 변경 0 — `git diff -U0` 에서 주석 아닌
  줄이 하나도 안 나온다. `design:check` 통과, `check-contrast` **48쌍** 그대로 통과,
  `check-motion` 위반 0, `stylelint` 통과.
- 드리프트 게이트 확인: 단일 출처의 `--rule` 을 한 글자 바꾸니 `--check` 가 exit 1.
- 오버라이드를 얹기 전에 먼저 구운 `ink-home.html` 이 **바이트 단위로 동일**함을 확인한 뒤
  값을 옮겼다(세션은 빈 줄 2개 차이). Chromium 주행: 홈·세션 콘솔 오류 0, 무한 애니메이션 0,
  잠긴 노드 클릭 시 `.shake` 0 · 상세만 열림, T1 채점 「18분의 16」, 다시 찍기 판 정답 시
  「잉크 2겹 · 원래 겹으로 돌아옴」이고 `railPlus` 는 비어 있음.