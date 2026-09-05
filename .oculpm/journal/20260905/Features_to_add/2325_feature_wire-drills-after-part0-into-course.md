---
schema_version: 1
type: feature
slug: "wire-drills-after-part0-into-course"
status: done
difficulty: medium
created_at: "2026-09-05T23:25:37+09:00"
session_id: "20260905-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
  session: "acp-20260905-d4ae2987"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/course/src/curriculum.ts"
    op: update
  - path: "packages/course/src/curriculum.test.ts"
    op: update
  - path: "packages/course/src/index.ts"
    op: update
  - path: "docs/program/course.md"
    op: update
related:
  - ref: "20260905/Features_to_add/2133_feature_curriculum-diffs-and-stage-escape.md"
    kind: "followup"
tags:
  - "course"
  - "drills"
  - "D186"
  - "D187"
  - "stdin-runner"
  - "mcp-tool"
---
[x] 작은 문제 층을 0부 뒤에 꽂았다 — 자바 0부 열일곱이 문제 열넷 중 여섯을 연다 (D186 ⑧)

## 추가 기능

앞 일지에서 **자리만 뒀던** 배선을 실물로 꽂았다. S9 가 `drillsAfterPart0()`·`coverOf()` 를
`packages/cards/src/drill.ts` 에 내놓았고, 꽂는 것은 `packages/course` 의 몫이었다.

- `drillEntry(input)` — 0부 개념을 `coverOf` 로 접어 `drillsAfterPart0` 에 넘기고 목차 한 줄을 낸다.
- `OutlineEntry` 에 **`kind: 'drills'`** 변형. `courseOutline` 이 **0부 뒤·1부 앞**에 끼운다.
- `DRILL_TOOLCHAIN_KEY` — 러너가 없을 때 화면이 읽을 i18n 키(`run.reason.toolchainMissingPy`/
  `Ts`/`Java`). **언어마다 다른 문장**이어야 한다(D186 ④) — 「러너가 없다」로 뭉치면 무엇이
  없는지가 사라진다.
- `describe.skip` 넷을 **살려 열하나로** 늘렸다.

## 동작 흐름

`coverOf` 가 0부 개념마다 자기 id·`universal`·`prereq` 셋을 다 집합에 넣는다 — 문제의
`needs` 는 보편 개념(`common/arithmetic` · `cs/integer-overflow`)이고 0부 판은 언어 개념
(`java/arithmetic`)이라 그냥 견주면 한 문제도 안 걸린다.

**실측 (2026-09-05).** 자바 0부 **17개념 → covered 39** → 문제 열넷 중 **여섯이 서고 여덟이
떨어진다**(케이스 56).

| | |
|---|---|
| 서는 여섯 | `sum-two` · `big-product` · `box-count` · `float-not-exact` · `floor-divide` · `reverse-text` |
| 떨어지는 여덟 | 조건 둘(`common/conditional-branch`) · 반복 둘(`common/loop-while`·`iterate`) · 배열 둘(`common/list`·`cs/bounds`) · `count-char`(`iterate`) · **`echo-line`(`common/function-call`)** |

마지막이 이 규칙이 실제로 무는 자리다. `echo-line` 은 여섯 주제 중 **첫째**(`io`)인데 자바로
한 줄을 읽어 찍으려면 메서드를 불러야 하고 0부는 함수 호출을 안 가르친다 — **주제 순서가 곧
난이도 순서가 아니다.**

**1부를 접어도 자리는 0부 뒤 그대로다.** 이 층이 딛는 것은 1부가 아니라 0부이기 때문이고,
시험이 그것을 못박는다(`foldPart1: true` 에서 `part0 → drills → part2`).

**러너가 없어도 줄은 선다.** `ungraded: true` + `reasonKey` 이고 판 수는 그대로다 — 숨기면
학습자는 그 층이 있었다는 것조차 모른다(D186 ④).

**날수.** 여섯 판이니 하루 두 장(D12)으로 **3일**이다. 처음 보는 사람 74 + 3 = **77일**,
단마다 빠져나가는 사람 42 + 3 = **45일**. 이 층은 **단이 아니라서 안 접힌다** —
`foldsStage` 가 보는 것은 챕터의 다섯 단이고 여기는 부 사이다. `course.md` §5.4 에 둘 다 적었다.

## 검증

`vitest packages/course` — **75 통과 · 1 skip**(`curriculum.test.ts` 44, 그중 작은 문제 층 11).
`tsc --noEmit -p packages/course` 초록, 내 파일 셋 `eslint` 초록, `pnpm lint` **전체 초록**.
`pnpm typecheck` 는 `tests/gates/shots.spec.ts` 하나만 빨간데 **미추적 `scripts/shoot-screens.mjs`**
(S1) 의 타입 선언이 없어서다 — 내 밖이라 안 건드렸다.

## 메모

`packages/course` 는 `@chickadee/i18n` 을 안 물고 있어 **문구 키만 나르고 푸는 것은 화면이
한다.** `RunnerReason`(`toolchain-missing:<lang>`) 은 `@chickadee/grading` 의 것이라 타입을
끌어오지 않고, `DrillLang`·`Drill` 은 사전의 것이므로 `@chickadee/dictionary` 에서 받았다 —
새 의존을 하나도 안 더했다.

부 배치는 `0·1·2·3` 그대로다. 새 트랙도 새 `card.kind` 도 안 만들었다(D187 ⑧ · 정본 §5).