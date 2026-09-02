---
schema_version: 1
type: feature
slug: "m1-git-parse-crates"
status: done
difficulty: high
created_at: "2026-09-03T03:44:51+09:00"
session_id: "20260903-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/git/Cargo.toml"
    op: create
  - path: "crates/git/src/lib.rs"
    op: create
  - path: "crates/git/src/commits.rs"
    op: create
  - path: "crates/git/src/blob.rs"
    op: create
  - path: "crates/git/tests/repo.rs"
    op: create
  - path: "crates/parse/Cargo.toml"
    op: create
  - path: "crates/parse/src/lib.rs"
    op: create
  - path: "crates/parse/src/langs.rs"
    op: create
  - path: "crates/parse/src/query.rs"
    op: create
  - path: "crates/parse/src/ast.rs"
    op: create
  - path: "crates/parse/tests/scan.rs"
    op: create
  - path: "Cargo.toml"
    op: update
related: []
tags:
  - "m1"
  - "rust"
  - "git2"
  - "tree-sitter"
  - "rust-budget"
  - "mcp-tool"
---
[x] M1 · git·parse 크레이트 — 히스토리·blame·쿼리 실행·AstLite, 예산 1299/1500

## 추가 기능

**`crates/git`(383줄)** — `Repo::open`(discover, bare 거부) · `identity()`(부모 없는 커밋을 정렬해 `-` 로 이은 fingerprint + head, 커밋 0개면 `''`) · `tree_oids()`(HEAD 트리 path→blob oid) · `is_generated()`(`.gitattributes linguist-generated`) · `history()`(revwalk `TOPOLOGICAL|TIME`, first-parent 단순화 없음, 리네임 50, `ignore_whitespace`, `context_lines(0)`, `+` 줄을 범위로 압축) · `dropped()`(rebase 로 사라진 커밋) · `bytes()`(워크트리/rev) · `blame()` · `hash_bytes` · `looks_binary` · `lossy`.

`history()` 는 콜백을 받는다 — 콜백이 `false` 를 돌려주면 멈춘다. 취소 토큰이 들어올 자리이자, 커밋 2,000개 × 파일 목록을 한꺼번에 메모리에 들지 않는 이유다.

**`crates/parse`(358줄)** — `langs.rs` 표(typescript·tsx·javascript·sql, 각각 Cargo feature) · `compile()`(실패하면 `QueryInvalid{id,row,col}` 로 어느 사전 파일인지 말한다) · `scan()`(캡처 한 건 = 행 하나, `match_id` 로 묶임, `form` 은 `(#set! form)`, `in_error` 는 자기+조상 3단) · `quality_of()`(ERROR+MISSING 바이트 > 5% 또는 단일 ERROR 40줄 초과 → `poor`) · `ast()`(리프만 텍스트, 깊이 512).

## 동작 흐름

- 파서는 `thread_local` 이다(`Parser` 는 `Send` 지만 `Sync` 가 아니다). `Query` 는 `Send+Sync` 라 grammar 당 한 번 컴파일해 공유한다.
- 타임아웃: tree-sitter 0.25 는 `set_timeout_micros` 대신 `parse_with_options` 의 진행 콜백을 쓴다. 콜백이 경과 시간을 보고 `true` 를 돌려주면 파싱이 끊기고 `Timeout` 이 된다.
- `grammar_version` 은 크레이트 버전이 **아니다**. 의존 크레이트의 버전을 컴파일러가 알려 주지 않으므로 `<abi>-<node_kind_count>` 로 만든다. 문법이 재생성돼 노드 종류가 늘거나 줄면 바뀌므로 「증분 → 전체 승격」 신호로는 성립하지만, 같은 노드 집합을 유지한 패치 릴리스는 못 잡는다. `_lang.yaml.grammar_crate_version` 과 Cargo.lock 대조(03 §5.3)는 TS 스크립트 몫으로 남았다.
- blame 은 libgit2 에 중단 수단이 없다. `budget_ms` 는 **끝난 뒤** 검사해 결과를 버리는 사후 컷이라 벽시계 시간을 막지 못한다. TS 가 파일 하나씩 배경에서 부르는 전제(03 §1.5)로 버틴다.

## 문서와 달라진 것

`git_diff_text` 를 M4 로 미뤘다. 플랜 항목 제목(`01 · git 크레이트 — open/fingerprint/commits/commit_files/blob`)에 없고 읽는 쪽이 T2(M4)뿐인데, 줄 예산이 이 마일스톤의 실질 제약이라 55줄을 지금 쓰지 않는다.

## 예산

`crates/git ≤ 400`(383) · `crates/parse ≤ 450`(358) · 합계 1299/1500. 남은 201줄에 잡 러너와 명령 6종이 들어가지 않는다 — 앱 층 설계를 바꿔야 한다(다음 일지).

## 검증

- `cargo test --workspace` — git 16건 · parse 17건 · store 12건 전부 통과.
- `cargo clippy --workspace --all-targets -- -D warnings` 통과, `cargo fmt --check` 통과.
- `bash scripts/check-rust-budget.sh` → 1299/1500 · 금칙어 없음 · SQL 리터럴 없음 · git 바이너리 없음.
- 새 의존 12개 라이선스 전부 `deny.toml` allow 목록 안(MIT 또는 MIT OR Apache-2.0). `git2 0.21.0` 으로 열린 unsound 권고 3건을 피한다.