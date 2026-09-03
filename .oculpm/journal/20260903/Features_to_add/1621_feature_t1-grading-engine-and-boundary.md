---
schema_version: 1
type: feature
slug: "t1-grading-engine-and-boundary"
status: done
difficulty: superhigh
created_at: "2026-09-03T16:21:09+09:00"
session_id: "20260903-006"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched: []
related: []
tags:
  - "m3"
  - "t1"
  - "grading"
  - "ast"
  - "golden"
  - "parse-snippet"
  - "mcp-tool"
---
[x] M3 · T1 판정 엔진(정렬·정규식·AST·이의·왜)과 그 경계 — 결정 D83~D92

## 추가 기능

### 경계 (스키마 · 트랜잭션 순서 · 의존 방향)

- **statement 13개** — `block.sql`(upsert·ast_set·get·by_file·retire_missing·candidates·card_concept_insert) · `appeal.sql`(appeal.insert_for_item·pattern_counts·by_pattern·for_item · why.insert_for_item·why.for_card). 124 → **137개**. 이름이 `why_answer.*` 가 아니라 `why.*` 인 이유는 `build-catalog.ts` 의 이름 정규식이 그룹에 `_` 를 허용하지 않기 때문이다.
- **`parse_snippet` (D87)** — `commands/repo.rs` +45줄. 인자를 낱개로 받고(`ingest_start` 만 구조체 하나다) `queries` 를 안 주면 파싱만 한다. `hadError` 는 유무만 주고 비율(≤ 20 % 게이트)은 TS 가 센다. Rust 예산 2,050 → **2,101 / 2,300**.
- **문법 크레이트 3종 추가** — `tree-sitter-python 0.23.6` · `tree-sitter-go 0.23.4` · `tree-sitter-rust 0.23.3`. 03 §2.1 이 이미 요구한 것인데 크레이트가 없어 04 §9 골든 26·27(py·go)이 AST 층에 닿지 못했다. `langs.rs` +6줄.
- **「판 완료」 tx 에 두 걸음 (D84)** — `why_answer INSERT → appeal INSERT×n` 을 맨 뒤에 붙인다. `last_insert_rowid()` 대신 `session_item_id` 부속질의를 쓴다.
- **문턱 (D83)** — `gradeFor`·`okFor` 에 `passPct`·`swap` 을 더하고 `advanceThreshold(total)` 를 `scheduler` 에 뒀다. 의존 표에 `grading → scheduler` 를 더했다(D90).
- **`CardPayload` t1 에 `blockId` (D92)** — `why_answer.block_id` 와 `block.ast_json` 캐시를 되찾을 열쇠. `card` 에는 블록 열이 없다.

### 엔진 (`packages/grading` — 파일 9개 + 테스트 2편)

`t1-types.ts`(사유 코드 19종) · `t1-prot.ts` · `t1-line.ts`(파이프라인 1~10 + `sim` + 거터 `evalLine`) · `t1-align.ts`(A·B·C(NW) + D91) · `t1-rename.ts`(3조건 + 검증 ④) · `t1-ast.ts`(문장 단위 승격 ⓐ~ⓗ) · `t1-result.ts`(조립·점수·판정·`toT1Detail`) · `t1-appeal.ts`(`patternKey`·카탈로그 5종·이슈 URL) · `t1-why.ts`(문항 선정 ①~④ + 검증 4조건).

**IPC 도 tree-sitter 도 들어 있지 않다.** 양쪽 AST 를 인자로 받으므로 `gradeT1` 은 동기이고, 골든이 픽스처 하나로 성립하며 비교 예산(20줄 < 20 ms)이 IPC 와 섞이지 않는다.

### 골든 28건 (04 §9)

`fixtures/golden/t1/cases.json`(케이스 + `requires`) + `ast/<id>.json`(22건, `crates/parse/tests/t1_ast.rs` 가 `UPDATE_GOLDEN=1` 로 굽는다) + `expected.json`(행 스냅샷). 두 겹으로 본다: `requires` 는 04 §9 표를 손으로 옮긴 것이라 규칙이 깨지면 그것이 깨지고, `expected.json` 은 무엇이 달라졌는지 diff 한 줄로 보인다.

문서의 한 줄짜리 조각은 그 줄이 성립하는 최소 블록으로 감쌌다 — `return`·`await`·`let` 은 함수 밖에서 파싱되지 않는다.

## 문서와 어긋나 고친 것 (등록부 D83~D92)

- **D83** 진급 문턱 하나 — 04 §4.6 은 소블록 완충을 「판정」에만 적었는데 `okFor` 는 평 85 였다. 12줄 블록의 10/12(83.3 %)가 04 기준으로는 `advance` 인데 원장에는 `ok=0` 이 적혔다. 셋(판정·`ok`·단계)을 한 문턱에 맞췄고, **정수로 반올림**하고 하한을 65 로 잡았다: 실수 문턱 83.333 은 `round(83.33)=83` 이 못 넘어 공식이 허락한 「두 줄」이 반올림에서 사라지고, 하한이 없으면 3줄 블록의 문턱이 33 이 되어 40 %가 합격이면서 동시에 「한 번 더」가 된다.
- **D84** 이의는 0~n 행이라 `last_insert_rowid()` 를 쓸 수 없다.
- **D85** `stageBefore` = **채점한 단계**. `rebuild.ts` 의 `ceilingCapOf` 와 `finishPlate` 가 같은 값을 봐야 재생이 캐시와 갈라지지 않는다.
- **D86** T1 은 `cards` 가 굽고 `grading` 이 잰다.
- **D91** 짝 없는 줄이 같은 자리에 마주 보면 강제로 짝짓는다. 04 §9 #28 의 Dice 가 0.44 라 §4.1 의 문턱 0.5 를 못 넘어 「누락 + 추가」로 갈렸다 — §4.1 의 문턱과 §9 의 기대가 서로 어긋나 있었다.

## 검증

- `npx vitest run` → **115파일 1,085테스트 통과**(그 중 `grading` 140, 골든 31).
- `UPDATE_GOLDEN=1 cargo test -p chickadee-parse --test t1_ast` → 1 passed, AST 픽스처 22건 (전부 `hadError=false`).
- `cargo test -p chickadee-parse` 17 passed · `cargo fmt --all --check` 무출력 · `bash scripts/check-rust-budget.sh` ok 2,101/2,300.
- `npx eslint .` 0 problems · `stylelint` 0 · `pnpm check:contrast` 46쌍 통과(최저 4.73 배지) · `pnpm check:motion` 위반 0 · `pnpm design:check` 통과.
- 성능 실측(vitest, Node): 거터 한 줄 **0.04 ms**(예산 0.2) · 비교 엔진 20줄 **~1 ms**(20) · 40줄 **~2 ms**(35).