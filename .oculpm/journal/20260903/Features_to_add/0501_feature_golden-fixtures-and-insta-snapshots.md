---
schema_version: 1
type: feature
slug: "golden-fixtures-and-insta-snapshots"
status: done
difficulty: medium
created_at: "2026-09-03T05:01:15+09:00"
session_id: "20260903-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/parse/tests/golden.rs"
    op: create
  - path: "crates/parse/tests/insta.rs"
    op: create
  - path: "crates/parse/tests/support/mod.rs"
    op: create
  - path: "crates/parse/tests/snapshots/"
    op: create
  - path: "fixtures/golden/"
    op: create
  - path: "crates/parse/Cargo.toml"
    op: update
  - path: "eslint.config.js"
    op: update
  - path: ".gitignore"
    op: update
related: []
tags:
  - "parse"
  - "golden"
  - "insta"
  - "fixtures"
  - "03"
  - "06"
  - "mcp-tool"
---
[x] 골든 픽스처와 insta 캡처 스냅샷 — 문법 크레이트가 조용히 깨지는 것을 잡는 그물

## 추가 기능

`fixtures/golden/<문법>/<개념>/<케이스>` + `<케이스>.expected.json` 을 만들고, 그것을 돌리는
Rust 테스트 둘을 붙였다.

- **골든 픽스처 93케이스** (06 §1.2 의 캡처 목록 필드 그대로: `queryId·matchId·patternIndex·
  name·form·startLine·startCol·endLine·endCol·nodeKind·inError`).
  - `ts/` 12개념 × (양성 3 · 음성 2) = 60케이스 + 함정 3. 개념은 06 §1.2 의 12칸에 맞췄다 —
    선언 `const-declaration` · 호출 `call-expression` · 조건 `conditional-ternary` ·
    반복 `for-of` · 함수 `arrow-function` · 클래스 `_blocks` · import `_imports` ·
    에러 처리 `try-catch` · 컬렉션 `array-map-immutable` · 문자열 `template-literal` ·
    비동기 `async-await` · 타입 `generics`.
  - `tsx/` 4개념 × 3 + 함정 3 = 15케이스. `sql/` 4개념 × 3 + 함정 3 = 15케이스.
  - 케이스 코드는 사전 `examples` 를 베끼지 않고 장바구니·로그인·주문·재고 도메인의
    여러 줄짜리 코드로 새로 썼다.
- **`crates/parse/tests/golden.rs`** — 5테스트. `UPDATE_GOLDEN=1` 로 기대 파일을 다시 쓴다.
  어긋나면 파일·캡처 번호·양쪽 값을 찍는다. 구조 검사도 함께 한다(개념 수·함정 3 ·
  양성 3/음성 2 · 양성은 잡히고 음성은 0건 · 함정 3종).
- **`crates/parse/tests/insta.rs` + 스냅샷 45장** — TS·TSX·SQL 각 15케이스. 절대 경로가
  들어가지 않게 리포 뿌리 기준 상대 경로만 쓴다.
- 사전에 개념이 없는 SQL 과 함정 케이스는 옆의 `<케이스>.query.scm` 으로 돈다.
- `insta`·`serde_json` 을 `chickadee-parse` dev-dependency 로 추가(줄 예산 밖).
- `eslint.config.js` 에 `fixtures/golden/**` 무시 추가 — 골든은 일부러 미선언 식별자와
  파싱이 깨진 파일을 담는다. `.gitignore` 에 `*.snap.new`.

## 동작 흐름

케이스를 훑는다 → 옆의 `.query.scm` 이 있으면 그것, 없으면 `dictionary/<lang>/<개념>.scm` →
`compile` → `scan` → 캡처를 06 §1.2 의 11필드로 줄여 `.expected.json` 과 비교.
`ts` 디렉터리는 문법 `typescript`, `tsx` 는 `tsx`, `sql` 은 `sql` 이고 사전 언어는 `ts` 공용이다.

## 검증

- `cargo test -p chickadee-parse` — 40테스트 통과(golden 5 · insta 3 포함).
- `bash scripts/check-rust-budget.sh` — 2036/2100, 나머지 4항목 ok(테스트는 예산 밖).
- 그물이 도는지 직접 확인: 사전 `for-of.scm` 의 노드 이름을 한 글자 바꾸면 컴파일 실패로
  빨개지고, `array-map-immutable.scm` 의 `#eq? @hole "map"` 을 `"mapp"` 로 바꾸면
  컴파일은 되는데 0건이 되어 골든 5건이 빨개진다. 캡처 이름 하나만 바꾸면 골든과 insta
  스냅샷이 각각 그 한 줄만 diff 로 보여 준다. 전부 원상복구했다(`git diff dictionary/` 0줄).
- `cargo fmt`·`clippy` 는 내 파일에서 통과. 같은 시각에 다른 에이전트가 넣은
  `tests/evil.rs`·`tests/quality.rs`·`tests/dictionary.rs`·`benches/ingest.rs` 에는
  fmt·clippy 위반이 남아 있다 — 내 범위 밖이라 손대지 않았다.