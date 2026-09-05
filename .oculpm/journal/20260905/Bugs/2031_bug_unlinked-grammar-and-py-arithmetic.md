---
schema_version: 1
type: bug
slug: "unlinked-grammar-and-py-arithmetic"
status: done
difficulty: high
created_at: "2026-09-05T20:31:00+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/dictionary/src/schema.ts"
    op: update
  - path: "packages/dictionary/src/lint.ts"
    op: update
  - path: "packages/dictionary/src/lint.test.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "packages/dictionary/src/index.ts"
    op: update
  - path: "crates/parse/tests/quality.rs"
    op: update
  - path: "dictionary/py/arithmetic.scm"
    op: update
  - path: "dictionary/py/arithmetic.yaml"
    op: update
  - path: "dictionary/common/integer-literal.yaml"
    op: create
  - path: "dictionary/common/float-literal.yaml"
    op: create
  - path: "dictionary/common/truthiness.yaml"
    op: create
  - path: "dictionary/common/number-literal.yaml"
    op: update
  - path: "dictionary/cs/operator-precedence.yaml"
    op: create
  - path: "dictionary/cs/type-conversion.yaml"
    op: create
  - path: "dictionary/schema/concept.schema.json"
    op: update
  - path: "docs/curriculum/README.md"
    op: update
  - path: "docs/curriculum/cs.md"
    op: update
related: []
tags:
  - "dictionary"
  - "parse"
  - "lint"
  - "D187"
  - "curriculum"
  - "mcp-tool"
---
[x] 파서 미링크 문법과 py/arithmetic 오검출 — 조용히 틀리던 둘을 게이트로

## 발생 원인

**결함 하나 — 파서 없는 문법이 조용히 통과한다.** `grammarSchema`(TS)는 문법 **이름의 규약**(D19)이라 크레이트가 없는 `c_sharp`·`swift`·`dart`·`c`·`cpp` 도 받는다. 사전이 `grammars: [c_sharp]` 를 걸면 스키마도 로드도 린트도 통과하고 **캡처만 0곳**인데, 0곳은 화면에서 「사용처가 없는 리포」와 구별되지 않는다. 그 사실을 지키던 못(`crates/parse/tests/quality.rs`)은 `swift`·`dart` **두 이름만** 봤다 — C# 문법은 아무 경고 없이 들어올 수 있었고, 반대 방향(사전이 이름을 거는 것)은 아예 막는 것이 없었다. 하드코딩이 둘이었고 그 둘이 서로를 안 봤다.

**결함 둘 — `py/arithmetic` 사용처의 대부분이 셈이 아니다.** `arithmetic.scm` 이 `binary_operator` 를 그대로 잡는데 tree-sitter 는 타입을 모른다. `docs/plan/python-axis.md` §1.7 이 「1,815곳 중 933곳(51 %)」으로 적었는데 그 셈은 이미 쿼리에서 빠진 `//`·`|` 를 포함하고, 경로 결합은 **우변이 문자열 리터럴인 것만** 셌다. 지금 쿼리(`+ - * / %`)로 사용자 리포 셋을 다시 재니 오검출은 **1,621곳 중 1,350곳(83.3 %)** 이었다 — `/` 1,166곳 중 1,145곳이 `pathlib` 경로 결합이다. 그 자리에서 카드가 나오면 학습자는 「나누기는 늘 소수를 낸다」를 읽으면서 `Path / "config.json"` 을 본다.

## 해결 방법

**① 문법 링크 상태를 표 하나로.** `schema.ts` 의 `grammarSchema` 를 `GRAMMARS`(문법 키 → 링크됐나) 표에서 유도하고 `isLinkedGrammar`·`UNLINKED_GRAMMARS` 를 함께 낸다. 그 위에 못 둘:

- `lint.ts` 의 새 규칙 `grammar-not-linked` — `_lang.yaml` 이나 개념이 안 링크된 문법을 걸면 **오류**.
- `quality.rs` 의 `the_dictionary_schema_agrees_with_the_grammars_actually_linked` — 그 표를 `chickadee_parse::languages()` 와 **양방향**으로 대조. `swift`·`dart` 하드코딩은 지웠다.

**② `arithmetic.scm` 을 피연산자 종류 열거로.** tree-sitter 쿼리에 부정이 없어 「글자가 아닌 것」을 못 적는다 — 셈이 될 수 있는 종류를 적는 쪽으로 뒤집었다. 나누기만 패턴을 갈라 우변을 `(integer)·(float)·(call)` 로 좁혔다(경로 조각은 글자·f-문자열·이름이고, 나눗셈의 우변은 숫자나 계산 결과다 — `sum(xs) / len(xs)` 는 남고 `WORKSPACE / cat` 는 빠진다). 텍스트 술어(`#not-match?`)는 안 썼다 — 새는 자리가 조용하다. 음성 골든 다섯을 더해 되돌림을 막았다.

**③ 사전 다섯 신설 + 하나 비추천 (D187 ④⑤⑥).** `common/{integer-literal,float-literal,truthiness}` · `cs/{operator-precedence,type-conversion}`(43→45장). `common/number-literal` 은 지우지 않고 새 필드 `superseded_by` 로 표시했다 — 개념 id 는 원장 `concept` 행의 키이고 겹이 거기 쌓이므로(D4) 지우면 이미 배운 사람의 겹이 갈 곳을 잃는다. 기존 참조(`ts/number-literal` 의 `universal`)는 그대로 돈다. 린트가 막는 것은 새 참조 하나뿐이다(`superseded-target`).

## 검증

- 미링크 검출: `c_sharp: false` 를 `true` 로 바꿔 `quality.rs` 가 빨개지는 것을 확인하고 되돌렸다. `lint.test.ts` 에 C# 사전을 흉내 낸 `_lang.yaml`·개념 둘이 `grammar-not-linked` 로 걸리는 시험을 세웠다(26개 통과).
- `py/arithmetic` 실측(adelie·ECC·MonggleMonggle · py 218파일): 사용처 **1,621 → 277**, 정밀도 **16.7 % → 94.9 %**, 진짜 셈 271 → 259(잃은 12곳은 우변이 이름인 나눗셈이라 경로 결합과 노드가 같다). 골든 10개(양성 3 · 음성 7)를 실제로 돌려 전부 선언대로 나오는 것을 확인했다.
- `cargo test -p chickadee-parse`(dictionary·quality·golden·insta 전부) 초록 · `pnpm typecheck` 초록 · `bash scripts/check-rust-budget.sh` 초록 · `t0-proto.test.ts` 가 `cs/` **45장** 전량에서 뜻 고르기 판을 낸다.
- `pnpm dict:lint` 는 병렬 세션(java·ts·sql)의 진행 중 파일 때문에 빨갛다. 위반 목록에 내 개념은 **하나도 없다**(`at` 값이 java/·sql/·ts/ 뿐).

## 메모

`docs/plan/python-axis.md` §1.7 과 `docs/curriculum/py.md` §2 ⓑ 는 아직 51 % 를 「지금 있는 버그」로 적고 있다 — 내 소유 밖이라 안 고쳤다. `dictionary/_glossary.en.yaml` 에도 새 개념 다섯의 ko→en 행이 없다(그 파일은 로더가 안 읽는다).