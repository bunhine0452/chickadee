---
schema_version: 1
type: feature
slug: "formal-java-course-three-parts"
status: done
difficulty: high
created_at: "2026-09-05T13:36:56+09:00"
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
  - path: "docs/curriculum/java.md"
    op: update
  - path: "docs/curriculum/README.md"
    op: update
  - path: "docs/program/course.md"
    op: update
  - path: "dictionary/java/_lang.yaml"
    op: update
  - path: "dictionary/java/array.yaml"
    op: create
  - path: "dictionary/java/array.scm"
    op: create
  - path: "dictionary/java/for-each.yaml"
    op: create
  - path: "dictionary/java/for-each.scm"
    op: create
  - path: "dictionary/java/return-statement.yaml"
    op: create
  - path: "dictionary/java/return-statement.scm"
    op: create
  - path: "dictionary/java/abstract-class.yaml"
    op: create
  - path: "dictionary/java/abstract-class.scm"
    op: create
  - path: "dictionary/java/generic-bound.yaml"
    op: create
  - path: "dictionary/java/generic-bound.scm"
    op: create
  - path: "dictionary/java/equals-hashcode.yaml"
    op: create
  - path: "dictionary/java/equals-hashcode.scm"
    op: create
  - path: "dictionary/java/lambda.yaml"
    op: create
  - path: "dictionary/java/lambda.scm"
    op: create
  - path: "dictionary/java/stream-pipeline.yaml"
    op: create
  - path: "dictionary/java/stream-pipeline.scm"
    op: create
  - path: "dictionary/java/annotation.yaml"
    op: update
  - path: "dictionary/java/interface.yaml"
    op: update
  - path: "dictionary/java/constructor.yaml"
    op: update
  - path: "dictionary/java/field-declaration.yaml"
    op: update
  - path: "dictionary/java/class-declaration.yaml"
    op: update
  - path: "dictionary/java/try-catch.yaml"
    op: update
  - path: "fixtures/golden/java/array"
    op: create
  - path: "fixtures/golden/java/for-each"
    op: create
  - path: "fixtures/golden/java/return-statement"
    op: create
  - path: "fixtures/golden/java/abstract-class"
    op: create
  - path: "fixtures/golden/java/generic-bound"
    op: create
  - path: "fixtures/golden/java/equals-hashcode"
    op: create
  - path: "fixtures/golden/java/lambda"
    op: create
  - path: "fixtures/golden/java/stream-pipeline"
    op: create
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "packages/cards/src/t0-synthetic.test.ts"
    op: update
  - path: "packages/cards/src/index.ts"
    op: update
  - path: "packages/course/src/curriculum.ts"
    op: create
  - path: "packages/course/src/curriculum.test.ts"
    op: create
  - path: "packages/course/src/index.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
related: []
tags:
  - "D177"
  - "커리큘럼"
  - "사전"
  - "코스"
  - "실측"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 정식 자바 코스 3부 — 합성으로 배우고 내 코드에서 확인한다 (D177)

## 추가 기능

정본 §1·§4 가 「별도 입문 과정을 만들지 않는다」와 「교재는 내 코드뿐」을 폐기했다. 그 자리에 3부 코스를 세웠다 — **1부 바닥**(합성 예제 13판) · **2부 객체**(합성 + 내 코드 16판) · **3부 프레임워크**(내 코드 중심, `spring/` 15판 · D176).

## 뒤집힌 근거는 셈이다

표본 `MonggleMonggle` 자바 99장 실측:

| 무엇 | 곳 |
|---|---|
| `for (;;)` | **0** |
| for-each | **1** |
| 배열 `[]` | **1** (`String[] args`) |
| `abstract class` | **0** |
| `<T extends …>` · `? extends` | **0** |
| `equals`/`hashCode` 재정의 | **0** |
| `Set<`·`switch`·`instanceof`·`enum`·`char` | **각 0** |
| `implements` | 1 |
| `extends` | 9 (8이 예외 계층) |
| `->` 53 · `.stream()` 9 · `return` 118 | — |

**이 리포만으로 「반복」을 가르치면 교재가 한 줄이다.** 반복의 자리를 스트림과 람다가 가져갔다.

## 동작 흐름

`buildCurriculum(부 배치 · prereq · bestSite · absence)` → 부마다 `topoOrder`(규칙 ③), 3부만 「내 코드 먼저」(규칙 ②) → 판마다 `siteId`(내 코드) / `previewSiteId`(자리는 있는데 미지 많음 · D137) / `absent`(자리가 아예 없음 · D177) 중 하나. 셋 다 못 대면 판이 안 선다. → `chapterGates`(부가 가르친 것을 뺀 챕터 관문, 챕터당 6 · 전체 40) → `courseOutline`(부 → 기능 챕터).

## 판단 둘

**① 합성 예제와 문항은 사전, 「없음의 사유」는 카탈로그.** 두 번 물어서 갈랐다 — 예제 코드는 개념마다 다르므로 사전(`examples[].code` + `expect.picks`, 이미 `makeSyntheticCard` 의 재료)이고, 없음의 사유 넷(`framework`·`library`·`scale`·`idiom`)은 개념마다 다르지 않고 언어에도 안 매이므로 카탈로그다. `exec/order` 의 진단 산문 넷이 같은 이유로 사전을 떠난 선례를 따랐다. 사전 스키마는 한 줄도 안 늘렸다.

**② 잠금을 풀지 않고 문을 하나 더 냈다.** `makeAbsentCard` 는 `previewSiteId` 대신 `AbsenceReason` 을 **필수**로 받는다. 열쇠를 하나로 합치면 「예고」와 「부재의 사유」가 섞이고, 섞이면 D137 이 막으려던 것이 다른 얼굴로 돌아온다.

## 낸 것

- **자바 개념 여덟** — `array`·`for-each`·`return-statement`(1부) · `abstract-class`·`generic-bound`·`equals-hashcode`·`lambda`·`stream-pipeline`(2부). `_lang.yaml` `essential` 21 → 29. 골든 픽스처 24파일(개념당 양성 2 · 음성 1), 전부 양성 캡처·음성 0.
- **`packages/course/src/curriculum.ts`** — `JAVA_PARTS`·`buildCurriculum`·`foldsPart1`·`chapterGates`·`courseOutline`. 시험 20건.
- **`docs/curriculum/java.md` 재편** — §2 가 코스 정본이 되고 옛 「기초/중심/심화」가 부 배치로 대체. 절 번호가 하나씩 밀렸다.
- **`docs/program/course.md` §3.3 신설** — 관문 0(12판) 폐기, 1·2부가 흡수.
- 코디네이터 요청 둘 — `java/` 여섯에 `spring/` 선행(빌림), `dict.test.ts` 의 `loadDict` 에 매니페스트를 넘겨 `spring/` 이 CI 에서 실제로 검사되게.

## 표본 목차 실측

| 목차 | 판 | 내 코드 | 「없다」 | 안 서는 것 |
|---|---|---|---|---|
| 1부 | 13 | 12 | 1 (`for-loop`) | — |
| 2부 | 16 | 13 | 3 | — |
| 3부 | **14** | 14 | 0 | **`spring/bean-lifecycle`** — 근거 낱말 0곳이고 `examples[]` 도 없다 |
| 1 로그인 | 관문 ≤ 6 | 24파일 · 요청 6 | — | — |

부 셋 43판 = 22일(D12 하루 2판). **로그인 챕터의 관문에 자바가 0개**다 — 부가 다 흡수했다.

## 검증

`pnpm dict:lint` 15/15 · `cargo test -p chickadee-parse` 42건 전량(골든 재생성 포함) · `pnpm vitest run packages/{cards,course,concepts,dictionary}` 748건 통과 · `typecheck`·`lint` 무출력(내 패키지) · `pnpm test:unit` 2,288/2,297.

## 메모

- 범위 밖 빨강(내 것 아님): `packages/grading/src/java-runner.ts` typecheck 2건 + `runner.test.ts` 7건(C1 · `ProcSpec.needs` 누락) · `packages/grading/src/t1.test.ts` 성능 예산 flake(0.251 대 0.2 ms/줄).
- C2 가 보고한 `zero-chapter` java 25/24 실패는 **재현되지 않았다.** 실제 사전으로 재면 깊이 ≤ 2 가 **21/24** 다(`comparison`·`if-statement` 의 선행이 `cs/` 라 자바 집합 안에서 깊이 0). 그런 단언을 하는 시험도 리포에 없다.
- `java/` 여섯이 `spring/` 을 `prereq` 로 가리키는 것은 **조건부 참조**다 — 스프링이 없는 자바 리포에서는 그 선행이 로드되지 않은 id 를 가리킨다. `cs/`(언제나 로드됨)와 다른 자리라 `dict.test.ts` 에 주석으로 남겼다.