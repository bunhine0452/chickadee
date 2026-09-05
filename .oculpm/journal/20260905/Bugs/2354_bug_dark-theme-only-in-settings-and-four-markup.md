---
schema_version: 1
type: bug
slug: "dark-theme-only-in-settings-and-four-markup"
status: done
difficulty: medium
created_at: "2026-09-05T23:54:30+09:00"
session_id: "20260905-003"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "acp-20260905-d4ae2987"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/index.html"
    op: update
  - path: "apps/desktop/src/boot.ts"
    op: update
  - path: "apps/desktop/src/data/settings.ts"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/clone/CloneScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/clone/CloneScreen.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/CourseScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/OrderPlate.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/ReimplPlate.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/StageOverlay.tsx"
    op: update
  - path: "packages/i18n/src/ko/course.ts"
    op: update
  - path: "packages/i18n/src/en/course.ts"
    op: update
  - path: "tests/gates/journey.spec.ts"
    op: update
  - path: "docs/ux-audit.md"
    op: update
related:
  - ref: "20260905/Features_to_add/2331_feature_ux-journey-audit-and-gates-d186.md"
    kind: "followup"
tags:
  - "ux"
  - "theme"
  - "d187"
  - "regression"
  - "s2-handoff"
  - "mcp-tool"
---
[x] 어둡게가 설정 화면에서만 걸렸다 — 부팅이 밝기를 세우게 고치고 S2 가 넘긴 마크업 넷을 함께

## 발생 원인

S2 가 스크린샷 144장을 찍어 **어둡게 23화면이 밝게와 바이트까지 같다**고 넘겼다.

`<html data-theme>` 을 세우는 코드가 `useAppearance()` 훅 하나뿐이었다. D187 ⑫ 로 헤더의
밝기 스위치를 빼면서 `Topbar` 가 그 훅을 놓았고, 남은 소비자가 **설정 화면 하나**가 됐다 —
설정에 들어갔다 나오기 전에는 홈도 세션도 코스도 아무도 속성을 안 세운다.

더해 `index.html` 이 `data-theme="light"` 를 못박고 있었다. S2 가 세운 CSS 의 시스템 따름
규칙이 `:root:not([data-theme="light"])` 이라, 그 못박기가 매체 질의 쪽 길까지 막았다.

같은 뿌리에서 Monaco 도 어긋났다 — 세 화면이 테마를 `settings.theme` 에서 읽는데 그 열은
**마지막으로 고른 것의 기록**이라, 「시스템 따름」인 채 한 번도 안 고른 사람에게는 기본
`light` 가 들어 있다. 판은 CSS 를 따라 검고 편집기만 밝은(또는 그 반대) 화면이 났다.

## 해결 방법

- `data/settings.ts` — 고른 값(`themeMode`)을 **모듈이 들고**, `applyTheme` 이 바뀔 때마다
  구독자에게 알린다. `startTheme()` 이 저장값을 읽어 세우고 「시스템 따름」인 동안만
  `prefers-color-scheme` 을 듣는다(리스너는 한 번만 달고 그 자리에서 모드를 다시 읽는다 —
  설정에서 고정으로 바꾸면 그 뒤로는 안 따라간다). `useResolvedTheme()` 은 속성에서 읽는다.
- `boot.ts` — 창을 보이기 전에 `startTheme()`. `index.html` 의 `data-theme="light"` 삭제.
- `SessionScreen`·`CloneScreen`·`CourseScreen` — Monaco 테마를 `useResolvedTheme()` 로.
- `OrderPlate` — 판 머리가 조각 **id** 를 파일 경로 자리에 넣어 「내 코드 a」였다. 보이는
  글자(`t`)로 가른다: 홉 재료면 `파일:줄`, 0부 사다리면 「사전 예제」.
- `ReimplPlate` — `Ask` 곁말과 `<dt>` 가 같은 키라 「시그니처」가 30px 사이로 두 번 떴다.
  곁말을 「무엇을 하라」로 바꿨다(`chapter.reimplAsk`).
- `StageOverlay` — 「값 추적 판을 굽지 못했습니다」가 `.bench` 직계 자식이라 판 위에 가운데
  정렬로 따로 떴다. `PlateFrame` 의 `after` 로 판 안에 넣었다.

## 검증

`pnpm shots` 재주행 — 밝게·어둡게 **72쌍 전부 바이트가 다르다**(전: 23쌍 동일).
회귀는 게이트 둘로 잠갔다(`journey.spec.ts` — 시스템이 어두우면 홈도 어둡다 · 설정에서
고르면 시스템이 바뀌어도 안 따라간다, ×2엔진).
`typecheck` 무출력 · `lint` 무출력 · `vitest` 전체 **2582 통과** ·
`playwright tests/gates` **206 통과 10 건너뜀** · `tests/e2e-ui` **26 통과**.