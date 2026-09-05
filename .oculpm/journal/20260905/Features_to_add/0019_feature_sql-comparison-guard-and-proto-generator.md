---
schema_version: 1
type: feature
slug: "sql-comparison-guard-and-proto-generator"
status: done
difficulty: high
created_at: "2026-09-05T00:19:46+09:00"
session_id: "20260905-001"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/sql/comparison.scm"
    op: create
  - path: "dictionary/sql/comparison.yaml"
    op: create
  - path: "dictionary/sql/_lang.yaml"
    op: update
  - path: "dictionary/proto/jwt.yaml"
    op: update
  - path: "dictionary/proto/http-method.yaml"
    op: update
  - path: "dictionary/proto/status-code.yaml"
    op: update
  - path: "packages/cards/src/t0-proto.ts"
    op: create
  - path: "packages/cards/src/t0-proto.test.ts"
    op: create
  - path: "packages/cards/src/index.ts"
    op: update
  - path: "packages/dictionary/src/schema.ts"
    op: update
  - path: "dictionary/schema/concept.schema.json"
    op: update
  - path: "packages/i18n/src/ko/cards.ts"
    op: update
  - path: "packages/i18n/src/en/cards.ts"
    op: update
  - path: "apps/desktop/src/data/blocks.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/2344_feature_sql-java-proto-namespaces.md"
    kind: "followup"
tags:
  - "D157"
  - "D159"
  - "sql"
  - "proto"
  - "카드-생성기"
  - "mcp-tool"
---
[x] 자리표 함정을 막고 `sql/comparison` 열기 · 사용처 없는 개념의 카드 굽기

## 1. 거르는 자리는 노드가 아니라 글자였다

자리표를 노드 종류로 거르려 했는데 **안 된다** — 진짜 조인(`u.id = d.uid`)도 오른쪽이 `field` 다.
대신 **사용처의 글자**를 본다: `(#not-match? @site "[:#]")`. 실측:

| | 리터럴 | 조인 | 숫자 | `#{}` | `:name` |
|---|---|---|---|---|---|
| 맨몸 | 1 | 1 | 1 | **1** | **1** |
| 거름 | 1 | 1 | 1 | **0** | **0** |

Postgres 의 `::` 형 변환도 같이 빠진다. 이 앱은 SQLite 를 쓰고, **틀린 것을 가르치느니 몇을
놓치는 편**이 낫다 — `.scm` 주석에 적었다. 음성 예시(`expect: none`)로 `#{loginId}` 가 안 걸리는
것을 못박았다.

## 2. 규약 카드 생성기 — D157 §9 가 닫혔다

`t0-proto.ts`. 짚을 노드가 없는 개념이 **근거 낱말**(`evidence`)로 자리를 얻는다 —
`Bearer` 는 어느 언어에서도 그냥 글자라 쿼리로는 못 잡는다. 블록의 글자에 표시가 보이면
그 줄을 자리로 삼고, `t0-exec` 과 **같은 수**로 `ConceptSite` 를 지어 평소 `genMeaning` 에 넘긴다.

- 스키마에 `evidence: string[]` 하나 (기본 `[]`)
- `PROTO_SITE_ID = -3` — 합성(−1)·추적(−2)과 안 겹치고 원장에는 `NULL` 로 간다
- **새 `card.kind` 도 마이그레이션도 없다** (D151·D154 의 선)
- 문항은 뜻 고르기 하나뿐이다 — 규약에는 짚을 자리도 뚫을 구멍도 없다
- `bakeNextProto` 로 배선했다. `bakeNextExec` 과 같은 모양이고 `originalAst` 를 안 부른다(블록 원문이면 된다)

시험이 실물로 확인한다 — `Jwts.builder()` 가 있는 블록에서 11행에 `meaning` 카드가 서고,
근거가 없는 블록에서는 사유를 내고 물러난다.

## 3. 못 한 것과 그 이유

**매퍼 안의 SQL 을 못 읽는다.** 자리표 함정은 위에서 막았지만 막는 것이 하나 더 있었다 —
`jobs.rs:296` 이 `compiled.get(&file.grammar)` 로 **파일 하나에 문법 하나**를 쓴다.
`.vue` 가 됐던 것은 그것이 *한 문법을 구간에만* 돌리는 일이었기 때문이고, MyBatis 매퍼는
XML 속성과 SQL 본문이라 **문법 둘**이 필요하다. `file.grammar` 를 목록으로 바꾸거나 두 번 훑어야
하고, 그것은 인제스트 파이프라인의 모양을 바꾸는 일이다. 이 판에서 열지 않았다.

**SQL 바닥 여덟 중 다섯이 남았다** (`text-literal`·`select-list`·`where-filter`·`order-by`·`update-set`).
막힌 것이 없고 순수 저작 분량이다.

## 검증

`pnpm test:unit` **180파일 / 2,046건 전량 통과**(두 번 연속, 새 시험 4) ·
`cargo test --workspace` 19개 스위트 ok · `pnpm dict:lint` 13/13 · `typecheck`·`lint` 무출력 ·
Rust 예산 2,407/2,800(안 바뀜 — Rust 를 안 건드렸다).

`dict:schema` 재생성을 또 빠뜨렸고 또 시험이 잡았다. 래칫 50/46/50/43.