---
schema_version: 1
type: feature
slug: "sql-dictionary-session-merged"
status: done
difficulty: medium
created_at: "2026-09-06T04:39:40+09:00"
session_id: "20260906-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/sql/_lang.yaml"
    op: update
  - path: "dictionary/sql/named-param.yaml"
    op: create
  - path: "dictionary/sql/transaction.yaml"
    op: create
  - path: "dictionary/sql/join-inner.yaml"
    op: create
  - path: "packages/course/src/parts/sql.ts"
    op: update
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "docs/curriculum/sql.md"
    op: update
related: []
tags:
  - "v11"
  - "사전"
  - "sql"
  - "합류"
  - "mcp-tool"
---
[x] SQL 사전 40장 — 바닥 여덟·중심·심화 28장 신설, 「네 코드엔 없다」 여섯 (D190 sql 세션 합류)

Opus 워크트리 세션(브랜치 `worktree-agent-a9d13e71ecda98a54`, 커밋 `5dafc8f`·`a220164`)의 보고를 받아 병합했다.

## 추가 기능

- 12 → **40장** 8,400줄(한 장 210줄). `essential` 11 → 40(0부 8 · 1부 8 · 2부 24), `parts/sql.ts` 같음. 1부 = §2 바닥 여덟, 2부 = §3 중심 16 + `self-join` + §4 심화 일곱(`normalization` 은 구문이 없어 못 만듦 — 쿼리 없는 개념은 언어 네임스페이스에 못 든다).
- 골든 90/55, 그중 자리표(`:name`·`#{}`)가 든 골든 12로 `params.rs` 가리기 경로를 시험. 문서 §8 ② 가 「올리지 말라」던 `on-conflict`·`transaction` 과 「보류」 `named-param` 을 올렸다 — 직접 파싱하니 ERROR 0, 자리표는 `#match?` 가 원문을 본다.
- 파서 ERROR: ai-pm .sql poor 1/20 · MonggleMonggle .sql 2/20 · 매퍼 0/20. 원인은 자리표가 아니라 `AUTOINCREMENT`·`VIRTUAL TABLE`·`TRIGGER` 와 mysqldump 구문.
- 0곳 여섯이 ABSENCE 에 들어갔다 — `transaction`(framework: 경계가 java `@Transactional`·Rust `.transaction(` 에) · `query-plan`(idiom: 콘솔) · `window-function`·`cte`·`exists`·`self-join`(scale: 쿼리가 평평하다, 매퍼에 `IN (` 도 0곳).

## 동작 흐름

새 `common/` 후보 셋(ordering·aggregate·exists-any) · `cs/search-tree` 부재로 `index`·`query-plan` 을 `cs/complexity` 에 건 것 · 곱 격자 그림을 세 장이 독립 요구한 것은 등록부 초안으로. 합류에서 `DEBT_RATCHET` 184/166/184/175.

## 검증

병합 뒤 `packages/dictionary`·`packages/course`·`packages/cards` 초록(래칫 재잠금 뒤), cargo 골든 6/6. 못 한 것: `fixtures/golden/sql/` 픽스처 미추가(YAML 골든만) · `text-literal` 4,925곳이 mysqldump 덤프인데 `bestSite` 가 파일 종류를 보는지 안 잼 · `sql.md` 909줄.