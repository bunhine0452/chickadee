---
schema_version: 1
type: feature
slug: "sql-java-proto-namespaces"
status: done
difficulty: superhigh
created_at: "2026-09-04T23:44:14+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/sql/_lang.yaml"
    op: create
  - path: "dictionary/sql/from-table.yaml"
    op: create
  - path: "dictionary/sql/null-check.yaml"
    op: create
  - path: "dictionary/java/variable-declaration.yaml"
    op: create
  - path: "dictionary/java/assignment.yaml"
    op: create
  - path: "dictionary/java/arithmetic.yaml"
    op: create
  - path: "dictionary/java/boolean-literal.yaml"
    op: create
  - path: "dictionary/java/comparison.yaml"
    op: create
  - path: "dictionary/proto/jwt.yaml"
    op: create
  - path: "dictionary/proto/http-method.yaml"
    op: create
  - path: "dictionary/proto/status-code.yaml"
    op: create
  - path: "packages/dictionary/src/schema.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "packages/dictionary/src/lint.ts"
    op: update
  - path: "docs/curriculum/cs.md"
    op: update
related:
  - ref: "20260904/Features_to_add/2320_feature_mybatis-mapper-edges.md"
    kind: "followup"
tags:
  - "D156"
  - "D157"
  - "D159"
  - "sql"
  - "java"
  - "proto"
  - "래칃"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] SQL 열기 · 자바 바닥 여덟 채우기 · 규약 네임스페이스 세우기

## 1. SQL — 함정을 먼저 재고 그 자리를 피했다

`docs/curriculum/sql.md` 가 지목한 자리표 함정을 **노드 이름까지** 확인했다.

| 오른쪽 | 노드 | 잡히는 글자 |
|---|---|---|
| `'abc'` | `literal` | `'abc'` |
| `#{loginId}` | **`unary_expression`** | **`#{loginId`** ← 닫는 중괄호가 잘림 |
| `:loginId` | **`field`** | **`loginId`** ← 값인데 「열 이름」 |
| `?` | `parameter` | `?` |

둘 다 `quality: ok` 이고 `in_error` 도 0 이다 — **완전히 조용하다.**
그래서 설계의 바닥 여덟 중 **`sql/comparison` 을 일부러 뺐고** 그 사유를 `_lang.yaml` 에 적었다.
연 것은 `from-table` 과 `null-check` 둘이다.

`null-check` 이 SQL 에서 가장 날카로운 자리다 — `= NULL` 은 오류가 아니라 **조용히 0행**이고,
음성 예시(`expect: none`)로 그것이 이 쿼리에 안 걸린다는 것을 못박았다.

`_imports.scm` 은 **결코 맞지 않는 패턴** 하나를 둔다 — SQL 에 import 가 없는데 시스템 쿼리
자리를 비우면 린트가 잡는다.

## 2. 자바 바닥 여덟 완성

앞 판의 셋에 다섯을 더했다. `variable-declaration` 은 예고한 대로 **구멍 문제를 다시 만났고**
(타입 글자가 사용처마다 다르다) `no_hole_reason` 으로 갔다. `boolean-literal` 도 같다 —
정답이 `true` 냐 `false` 냐로 갈린다.

`arithmetic` 에서 **`/` 를 뺐다.** 정수 나누기가 소수를 버리는 것은 이 개념의 규칙이 아니라
다른 개념의 것이고, 넣으면 규칙이 사용처마다 달라진다 — 파이썬 `//` 때와 같은 판단이다.

## 3. `proto/` — 그리고 D157 §9 의 답

JWT·HTTP 메서드·상태 코드 셋. 언어도 기계도 설계도 아닌 **네 번째 종류**다.

**미해결이던 「사용처 없는 개념의 카드를 누가 굽나」에 답을 찾았다** —
`t0-exec.ts:194` 가 **`ConceptSite` 를 지어서** 평소 생성기에 넘긴다. 원장에는 `site_id` 가
`NULL` 로 들어가고 지목형·뜻 고르기가 그대로 돈다. **새 `card.kind` 도 마이그레이션도 필요 없다.**
남은 것은 「어느 파일의 어느 창을 그 자리로 삼을까」뿐이다. `cs.md` §9 를 갱신했다.

## 4. 접두어를 상수 하나로 — 넷째에서

`proto/` 를 더하니 「쿼리 없는 네임스페이스」 시험이 걸렸다. D157 §7 이 「세 번은 참았지만
넷은 아니다」라고 적어 둔 자리이고, 플랜 `{#a-lint}` 이 세어 둔 자리다.
`schema.ts` 에 `COMPUTED_NAMESPACES` + `isComputed` 를 세우고 세 곳이 그것을 쓴다.

## 실측 (`MonggleMonggle`)

| | 파일 | 사용처 |
|---|---|---|
| java | 98 | **577** — 변수 189 · 메서드 118 · 클래스 108 · 조건 57 · 비교 51 · 참거짓 27 · 셈 19 · 대입 8 |
| sql | 25 | **178** — from 172 · null 검사 6 |

`assignment` 가 8곳뿐인 것이 눈에 띈다 — Spring 코드는 선언하며 값을 넣고 다시 안 넣는다.
`no_hole_reason` 으로 간 `variable-declaration` 이 189곳으로 가장 많다.

## 부채 래칫

44/41/44/38 → **49/45/49/42**. 새 개념 열(자바 5 · SQL 2 · proto 3) 중 essential 일곱이 대상을 늘렸다.

## 검증

`pnpm test:unit` **180파일 / 2,042건 전량 통과** · `cargo test --workspace` **21개 스위트** ok
(사전 시험이 예시를 진짜 문법에 돌려 검증) · `pnpm dict:lint` 13/13 · `typecheck`·`lint` 무출력 ·
Rust 예산 2,407/2,800.

린트가 이번에도 일곱 번 잡았다 — 조사 필터 다섯, 금칙어 하나(`틀렸`), `trace` 가 코드를 안 짚는 것 하나.

## 남은 것

- `sql/comparison` — 오른쪽 노드 종류로 거르는 규칙을 세운 뒤에 연다.
- SQL 바닥 여덟 중 여섯(`text-literal`·`select-list`·`where-filter`·`order-by`·`update-set`).
- `proto/` 의 카드 생성기 — 「어느 파일을 가짜 사용처의 자리로 삼을까」.
- 매퍼 안의 SQL 구간 열기(`.vue` 와 같은 수) — 자리표 함정을 먼저 막아야 한다.