---
schema_version: 1
type: feature
slug: "chapter-pass-recheck-and-today"
status: done
difficulty: high
created_at: "2026-09-05T10:08:47+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "packages/store-sql/statements/chapter.sql"
    op: create
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "packages/concepts/src/progress.ts"
    op: create
  - path: "packages/concepts/src/progress.test.ts"
    op: create
  - path: "packages/concepts/src/index.ts"
    op: update
  - path: "packages/scheduler/src/chapter-review.ts"
    op: create
  - path: "packages/scheduler/src/course-plan.ts"
    op: create
  - path: "packages/scheduler/src/course-plan.test.ts"
    op: create
  - path: "packages/scheduler/src/index.ts"
    op: update
  - path: "EVALS.md"
    op: update
  - path: "docs/program/mastery.md"
    op: correct
related:
  - ref: "20260905/Features_to_add/0841_feature_write-chapters-during-ingest.md"
    kind: "followup"
  - ref: "20260905/Features_to_add/0832_feature_course-storage-and-dictionary-first-chapter.md"
    kind: "followup"
tags:
  - "course"
  - "chapter"
  - "mastery"
  - "fsrs"
  - "D165"
  - "mcp-tool"
---
[x] 챕터 통과 판정·재검·오늘 15분을 코드로 — 0007 이 세운 두 표에 처음 쓰는 손 (D165)

## 추가 기능

인제스트가 `chapter` 행을 쓰기 시작한 뒤로도 `stage_reached` 는 영원히 0 이었다. 표는 서 있는데
쓰는 곳이 하나도 없어서 「다음 챕터 해금」도 「오늘 15분」도 판정할 값이 없었다. 그 손을 붙였다.

- **`packages/store-sql/statements/chapter.sql`** — `chapter.*` 6 · `stage.*` 4. 원장 규약은
  `review.sql` 을 그대로 따른다: `stage.append` 다음에 오는 `chapter.apply_last` 가
  `last_insert_rowid()` 로 재생 커서를 세운다 (D77 과 같은 자리).
- **`packages/concepts/src/progress.ts`** — 통과 판정(`stagePasses`·`passTarget`·`advance`),
  막힘 처방(`stuckAction`·`foldPath`), 쓰기(`recordStageResult`·`deferChapter`).
- **`packages/scheduler/src/chapter-review.ts`** — 재검 등급과 일정. `makeScheduler` 를 챕터 행에
  그대로 건다. 새 알고리즘 0 이고 `fsrs.ts`·`reducer.ts`·`plan.ts`·`day.ts` 는 한 줄도 안 고쳤다.
- **`packages/scheduler/src/course-plan.ts`** — 오늘 15분.
- **`EVALS.md`** `ledger` 에 C1~C5. 전부 `stage_log`·`chapter` 열만 읽는다 (D149 방식).

## 동작 흐름

**통과** = 1·2·3단 통과 ∧ (4단 문항이 있으면 4도). 통과선은 `mastery.md` §3.2 그대로 —
1단은 경로 위 개념이 전부 1겹 이상(`chapter.reading_layers` 가 `mastery.layer` 를 읽는다),
2·4단은 전부 맞음, 3단은 4/5. 3단만 비율선이라 4문항이면 4/4 를 요구한다 — 비율선을 쓴 대가이고
문항을 3 이나 5 로 굽는 편이 낫다는 것을 주석에 적었다.

**4단을 못 굽는 챕터는 3단까지가 통과**로 기본값을 잡았다(`passTarget()`). `mastery.md` §8 의
사용자 결정 자리이고, 뒤집으면 그 함수 한 줄이다. 4단 문항이 커밋 원장에서 나오므로 4로 고정하면
커밋이 적은 리포의 코스가 통째로 빈다.

**재검**은 추적·예측 둘 다 맞음 Good(3) · 예측만 틀림 Hard(2) · 추적 틀림 Again(1). 추적이 축인
이유는 예측 오답이 그 줄 하나를 잘못 읽은 것인 반면 추적 오답은 경로를 잃은 것이기 때문이다.
Again 이면 `stage_reached` −1 이고 그것이 유일한 되돌림이다. **`passed_at` 은 안 지운다** —
해금을 걷으면 「챕터를 내리면 앞으로 못 간다」는 실패 모드가 그대로 선다. 같은 날 재검은
`chapter.due` 의 `NOT EXISTS`(같은 `day_key` 의 recheck 행)가 SQL 에서 막는다.

**오늘 15분**은 만기 재검 먼저, 그다음이 오늘 챕터의 다음 단. 예산이 넘치면 다음 단을 **뒤에서**
자르고 재검은 안 뺀다. 안 들어가는 판에서 멈추고 뒤의 작은 판을 앞으로 당기지 않는다 — 단 안의
판 순서가 곧 배우는 순서다. 재검에 상한을 안 둔 것은 챕터가 코스 하나에 열 안팎이라서다
(`plan.ts` 의 20 은 개념 단위 값이다).

**막힘**은 1·3단 뒤로, 2단 옆으로(경로 5칸 → 3칸, 양 끝은 남기고 고르게 뽑는다), 4단 밖으로.
새 `ladder_event.action` 값을 안 만들었다. 한 세션에서 같은 챕터 3회면 `deferred_day` 를 찍고
그날 `chapter.today` 에서 빠진다.

## 검증

`pnpm typecheck` — 내 파일 0건. `pnpm lint` 통과. `npx vitest run packages/concepts
packages/scheduler packages/store-sql` 29파일 506건 통과(새 시험 28건: `progress.test.ts` 20 ·
`course-plan.test.ts` 8). `pnpm test:unit` 185파일 2100건 통과.

`progress.test.ts` 뒤 절반은 진짜 sqlite 위에서 카탈로그 SQL 을 그대로 돌린다 — 재생 커서가
방금 쓴 `stage_log.id` 를 가리키는 것, 세 단을 밟으면 `chapter.today` 가 다음 챕터로 넘어가는 것,
같은 날 `chapter.due` 가 비는 것을 원장으로 확인했다.

## 메모

- `pnpm typecheck` 이 `packages/concepts/src/units.test.ts` 에서 40건 실패한다. **내 범위 밖이고
  HEAD 에서 이미 그렇다** — `ResolvedEdge.line` 이 필수가 된 커밋(3245f54, D162)이 그 시험의
  `edge()` 헬퍼를 안 고쳤다. 런타임은 통과한다(vitest 는 타입을 안 본다).
- `mastery.md` §7 의 C4 를 고쳤다. 원문(「3단 실패로 되돌린 **개념**의 다음 정답률」)은
  `review_log` 를 읽어야 나오고 바로 위 줄의 「전부 `stage_log`·`chapter` 만 읽는다」와 부딪친다.
  재는 것(되돌림이 벌이 아니라 순서 재조정인가)은 두고 대상을 챕터로 옮겼다.
- 새 DDL 은 안 만들었다. 0007 의 열로 전부 됐다.