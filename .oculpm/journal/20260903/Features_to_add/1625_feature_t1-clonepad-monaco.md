---
schema_version: 1
type: feature
slug: "t1-clonepad-monaco"
status: done
difficulty: high
created_at: "2026-09-03T16:25:19+09:00"
session_id: "20260903-008"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/t1/ClonePad.tsx"
    op: create
  - path: "apps/desktop/src/components/t1/PlainPad.tsx"
    op: create
  - path: "apps/desktop/src/components/t1/ClonePad.css"
    op: create
  - path: "apps/desktop/src/components/t1/ClonePad.test.tsx"
    op: create
  - path: "apps/desktop/src/components/t1/monacoOptions.ts"
    op: create
  - path: "apps/desktop/src/components/t1/monacoTheme.ts"
    op: create
related: []
tags:
  - "t1"
  - "monaco"
  - "frontend"
  - "m3"
  - "mcp-tool"
---
[x] T1 ClonePad — Monaco 에디터, 거터 틱·IME 보류·백틱 홀드·textarea 되돌림 스위치

## 추가 기능

`m3-05-clonepad` 의 에디터 부분. 05 §8 을 그대로 옮겼다.

- `monacoOptions.ts` — §8 「옵션 고정」 목록 전량. `optionsFor(stage)` 가 단계별 `autoIndent`
  (1·2단계 `brackets`, 3단계 `none`)만 갈아 끼운다.
- `monacoTheme.ts` — `ink-light`/`ink-dark`. Monaco 는 CSS 변수를 못 받으므로
  `styles/tokens.ts` 의 hex 를 읽고 `var(--x)` 별칭은 한 단계씩 푼다.
- `ClonePad.tsx` — Monaco 판. `editor.worker?worker` 하나만 싣고 `ts.worker` 는 싣지 않는다.
  basic-languages 는 typescript·javascript·python·go·rust·sql 여섯.
- `PlainPad.tsx` — 되돌림 스위치의 textarea 판(목업 `t1.js` 이식). `ClonePad.tsx` 가 461줄이
  되어 400줄 상한에 걸려 나눴다.

## 동작 흐름

- 줄 이탈 판정: `onDidChangeCursorPosition` 에서 줄 번호가 바뀔 때만
  `onLeaveLine(줄-1, 내용)`. `CursorChangeReason.ContentFlush` 는 기준 줄만 옮기고 판정하지
  않는다.
- IME 보류: `onDidCompositionStart`~`End` 사이의 이탈은 첫 줄만 담아 두고, 조합이 끝나면 한
  번 판정한다. 조합 중인 글자는 아직 그 줄의 내용이 아니라서 지금 판정하면 「어긋남」이 먼저
  찍히고 조합이 끝나며 뒤집힌다.
- 백틱 홀드: `e.browserEvent.code === 'Backquote'` → `preventDefault`, `!repeat` 이면
  `onPeek(true)`. keyup·에디터 블러·`window` 의 `blur` 에서 놓는다.
- 거터 틱: `createDecorationsCollection()` 하나로 `linesDecorations` 자리(14px)에 그린다.
  Monaco 가 `style="width:14px"` 를 인라인으로 박아 클래스의 `width:3px` 이 죽으므로 3px 폭은
  `box-shadow: inset 3px 0 0` 이 낸다. `linesDecorations.css` 의 `background:white`
  하드코딩도 덮었다 — 안 덮으면 야간반 거터에 흰 띠가 남는다.
- 자동 저장 400ms 디바운스, 블러·언마운트에서 즉시 flush.
- 마운트 직후와 `document.fonts.ready` 뒤 `remeasureFonts()`.
- `measureSince('t1:monaco', …)` 를 에디터를 짓고 붙인 직후에 찍는다(예산 250ms).

## 05 §8 과 어긋난 자리

- **`automaticLayout` 없음.** 고정 목록에 없는 옵션이라 넣지 않고, 폭은 `ResizeObserver`,
  높이는 `onDidContentSizeChange` 로 잰다(`scrollBeyondLastLine:false` 전제, 최소 20줄).
- **테마 색 2개 추가.** `editor.lineHighlightBackground`·`editorLineNumber.activeForeground`.
  `renderLineHighlight:'gutter'` 를 켜 놓고 색을 안 주면 Monaco 기본 회청이 거터에 깔린다.
  값은 목업 `.gl.cur{color:var(--ink); background:var(--paper-2)}` 그대로.
- **`.gl-tick{width:3px}` 은 쓰지 않았다.** 위의 인라인 width 때문에 죽는 선언이다.

## 검증

`pnpm vitest run apps/desktop/src/components/t1` 9파일 85테스트 통과(ClonePad 33개 신규).
`typecheck` 는 `components/t1` 0건(남은 1건은 다른 세션의 `src/data/t1.test.ts`), eslint·
stylelint 0건. `pnpm --filter @chickadee/desktop build` 에서 Monaco 가 별도 청크로 갈라졌다 —
`ClonePad-*.js` 2,295 kB / gzip 594 kB (§1.3 예산 1.2 MB 안), 앱 JS gzip 278 kB (예산 350 KB).