---
schema_version: 1
type: feature
slug: "m0-dee-sprite-and-12-primitives"
status: done
difficulty: high
created_at: "2026-09-02T22:25:53+09:00"
session_id: "20260902-004"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/ui/src/dee/DeeSprite.tsx"
    op: create
  - path: "packages/ui/src/dee/Dee.tsx"
    op: create
  - path: "packages/ui/src/dee/useDeeMotion.ts"
    op: create
  - path: "packages/ui/src/dee/deePlates.ts"
    op: create
  - path: "packages/ui/src/RichText.tsx"
    op: create
  - path: "packages/ui/src/announce.ts"
    op: create
  - path: "packages/ui/src/PressButton.tsx"
    op: create
  - path: "packages/ui/src/Switch.tsx"
    op: create
  - path: "packages/ui/src/Stamp.tsx"
    op: create
  - path: "packages/ui/src/Reg.tsx"
    op: create
  - path: "packages/ui/src/dev/Gallery.tsx"
    op: create
  - path: "packages/ui/src/index.ts"
    op: create
  - path: "scripts/sync-design.mjs"
    op: update
  - path: "docs/05-frontend.md"
    op: update
related: []
tags:
  - "m0"
  - "ui"
  - "react"
  - "mascot"
  - "a11y"
  - "design-system"
  - "mcp-tool"
---
[x] M0 · 마스코트 Dee 와 프리미티브 12종 — 목업 클래스명을 그대로 들고 왔다

## 추가 기능

- `Dee`·`DeeSprite`·`useDeeMotion` — 심볼 3종(`#dee`·`#deeBird`·`#deeHead`) + 로고. 잉크 겹 0~4 는 `data-ly` 로만 바뀐다.
- 프리미티브 12종: Pill · Passes · Kbd · PressButton · FlatButton · Switch · Reg · Stamp · Say · Toast · LiveRegion · Misreg. 컴포넌트당 `.tsx` + `.css` + 테스트 한 벌, **클래스명은 목업 그대로**(05 §1.1 이 CSS Modules 를 버린 이유가 이것이다 — 해시가 `__audit`·Playwright 셀렉터를 깬다).
- `RichText` — DOMPurify, 허용 태그 `code b i em br kbd` 6개·속성 0.
- `dev/Gallery.tsx` — `import.meta.env.DEV` 가드 + `index.ts` 미노출이라 프로덕션 번들이 모듈을 끌지 않는다.

## 동작 흐름

**DeeSprite 는 `dangerouslySetInnerHTML` 을 쓰지 않는다.** D42 가 허용한 두 번째 파일은 `apps/desktop/src/components/dee/DeeSprite.tsx`(06 §4.3)이고 이 파일은 그 경로가 아니다. 목업 마크업이 `path` 6 · `polygon` 2 · 패턴 2 · clipPath 1 · symbol 4 라 JSX 트리로 충분했다 — 경로 데이터가 목업과 바이트 단위로 같은지 확인했다. 심볼은 여전히 문서에 인라인되므로 05 §6 의 근거(외부 `<use href>` 는 WKWebView 에서 CSS 변수 상속이 끊긴다)도 지켜진다.

**판정 색에 글자 짝이 없었다(→ D56).** D11 의 `--verdict-*` 는 면 색인데 `.stamp` 의 글자는 종이 위 7:1 이 필요하다. 처음엔 `packages/ui` 안에 토큰 shim 이 생겼지만, 그러면 같은 토큰이 두 곳에 산다 — `packages/ui` 는 이미 `--t0`·`--ink`·`--fs-13` 등 40여 개를 앱 `tokens.css` 에서 받아 쓰므로 6개만 지역 정의하는 것이 앞뒤가 안 맞는다. `--verdict-*-text` 3개를 `sync-design.mjs` 의 `OVERRIDES` 에 넣어 앱 `tokens.css` 가 6개 전부를 소유하게 하고 shim 을 지웠다.

원색 토큰은 전부 별칭으로 바꿨다(05 §4.2) — `PressButton` `--pink`→`--t1`, `Switch` `--yellow`→`--t2`, `Stamp` `--pink-text`→`--verdict-exact-text` 등. D11 의 애니메이션 유한화도 반영(`peek` `infinite`→`2`).

05 §4.2 가 지목한 13px 미만 위반 2건(`.map .nd .dir` 12.5px · `.newtag` 12px)은 **이 범위에 없다** — 둘 다 `DependencyMap`(T2, 뒤 마일스톤) 것이다. T2 작업 때 올려야 한다.

## 검증

- `npx vitest run packages/ui` → 67 passed / 18 files. `data-ly` 노드 동일성(0→4 재렌더 뒤 `use` 노드가 **같은 객체**), 감축 모션(전환만 없애고 최종 포즈 유지), 타이핑 중 모션 0, 모션 상한 720ms(LIFER 1360ms 만 예외), `announce()` ≤60자·태그 없음·마침표, `RichText` 가 06 §4.2 의 악성 입력 4종에서 `<script`·`on\w+=` 를 남기지 않음, `Passes` 의 `label` 누락이 실제 타입 오류임(`@ts-expect-error` 로 고정).
- `npx tsc --noEmit -p packages/ui/tsconfig.json` 통과.
- `npx stylelint "packages/ui/**/*.css"` 통과(커스텀 4룰 포함), `npx eslint packages/ui` 통과.
- 13px 미만 리터럴 0건, 원색 토큰 직접 참조 0건(grep).
- shim 제거 뒤 `node scripts/sync-design.mjs --check`·`check-contrast` 재실행 → 46쌍 통과.