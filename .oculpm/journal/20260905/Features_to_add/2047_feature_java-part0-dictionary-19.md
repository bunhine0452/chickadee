---
schema_version: 1
type: feature
slug: "java-part0-dictionary-19"
status: done
difficulty: high
created_at: "2026-09-05T20:47:09+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/java/value-bits.yaml"
    op: create
  - path: "dictionary/java/value-bits.scm"
    op: create
  - path: "dictionary/java/integer-limit.yaml"
    op: create
  - path: "dictionary/java/integer-limit.scm"
    op: create
  - path: "dictionary/java/floating-type.yaml"
    op: create
  - path: "dictionary/java/floating-type.scm"
    op: create
  - path: "dictionary/java/float-inexact.yaml"
    op: create
  - path: "dictionary/java/float-inexact.scm"
    op: create
  - path: "dictionary/java/string-literal.yaml"
    op: create
  - path: "dictionary/java/string-literal.scm"
    op: create
  - path: "dictionary/java/text-length.yaml"
    op: create
  - path: "dictionary/java/text-length.scm"
    op: create
  - path: "dictionary/java/boolean-only-condition.yaml"
    op: create
  - path: "dictionary/java/boolean-only-condition.scm"
    op: create
  - path: "dictionary/java/operator-precedence.yaml"
    op: create
  - path: "dictionary/java/operator-precedence.scm"
    op: create
  - path: "dictionary/java/string-concat.yaml"
    op: create
  - path: "dictionary/java/string-concat.scm"
    op: create
  - path: "dictionary/java/implicit-conversion.yaml"
    op: create
  - path: "dictionary/java/implicit-conversion.scm"
    op: create
  - path: "dictionary/java/explicit-conversion.yaml"
    op: create
  - path: "dictionary/java/explicit-conversion.scm"
    op: create
  - path: "dictionary/java/autoboxing.yaml"
    op: create
  - path: "dictionary/java/autoboxing.scm"
    op: create
  - path: "dictionary/java/reference-binding.yaml"
    op: create
  - path: "dictionary/java/reference-binding.scm"
    op: create
  - path: "dictionary/java/reference-equality.yaml"
    op: create
  - path: "dictionary/java/reference-equality.scm"
    op: create
  - path: "dictionary/java/_lang.yaml"
    op: update
  - path: "dictionary/java/arithmetic.yaml"
    op: update
  - path: "dictionary/java/arithmetic.scm"
    op: update
  - path: "dictionary/java/variable-declaration.yaml"
    op: update
  - path: "dictionary/java/boolean-literal.yaml"
    op: update
  - path: "dictionary/java/assignment.yaml"
    op: update
  - path: "dictionary/java/comparison.yaml"
    op: update
  - path: "dictionary/java/null.yaml"
    op: update
  - path: "dictionary/java/equals-hashcode.yaml"
    op: update
  - path: "fixtures/golden/java"
    op: create
  - path: "crates/parse/tests/golden.rs"
    op: update
  - path: "packages/course/src/curriculum.ts"
    op: update
  - path: "packages/course/src/curriculum.test.ts"
    op: update
  - path: "docs/curriculum/java.md"
    op: update
related: []
tags:
  - "dictionary"
  - "java"
  - "curriculum"
  - "golden"
  - "D177"
  - "D186"
  - "mcp-tool"
---
[x] 자바 0부 「값과 식」 19판 사전을 실물로 세웠다

## 추가 기능

`docs/curriculum/java.md` §1.5 가 명세로만 갖고 있던 0부를 `dictionary/java/**` 에 실물로 옮겼다.

- **신규 개념 14장**(`.yaml` + `.scm`): `value-bits` · `integer-limit` · `floating-type` ·
  `float-inexact` · `string-literal` · `text-length` · `boolean-only-condition` ·
  `operator-precedence` · `string-concat` · `implicit-conversion` · `explicit-conversion` ·
  `autoboxing` · `reference-binding` · `reference-equality`.
- **기존 5장 갱신**: `variable-declaration` · `boolean-literal` · `arithmetic` · `assignment` ·
  `comparison` — `cs/` 간선을 §1.5.1 표대로 붙이고 `examples` 를 값을 든 예로 갈았다.
  `arithmetic.scm` 에 `/` 를 넣었다(0부 축 E 가 정수 나누기를 겸한다 — §1.5.6 조각 표).
- **`_lang.yaml`**: `essential` 29 → 41. 0부 17 → 1부 8 → 2부 16 순서로 다시 썼다.
  `string-concat`·`autoboxing` 둘은 0부 `essential` 상한 열둘(README §12 규약 8) 때문에 밖에 뒀다.
- **골든 65케이스**(13개념 × 양성 3 · 음성 2) + `expected.json` 65. `golden.rs` 의 java 하한 13 → 34.
- **`packages/course`**: `PartNo` 에 `0` 이 늘고 `JAVA_PARTS` 에 0부가 앞에 섰다 —
  java.md §1.5.5 가 인계로 적어 둔 자리다.

## 동작 흐름

각 장은 `one_liner`(ko+en) → `why` → `trace` → `rule` → `misconceptions`(java-learning.md §12 의
오개념을 「그 답이 참이 되는 조건」 모양으로) → 문항(`point`/`blank`/`meaning`) → `why_gate` →
`queries` → 값을 든 `examples` 넷 순서다. `examples[].code` 의 꼬리 주석
`// 식 -> 값 (타입)` 이 `docs/program/fundamentals.md` §8 이 요구한 세 칸이고,
`expect` 는 스키마가 strict 인 데다 Rust 시험이 실제 캡처와 대조하므로 값을 실을 자리가 없어
주석으로 갔다. 사용처가 0이거나 얇은 여섯은 `universal` 을 안 걸거나(전이가 거짓이 되는 자리)
`common/integer-literal`·`common/float-literal` 로만 걸었다.

## 검증

`pnpm dict:lint`(16 통과 · 부채 표 java 항목 0) · `pnpm typecheck` · `pnpm lint` ·
`pnpm test:unit`(195 파일 2428 통과) · `cargo test -p chickadee-parse`(골든 65 포함 전량 통과).
표본 리포 MonggleMonggle(99파일, 읽기만)에 19개 `.scm` 을 실제로 돌려 곳/파일을 쟀고,
java.md §1.5.3 의 정규식 값과 다른 자리 둘(`text-length` 0→7 · 캐스트 문법 4곳이 전부 참조
다운캐스트)을 문서에 정정 표로 적었다.

## 메모

`packages/cards/src/t0-synthetic.ts` 의 `ABSENCE` 표에 여섯 행이 필요하다(범위 밖이라 안 건드림).
`courseOutline` 의 `foldPart1` 이 0부도 접을지는 코스 화면의 결정이라 남겨 뒀다.