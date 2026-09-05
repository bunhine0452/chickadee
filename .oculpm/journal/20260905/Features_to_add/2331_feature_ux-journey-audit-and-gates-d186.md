---
schema_version: 1
type: feature
slug: "ux-journey-audit-and-gates-d186"
status: done
difficulty: high
created_at: "2026-09-05T23:31:02+09:00"
session_id: "20260905-003"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "acp-20260905-d4ae2987"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/ux-audit.md"
    op: update
  - path: "apps/desktop/src/App.tsx"
    op: update
  - path: "apps/desktop/src/components/home/Topbar.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/CoachBand.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/FeedbackSlot.tsx"
    op: update
  - path: "apps/desktop/src/components/shell/Page.tsx"
    op: update
  - path: "apps/desktop/src/data/settings.ts"
    op: update
  - path: "apps/desktop/src/data/runner.ts"
    op: update
  - path: "apps/desktop/src/screens/course/ChapterPanel.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/ChapterToc.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/CourseScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/PlateFrame.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/data.ts"
    op: update
  - path: "apps/desktop/src/screens/home/empty.tsx"
    op: update
  - path: "apps/desktop/src/screens/ingest/IngestScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/repos/ReposScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/T0Plate.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.tsx"
    op: update
  - path: "packages/i18n/src/ko/core.ts"
    op: update
  - path: "packages/i18n/src/ko/course.ts"
    op: update
  - path: "packages/i18n/src/ko/cards.ts"
    op: update
  - path: "packages/i18n/src/ko/home.ts"
    op: update
  - path: "packages/i18n/src/ko/run.ts"
    op: update
  - path: "packages/i18n/src/ko/session.ts"
    op: update
  - path: "packages/i18n/src/en/core.ts"
    op: update
  - path: "packages/i18n/src/en/course.ts"
    op: update
  - path: "packages/i18n/src/en/cards.ts"
    op: update
  - path: "packages/i18n/src/en/home.ts"
    op: update
  - path: "packages/i18n/src/en/run.ts"
    op: update
  - path: "packages/i18n/src/en/session.ts"
    op: update
  - path: "tests/gates/journey.spec.ts"
    op: create
  - path: "tests/gates/honesty.spec.ts"
    op: create
  - path: "tests/e2e/specs/e9-journey.e2e.ts"
    op: create
  - path: "tests/e2e/specs/e7-night.e2e.ts"
    op: update
  - path: "tests/e2e/wdio.conf.ts"
    op: update
  - path: "tests/support/gates.ts"
    op: update
  - path: "tests/gates/keyboard.spec.ts"
    op: update
  - path: "tests/e2e-ui/shell.spec.ts"
    op: update
  - path: "tests/e2e-ui/keyboard.spec.ts"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/ingest/IngestScreen.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/locale-en.test.tsx"
    op: update
related:
  - ref: "20260905/Features_to_add/1047_feature_ux-audit-run-and-fixes-d170.md"
    kind: "followup"
  - ref: "20260905/Chores/2012_chore_define-done-and-close-delegated-decisions.md"
    kind: "followup"
tags:
  - "ux"
  - "d186"
  - "d187"
  - "gates"
  - "course"
  - "a11y"
  - "mcp-tool"
---
[x] UX 2차 감사 — 여정을 걷고 막힘 3·포커스 유실 5·거짓 5 를 고쳐 게이트로 잠갔다

## 추가 기능

D186 ①(막힘 0 · 되돌아가기 0 · 첫 판까지 클릭)과 ④(못 하는 것을 화면이 말한다)를 **재는
게이트**로 바꾸고, 그 게이트가 빨갛게 만든 자리를 고쳤다.

1차 감사(D170)는 세션 화면이 대상이었고 코스 화면(D171)은 그때 없었다. 이번에는 코스가
여정의 본선이라 첫 실행 → 홈 → 세션 → 코스 → 챕터 → 단 오버레이를 순서대로 걸었다.

**고친 것 11 (`docs/ux-audit.md` §2 에 표로).**

- **막힘 3 → 0.** ① 코스 「오늘 15분」이 「코스가 끝났거나 리포를 읽기 전」이라 말하며 단추를
  하나도 안 냈다 — 「없다」의 이유를 넷으로 갈라(`todayGap`) 이유마다 문장과 다음 행동을
  붙였다. ② 판이 없는 단이 「다시 읽으면 채워집니다」라고만 하고 다시 읽는 문이 없었다 —
  그 자리에 「리포 다시 읽기」. ③ 오늘 몫을 다 푼 홈에 주 단추가 없었다 — 억지로 채우지 않되
  문 둘을 이름으로 가리키게 했다.
- **포커스 유실 5 → 0.** 첫 실행·코스·설정·서가는 들어가면 `activeElement` 가 `<body>` 였고,
  홈도 **첫 부팅**에서 그랬다(효과가 도는 순간 `.press` 가 아직 없다). `Page` 에
  `focusOnMount` 를 두고, 홈은 효과 의존성에 `ui.home` 을 넣되 **잃었을 때만** 옮긴다.
- **거짓 5 → 0.** 합성 판이 「내 코드 사전 예제:1」이라 적었고, 「네 코드엔 없다」 사유
  넷(`t0.absent*`)은 카탈로그에만 있고 아무 화면도 안 불렀다. 첫 판 안내도 합성 판에서
  「당신 리포에서 그대로 떠 온 줄」이라 말했다. 「0 / 0 챕터 통과」는 목차에 챕터가 보이는데
  0% 막대를 그렸다. 판정란은 「규칙 — 규칙 —」을 두 번 찍었다.
- **첫 판까지 클릭 3 → 2.** 인제스트가 끝나면 「홈으로」 하나였는데 다음 행동은 학습이다 —
  「학습 시작」을 주 단추로 두고 홈으로는 옆에 남겼다.
- **D187 ⑫.** 헤더의 밝기 스위치를 빼고 설정에 라디오 셋(시스템 따름 · 밝게 · 어둡게)을
  뒀다. 기본은 시스템 따름이고 그 동안만 `prefers-color-scheme` 을 듣는다. `settings.theme`
  에는 **계산된 결과**를, 새 키 `theme_mode` 에는 **고른 값**을 적는다 — 스키마를 넓히지
  않으려고 `editor_assist` 와 같은 규약을 썼다.

## 동작 흐름

게이트 셋을 새로 뒀다.

- `tests/gates/journey.spec.ts` — 첫 실행 → 홈 → 첫 판 → 요약 → 코스 → 1단 → 2단 오버레이를
  자동으로 걷고, 화면마다 **주 단추 하나 이상**(또는 「끝났다」 표식)과 **포커스가 `<body>`
  가 아님**을 단언한다. 첫 판까지의 클릭 상한 2 도 여기서 잠근다.
- `tests/gates/honesty.spec.ts` — 앱이 못 하는 넷의 문구가 ko·en 에 있고 **화면 컴포넌트가
  그 키를 실제로 부르는지**를 정적으로 본다. `RunnerReason` 은 소스에서 갈래를 읽어 전수라,
  갈래가 늘면 게이트가 저절로 따라간다. 합성 판 하나는 하네스로 띄워 문구가 보이는 것까지.
- `tests/e2e/specs/e9-journey.e2e.ts` — 같은 길을 실제 창에서(리눅스 CI). 리포 등록 구간은
  네이티브 폴더 대화상자라 E2 와 같은 이유로 못 걷는다.

둘 다 **못 잡는 것을 머리글에 적었다** — 정적 대조는 「키가 소스에 글자로 있다」까지고,
브라우저 하네스는 Tauri 창의 포커스 정책을 대신하지 못한다.

밝기를 옮기면서 그 스위치를 짚던 시험 넷(`tests/support/gates.ts` 의 `toNight` ·
`tests/gates/keyboard.spec.ts` · `tests/e2e-ui/{shell,keyboard}.spec.ts` ·
`tests/e2e/specs/e7-night.e2e.ts`)을 설정 화면 경로로 고쳤다.

## 검증

`pnpm typecheck`(apps/desktop · packages/i18n 무출력) · `pnpm lint` 무출력 ·
`vitest apps/desktop packages/i18n packages/ui` 104 파일 996 통과 ·
`playwright tests/gates` 202 통과 10 건너뜀(두 엔진) · `playwright tests/e2e-ui` 26 통과.
남은 빨강 둘은 내 것이 아니다 — `packages/dictionary/src/dict.test.ts` 의 부채 래칫(S6)과
`tests/gates/shots.spec.ts` 의 `.mjs` 선언 파일(S2).