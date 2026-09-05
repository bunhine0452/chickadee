---
schema_version: 1
type: feature
slug: "sql-zero-part-runner-and-placeholder-fix"
status: done
difficulty: high
created_at: "2026-09-05T20:54:47+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/parse/src/params.rs"
    op: create
  - path: "crates/parse/src/lib.rs"
    op: update
  - path: "crates/parse/tests/support/mod.rs"
    op: update
  - path: "crates/store/src/run.rs"
    op: create
  - path: "crates/store/src/lib.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/commands/sqlrun.rs"
    op: create
  - path: "apps/desktop/src-tauri/src/commands/mod.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/lib.rs"
    op: update
  - path: "packages/grading/src/sql-runner.ts"
    op: create
  - path: "packages/grading/src/sql-runner.test.ts"
    op: create
  - path: "packages/grading/src/runner.ts"
    op: update
  - path: "packages/ipc-client/src/types.ts"
    op: update
  - path: "packages/ipc-client/src/index.ts"
    op: update
  - path: "packages/i18n/src/ko/run.ts"
    op: update
  - path: "packages/i18n/src/en/run.ts"
    op: update
  - path: "apps/desktop/src/data/runner.ts"
    op: update
  - path: "dictionary/sql/row-and-set.yaml"
    op: create
  - path: "dictionary/sql/column-type.yaml"
    op: create
  - path: "dictionary/sql/value-and-name.yaml"
    op: create
  - path: "dictionary/sql/null-unknown.yaml"
    op: create
  - path: "dictionary/sql/three-valued-comparison.yaml"
    op: create
  - path: "dictionary/sql/implicit-cast.yaml"
    op: create
  - path: "dictionary/sql/expression-per-row.yaml"
    op: create
  - path: "dictionary/sql/clause-order.yaml"
    op: create
  - path: "dictionary/sql/self-join.yaml"
    op: create
  - path: "dictionary/sql/_lang.yaml"
    op: update
  - path: "dictionary/sql/comparison.scm"
    op: update
  - path: "dictionary/sql/comparison.yaml"
    op: update
  - path: "dictionary/sql/null-check.yaml"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "scripts/seed-fixture-db.mjs"
    op: create
  - path: "fixtures/db/v0009.db"
    op: update
  - path: "docs/curriculum/sql.md"
    op: update
related:
  - ref: "20260905/Features_to_add/0019_feature_sql-comparison-guard-and-proto-generator.md"
    kind: "followup"
  - ref: "20260905/Chores/1927_chore_go-swift-sql-learning-method-research.md"
    kind: "followup"
  - ref: "20260905/Chores/1814_chore_sql-zero-part-and-ten-lang-toc.md"
    kind: "followup"
tags:
  - "sql"
  - "runner"
  - "dictionary"
  - "tree-sitter"
  - "fixtures"
  - "mcp-tool"
---
[x] SQL 0부 여덟 + 자기 조인 · sqlite 러너 · 자리표 결함 수리 · 픽스처 행 시드 (S7)

## 추가 기능

**① 0부 여덟 + `sql/self-join` 을 사전에 올렸다.** `sql.md` §0.2 의 여덟(`row-and-set` · `column-type` ·
`value-and-name` · `null-unknown` · `three-valued-comparison` · `implicit-cast` · `expression-per-row` ·
`clause-order`)과, 근거가 가장 두꺼운 어려움인데 §3 에 자리가 없던 `sql/self-join`.
`essential` 이 3 → 11 이 됐고 전부 깊이 ≤ 2 라 D184 의 프롤로그에 그대로 든다.

**② `#{}` 결함을 수리했다 — 배제가 아니라 가리기로.** 결함이 있던 자리는 셋이었다:
문법이 자리표를 못 읽고, `crates/parse` 가 그 바이트를 그대로 넘기고, `comparison.scm` 이 그 대가를
`(#not-match? @site "[:#]")` 로 치르며 **사용처를 통째로 버리고** 있었다. 고친 곳은 가운데 하나다 —
`crates/parse/src/params.rs`(신규) 가 파스 **전에** `:name`·`#{name}` 을 같은 너비의 글자 값으로
가려 파서에게만 넘기고, 쿼리 술어와 발췌는 원문 버퍼를 본다. 바이트 수가 같아 자리·줄·열이 안 움직인다.

**③ sqlite 러너.** `crates/store/src/run.rs`(엔진) + `apps/desktop/src-tauri/src/commands/sqlrun.rs`(명령)
+ `packages/grading/src/sql-runner.ts`(판정). `RunSpec` 에 `lang:'sql'`·`dialect`·`db`·`cases`,
`RunResult` 에 `reason` 이 붙었다.

**④ 픽스처 행 시드.** `scripts/seed-fixture-db.mjs` 가 `fixtures/db/v0009.db` 에 결정론적 행을 넣는다.

## 동작 흐름

문항 하나 = `sql_run` 호출 하나. TS 가 세울 문장(`setup`)과 물을 문장(`asks`)을 보내고, Rust 는
메모리 sqlite 를 세워 행을 글자로 돌려준다(없는 값은 `null`). 판정은 TS 가 한다 —
`EXCEPT` 양방향과 **같은 판정**이되 SQL 로 안 한다: `EXCEPT` 는 집합 의미라 중복 행 수와 순서를
못 보기 때문이다(`sql-learning.md` §11.5.2 ③). 행을 받아 세면 `order:'none'` 이 진짜 다중집합
비교가 되고 `order:'given'` 이 자리까지 본다.

## 실측

| 잰 것 | 값 |
|---|---|
| `sql/comparison` 사용처 — 표본 매퍼 9파일 | **6 → 53** (값 쪽 `literal` 3 → 50, `in_error` 0) |
| `sql/comparison` 사용처 — 이 리포 `.sql` 27파일 | **229 → 480** |
| 이 리포 27파일 `ERROR` 노드 | **800(26파일) → 92(18파일)** |
| 시드 행 | **31 → 101** · 행 있는 표 22 → 26 · `integrity_check` ok · `foreign_key_check` 0 |
| 러너 시험 | TS 23 + Rust 5 |
| 러너 왕복 (세우기 2문 + 묻기 2문) | **1 ms 미만** |
| Rust 추가 | 순수 코드 192줄 (+ 파일 안 시험 102). 센서스 3,052 |

## 내린 결정

- **자리표를 `@name` 이 아니라 글자 값으로 가린다.** `@name` 도 파싱은 되지만 `field`(열 참조)로
  잡혀 **같은 거짓말의 다른 모자**다. `?` 는 `(parameter)` 지만 이름이 사라져 발췌가 어긋난다.
- **`sql/comparison` 의 선행에 0-5 를 안 걸었다.** §0.2 표대로 0-5·0-6 을 둘 다 걸면 깊이가 3 이 되어
  D184 의 프롤로그(깊이 ≤ 2)에서 빠진다. 0-6 하나만 걸고 0-5 는 `sql/null-check` 쪽 사슬에 남겼다.
- **엔진을 `crates/store` 에 뒀다.** 「1 크레이트 = 1 래핑」이라 rusqlite 를 desktop 크레이트가 다시
  감싸면 안 된다. `sqlrun.rs` 는 10줄짜리 껍데기다.
- **표본 리포의 `fix:` 커밋은 4·5단 정답지로 탈락.** `ff93223` 의 매퍼 hunk 는 MySQL
  `ON DUPLICATE KEY UPDATE` 라 sqlite 러너로 못 돌리고, 그 리포의 덤프는 sqlite 에서 표 0개다.
  1~3단 재료로는 선다.

## 검증

`pnpm dict:lint` 16/16 · `pnpm typecheck` 워크스페이스 전체 초록 · `pnpm lint` 초록 ·
`pnpm test:unit` 2,432 통과 · `cargo test --workspace` 전량 통과 ·
`bash scripts/check-rust-budget.sh` 방벽 넷 초록 · `cargo clippy --workspace --all-targets` 경고 0.