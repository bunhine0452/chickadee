---
schema_version: 1
type: feature
slug: "curriculum-diffs-and-stage-escape"
status: done
difficulty: high
created_at: "2026-09-05T21:33:57+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/curriculum/c.md"
    op: update
  - path: "docs/curriculum/c-learning.md"
    op: update
  - path: "docs/curriculum/cpp.md"
    op: update
  - path: "docs/curriculum/cpp-learning.md"
    op: update
  - path: "docs/curriculum/cs.md"
    op: update
  - path: "docs/curriculum/csharp.md"
    op: update
  - path: "docs/curriculum/csharp-learning.md"
    op: update
  - path: "docs/curriculum/go.md"
    op: update
  - path: "docs/curriculum/go-learning.md"
    op: update
  - path: "docs/curriculum/java.md"
    op: update
  - path: "docs/curriculum/java-learning.md"
    op: update
  - path: "docs/curriculum/rs.md"
    op: update
  - path: "docs/curriculum/rs-learning.md"
    op: update
  - path: "docs/curriculum/sql.md"
    op: update
  - path: "docs/curriculum/sql-learning.md"
    op: update
  - path: "docs/curriculum/swift.md"
    op: update
  - path: "docs/curriculum/swift-learning.md"
    op: update
  - path: "docs/curriculum/ts.md"
    op: update
  - path: "docs/curriculum/ts-learning.md"
    op: update
  - path: "docs/curriculum/README.md"
    op: update
  - path: "docs/program/course.md"
    op: update
  - path: "packages/course/src/curriculum.ts"
    op: update
  - path: "packages/course/src/curriculum.test.ts"
    op: update
  - path: "packages/course/src/index.ts"
    op: update
  - path: "dictionary/_glossary.en.yaml"
    op: update
related:
  - ref: "20260905/Features_to_add/1336_feature_formal-java-course-three-parts.md"
    kind: "followup"
  - ref: "20260905/Features_to_add/2047_feature_java-part0-dictionary-19.md"
    kind: "followup"
tags:
  - "curriculum"
  - "course"
  - "D187"
  - "diff"
  - "glossary"
  - "mcp-tool"
---
[x] 열 편의 §N.6 diff 를 본문에 반영하고, 74일 코스에 단별 탈출을 냈다 (D187 ⑭⑮⑰)

## 추가 기능

**① §N.6 diff 반영 (D187 ⑰).** J1~J4 가 각 언어 `<lang>-learning.md` §N.6 에 표로만 적어 두고
본문은 안 고친 것을 전부 처분했다. 아홉 편(py 는 S6 소유)을 열어 `<lang>.md` 본문에 반영했고,
행마다 그 표의 마지막 열에 **「반영 · 어디」**를 적었다. 실측 — **반영 42행 · 「변경 0」으로 확인
6행 · 저작이 먼저 3행 · 범위 밖 30행**(그중 20행은 표에 마커, 10행은 산문으로).

큰 것 셋.

- **자바 0부 축 H 가 2부 문법(`new`)을 쓰는 문제** — 「H 를 1부로 내린다」가 아니라
  **「합성 예를 `new` 없이 쓴다」**를 골랐다. 대표 예가 `new String("a") == "a"` →
  **`Integer` 캐시**. 근거 넷은 `java.md` §1.5.1 축 H 표 아래에 적었다.
- **rs `rs/move` 선행에 `cs/undefined-behavior`** — `rs.md` §0.3·§0.6 과 `cs.md` 양쪽에 걸었다.
  같은 `cs/` 장을 C 와 Rust 가 **반대 방향**에서 쓴다는 것을 `cs.md` §7 에 적었다.
- **TS 순서 셋은 「저작이 먼저」** — `prototype-chain`↔`class-declaration` 방향 뒤집기 ·
  `narrowing`+`union-type` 앞당기기 · `typeof-guard` 짝. 셋 다 `dictionary/ts/` 에 개념 자체가
  없어 `prereq` 를 고칠 자리가 없다. 순서 결정만 `ts.md` §3·§1.5.4·§4 에 박아 뒀다.
  **비용이 진단보다 하나 많다** — 2판이 아니라 3판이다(`union-type` 의 선행 `type-annotation` 도
  위상 정렬에 끌려온다).

**② 단별 탈출 (D187 ⑭).** 74일이 **상한이지 길이가 아니게** 했다. 빠져나가는 문이 부에만
있었고(`foldsPart1`) 챕터·단에는 없었다. `foldsStage` 를 냈고 규칙 셋은 내가 정했다 —
① 그 단의 첫 **두 판을 연속으로** 맞힘(「모르겠어요」는 오답) ② 그 챕터의 어휘 관문이 전부
**2겹** 이상 ③ **5단(재구현)은 안 접는다**.

②가 1 이 아니라 2 인 것이 요점이다 — 전이(D4)는 첫 노출을 1겹에서 시작시키므로 1 로 두면
다른 언어를 아는 것만으로 챕터가 열리기 전에 접힌다. ③은 `course.md` §5.2 가 「끝났다」를
5단으로 정의하기 때문이다. `foldsPart1` 과 겹치지 않는다 — 저쪽은 **겹만**, 이쪽은 **방금 낸 답**.

**③ `_glossary.en.yaml` 스프링 이름 (D187 ⑮).** `dictionary/spring/*.yaml` 열다섯의 `name.en` 이
이미 전부 원어라 **고칠 것이 0건**이었다. 대신 용어집에 **행 15 + 규칙 1**(`framework-proper-noun`)
을 더해 그 상태를 잠갔다 — 다음 프레임워크 사전(`react/`·`mybatis/`)에도 미리 건다.

**④ README §5·§11 을 실물로.** 조사 어림 옆에 첫 물결 실측을 세웠다.

## 동작 흐름

`foldsStage(input)` 는 `declaredNewcomer` → 5단 → 첫 두 판 → 관문 겹 순으로 조기 반환한다.
`chapterEscape` 가 1~5 단을 그 함수에 돌려 `{ stages, folded }` 를 낸다. 접힌 단은 사라지지
않고 완료로 남는다(0장 칩과 같다 · D136).

**시뮬레이션.** §5.1 의 단별 분(4·8·2·16·16 = 46분)에서 5단 16분만 안 접히므로 챕터가
**16/46 = 35%** 로 준다. §6 의 챕터 여덟(38일)에 걸고 챕터마다 최소 하루를 남기면 **13일**.
74 → 1부 접기 −7 → 단별 탈출 −25 = **42일**. 이 셈이 시험으로 못박혀 있다.

S9 의 `drillsAfterPart0()` 는 **안 꽂았다** — 함수는 `packages/cards/src/drill.ts` 에 이미 섰지만
보고가 오케스트레이터를 거쳐 오지 않았고, 그 세션이 도는 중에 부 배치를 여기서 바꾸면 같은
자리를 둘이 고친다. 자리에 실제 시그니처와 꽂는 절차 둘을 적고 `describe.skip` 넷을 뒀다.

## 검증

`npx vitest run packages/course/src/curriculum.test.ts` — **33 통과 · 4 skip**(단별 탈출 12 신규).
`pnpm --filter @chickadee/course exec tsc --noEmit` 초록, 내 파일 셋에 `eslint` 초록.
`pnpm typecheck`·`pnpm lint`·`vitest` 전체는 빨간데 **전부 내 밖**이다 — `packages/cards`
(`fundamentals.test.ts` · `zz-census.test.ts`) · `scripts/shoot-screens.mjs` ·
`tests/gates/journey.spec.ts` 와, 미추적 `dictionary/py/**` 가 부른 `dict.test.ts` 린트 4건 ·
`bake.test.ts` 1건(새 `py/float-inexact`·`py/integer-division` 이 `cs/floating-point` 를 가리켜
`pickLender` 가 다른 언어를 고른다). 병렬 세션의 진행분이다.

## 메모

**사전 요청 셋** (`dictionary/**` 는 내 밖) — ① `dictionary/java/reference-equality.yaml` 의
`dict.why` ko/en 이 아직 `new String("a") == "a"` 를 대표 예로 쓴다. `Integer` 캐시로 갈아야
`java.md` §1.5.1 과 맞는다 ② `rs/move` 를 저작할 때 `prereq` 에 `cs/undefined-behavior`
③ `ts/type-annotation` → `ts/union-type` → `ts/narrowing` 을 `essential` 에서 `ts/if-statement`
바로 뒤에, `ts/class-declaration` 의 `prereq` 에 `ts/prototype-chain`(반대는 안 적는다),
표기 개념 `ts/typeof-guard` 신설.

**안 정한 것 하나** — README §12 규약 8(0부 열둘 상한)을 「개념 열둘」로 읽으면 자바 0부
열일곱이 어기고, 「축 여덟」로 읽으면 셋 다 지킨다. §5 에 그 갈림만 적어 뒀다.