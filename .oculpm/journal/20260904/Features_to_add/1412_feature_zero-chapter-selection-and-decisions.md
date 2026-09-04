---
schema_version: 1
type: feature
slug: "zero-chapter-selection-and-decisions"
status: in_progress
difficulty: medium
created_at: "2026-09-04T14:12:17+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "packages/concepts/src/zero-chapter.ts"
    op: create
  - path: "packages/concepts/src/zero-chapter.test.ts"
    op: create
  - path: "packages/concepts/src/index.ts"
    op: update
  - path: ".oculpm/planner/chickadee-v04-four-requests.md"
    op: create
related: []
tags:
  - "v04"
  - "zero-chapter"
  - "d136"
  - "mcp-tool"
---
[ ] 0장 — 담을 판을 고르는 규칙과 끝나는 조건, 결정 등록부 D136~D139

## 추가 기능

「0장 — 이 언어의 바닥」의 **선정 규칙과 끝나는 조건**. 화면은 아직 없다 — 순수 함수와 테스트가 먼저다.

조사 일지는 `20260904/Chores/1402_chore_v04-four-requests-parallel-survey.md`. 거기서 나온 진단은 (가), 즉 정본이 이미 채택한 것(방안 E-2)이 미구현이라는 것이었다. `packages/concepts/src/gaps.ts:5` 와 03 §6 이 「0장이 안내한다」고 약속하는데 받는 쪽이 없었다.

## 동작 흐름

`packages/concepts/src/zero-chapter.ts` 넷:

- **`shouldOpen(essential, layerOf)`** — 그 언어 essential 이 전부 0겹일 때만 참. 원장 둘만 보고 **사용자에게 묻지 않는다**(정본 §4 · 방안 E-5 배치고사 금지). 인자가 둘뿐인 것을 테스트가 지킨다.
- **`zeroChapterPlates(input)`** — 담을 판을 순서대로, 최대 8장. 정렬은 ① 내 코드 사용처가 먼저(합성은 뒤) ② 선행 깊이 ③ 미지 ④ id. `bestSiteOf` 가 `null` 인 개념, 즉 리포에 사용처가 아예 없는 개념은 **넣지 않는다** — 예고할 자리가 없으면 E-4 를 지킬 수 없다(D137). 미지가 `MAX_UNKNOWN_FOR_NEW` 를 넘으면 `siteId: null` + `previewSiteId: <그 사용처>` 로 합성 자리가 된다.
- **`rootCleared(results)`** — `NEWCOMER_MIN_ROOT_NEW`·`NEWCOMER_CLEAR_OKS` 를 **그대로 재사용**한다. 0장용 새 임계를 만들면 「초보라고 판단하는 선」과 「0장을 닫는 선」이 따로 움직인다.
- **`isDone(input)`** — 셋 중 하나면 끝. 담긴 개념이 모두 1겹 이상 / 초보가 아니고 뿌리를 통과 / 설정에서 끔. 판이 0장이면 끝나지 않는다 — 빈 대지를 완료로 찍지 않는다.

`ZERO_CHAPTER_MAX = 8` 과 `ZERO_CHAPTER_MAX_DEPTH = 1`. 깊이 1 인 이유는 2 를 허용하면 TS 사전 기준 후보가 상한을 훌쩍 넘어 「무엇을 자를까」가 다시 임의의 문제가 되기 때문이다.

## 결정 등록부

`docs/00-overview.md` §4.2.1 에 네 행. §4.2.1 머리말에 D136~ 의 출처(0.4 요청 넷)와 조사 일지 경로를 적었다.

- **D136** 0장을 대지 한 장으로. 홈 색인 띠(D133)의 맨 앞 칩 = `unit(source='manual')`. 별도 화면을 안 만드는 근거는 D134 와 같다.
- **D137** 합성 예제는 `previewSiteId` 필수 인자. 예고를 문장이 아니라 **그날의 큐**로 지킨다.
- **D138** 「먼저 읽기」는 0장 8판에만. 전역으로 켜면 정본 §1 과 부딪치고, `ts/const-declaration.yaml` 은 실제로 `one_liner` 가 point 정답 `const` 를 누설한다.
- **D139** 대상 경계를 첫 실행에서 먼저 말한다.

정본 §4 에 「0장」 한 문장을 더하는 것은 **§4.3 경유 · 사용자 확인 대기**. 구현에는 필요 없다(E-2 가 이미 허용).

## 남은 것

대지 행(`unit(source='manual')`)·색인 띠 칩·도입 문단 렌더·i18n 키, 그리고 P2 합성 예제.

## 검증

`npx vitest run packages/concepts/src/zero-chapter.test.ts` — **20개 통과**. 상한 8, 끝 조건 셋, 「사용처 없으면 안 넣는다」, 「합성 판은 예고를 반드시 갖는다」, 「묻지 않는다」(인자 수)가 각각 테스트로 못박혀 있다. `npx tsc --noEmit -p packages/concepts/tsconfig.json` 초록.