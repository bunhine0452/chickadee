---
schema_version: 1
type: feature
slug: "read-first-and-scope-notice"
status: done
difficulty: medium
created_at: "2026-09-04T15:09:11+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/data/read-first.ts"
    op: create
  - path: "apps/desktop/src/data/read-first.test.ts"
    op: create
  - path: "apps/desktop/src/screens/session/T0Plate.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.css"
    op: update
  - path: "apps/desktop/src/screens/home/empty.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/empty.css"
    op: update
  - path: "apps/desktop/src/screens/home/empty.test.tsx"
    op: update
  - path: "packages/i18n/src/ko/core.ts"
    op: update
  - path: "packages/i18n/src/en/core.ts"
    op: update
  - path: "dictionary/ts/const-declaration.yaml"
    op: update
  - path: "README.md"
    op: update
related:
  - ref: "20260904/Features_to_add/1445_feature_synthetic-example-plates-with-preview.md"
    kind: "followup"
tags:
  - "v04"
  - "zero-chapter"
  - "d138"
  - "d139"
  - "mcp-tool"
---
[x] 0장의 「먼저 읽기」와 첫 실행 경계 문구 — 그리고 판 머리가 지목형 정답을 26개 중 8개에서 먼저 말한다

## 추가 기능

D138(0장 판에만 사전 1층을 편다)과 D139(대상 경계를 첫 실행에서 먼저 말한다). 0장의 마지막 조각이다.

## D139 · 경계 문구

정본 §1 은 「프로그래밍이 완전히 처음인 사용자는 대상이 아니며 앱이 그 사실을 **정직하게 말한다**」고 했는데, 실제로 말하는 자리는 `Newcomer` 하나였고 그것은 뿌리 개념이 **두 세션 내리 막힌 뒤에야** 뜬다. 늦게 말하면 헛돈 사람에게만 정직한 것이 된다.

첫 실행 문단 아래 한 줄(`firstRun.scope`)과 README 「Who it is not for」를 더했다. 외부 자료는 새로 고르지 않고 `home.newcomerBody` 에 이미 실명으로 있던 생활코딩·CS50 을 그대로 쓴다. **묻지 않고 잠그지 않는다** — 자기 신고 문항을 두지 않은 근거는 방안 E-5 다(「초보는 자기 레벨을 못 고르고 시험은 최악의 첫인상이다」). 화면의 스위치가 여전히 표시 언어 하나뿐인 것을 테스트가 지킨다.

## D138 · 먼저 읽기

`apps/desktop/src/data/read-first.ts` 셋 — `loadZeroChapterConcepts` · `answerText` · `leaksAnswer`/`readFirstText`. 세 조건이 다 참일 때만 한 줄이 나온다: ① 0장에 담긴 개념 ② 사전 1층이 있음 ③ 그 줄이 정답을 누설하지 않음.

새 statement 를 만들지 않으려고 `home.units` 를 그대로 썼다(대지 전량을 읽어 여덟 줄을 고르므로 낭비가 있고 세션당 한 번만 부른다). 좁은 문장이 필요해지면 그때 만든다.

**누설 판정에 함정이 있었다.** 「one_liner 에 정답 토큰이 들어 있으면 누설」이라는 규칙을 글자대로 쓰면 늘 참이 된다 — 사전은 문법을 보이려고 `a.b`·`a ?? b` 를 적고 한국어 문장에는 마침표가 있어서, `.` 이나 `??` 가 정답인 개념은 전부 걸린다. 그런데 학습자는 그것을 읽고도 `user.profile.nickname` 의 **어느 점**인지를 여전히 스스로 찾아야 한다. 그래서 **낱말 정답만**(`/^[A-Za-z_$][\w$]*$/`) 누설로 센다. 여덟 개념 중 실제로 걸리는 것은 `ts/const-declaration` 하나였다.

그 하나는 사전을 고쳤다 — 「`const` 는 이름 하나에 값을 묶는다」 → 「값 하나에 이름을 붙인다. 그 이름을 나중에 다른 값에 다시 묶을 수는 없다.」 하는 일로 설명하는 편이 그 언어가 처음인 사람에게도 낫고, 보편 개념 `common/variable-binding` 의 문체와도 맞는다.

## 조사 중 발견 — 이번 범위 밖, 사용자 결정이 필요하다

**판 머리가 지목형 정답을 먼저 말한다.** `ProofSheet` 가 `{개념 이름} <code>{토큰}</code>` 을 그리는데(`ProofSheet.tsx:98`), 지목형 정답이 그 토큰과 같은 개념이 **26개 중 8개**다 — `arrow-function`(`=>`) · `const-declaration`(`const`) · `logical-and-guard`(`&&`) · `logical-or-default`(`||`) · `nullish-coalescing`(`??`) · `object-spread`(`...`) · `optional-chaining`(`?.`) · `property-access`(`.`).

사전 문항은 정답을 부르지 않으려고 공들여 쓰여 있다 — `const-declaration` 의 질문은 「**이름과 값을 묶는 일을 맡은 낱말**을 짚어 보세요」다. 그 indirection 을 바로 위 머리가 무너뜨린다.

**이건 D138 이 겨눈 누설보다 크다** — 0장 8판이 아니라 모든 지목형 판에 걸리고, 사전을 고쳐도 안 없어진다. 다만 판 머리는 목업이 정한 자리(05 §5)이고 화면 전체에 걸리므로 고치려면 등록부 행과 사용자 결정이 먼저다. 여기서는 재서 남기고 손대지 않았다.

## 검증

- `npx vitest run apps/desktop/src/data/read-first.test.ts apps/desktop/src/screens/home/empty.test.tsx apps/desktop/src/screens/session` — **68개 통과**(새로 붙인 것 17: 먼저 읽기 13 · 경계 문구 4).
- `npx vitest run packages/dictionary` 48개 통과 · `pnpm lint` 초록 · `npx tsc --noEmit -p apps/desktop/tsconfig.json` 초록.
- **전체 `pnpm test:unit` 은 돌리지 않았다** — 병렬 세션 셋이 같은 작업 트리에서 다른 영역을 고치는 중이라 지금 전체를 재면 남의 중간 상태를 재게 된다. 셋이 끝난 뒤 부모가 한 번에 돌린다.
- 아직 안 한 것: 앱을 띄워 0장 판 위의 한 줄을 눈으로 보지 않았다.

## 남은 것

`#read-first-lint`(0장 대상 개념의 `one_liner` 누설을 `dict:lint` 가 잡는다)는 병렬 세션 하나가 `packages/dictionary/src/lint.ts` 에서 맡고 있다 — 같은 파일을 둘이 고치지 않으려고 넘겼다.