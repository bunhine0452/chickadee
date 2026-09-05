---
schema_version: 1
type: feature
slug: "ts-part-zero-21-plates"
status: done
difficulty: high
created_at: "2026-09-05T20:42:27+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/ts/value-bits.yaml"
    op: create
  - path: "dictionary/ts/value-bits.scm"
    op: create
  - path: "dictionary/ts/number-is-double.yaml"
    op: create
  - path: "dictionary/ts/number-is-double.scm"
    op: create
  - path: "dictionary/ts/float-inexact.yaml"
    op: create
  - path: "dictionary/ts/float-inexact.scm"
    op: create
  - path: "dictionary/ts/integer-division.yaml"
    op: create
  - path: "dictionary/ts/integer-division.scm"
    op: create
  - path: "dictionary/ts/text-length.yaml"
    op: create
  - path: "dictionary/ts/text-length.scm"
    op: create
  - path: "dictionary/ts/truthy-falsy.yaml"
    op: create
  - path: "dictionary/ts/truthy-falsy.scm"
    op: create
  - path: "dictionary/ts/operator-precedence.yaml"
    op: create
  - path: "dictionary/ts/operator-precedence.scm"
    op: create
  - path: "dictionary/ts/implicit-conversion.yaml"
    op: create
  - path: "dictionary/ts/implicit-conversion.scm"
    op: create
  - path: "dictionary/ts/explicit-conversion.yaml"
    op: create
  - path: "dictionary/ts/explicit-conversion.scm"
    op: create
  - path: "dictionary/ts/reference-sharing.yaml"
    op: create
  - path: "dictionary/ts/reference-sharing.scm"
    op: create
  - path: "dictionary/ts/loose-equality.yaml"
    op: create
  - path: "dictionary/ts/loose-equality.scm"
    op: create
  - path: "dictionary/ts/_lang.yaml"
    op: update
  - path: "dictionary/ts/_imports.scm"
    op: update
  - path: "fixtures/golden/ts/value-bits/"
    op: create
  - path: "fixtures/golden/ts/number-is-double/"
    op: create
  - path: "fixtures/golden/ts/float-inexact/"
    op: create
  - path: "fixtures/golden/ts/integer-division/"
    op: create
  - path: "fixtures/golden/ts/text-length/"
    op: create
  - path: "fixtures/golden/ts/truthy-falsy/"
    op: create
  - path: "fixtures/golden/ts/operator-precedence/"
    op: create
  - path: "fixtures/golden/ts/implicit-conversion/"
    op: create
  - path: "fixtures/golden/ts/explicit-conversion/"
    op: create
  - path: "fixtures/golden/ts/reference-sharing/"
    op: create
  - path: "fixtures/golden/ts/loose-equality/"
    op: create
  - path: "fixtures/golden/ts/_imports/pos-await-type-arguments.ts"
    op: create
  - path: "docs/curriculum/ts.md"
    op: update
related: []
tags:
  - "dictionary"
  - "ts"
  - "part-zero"
  - "golden"
  - "tree-sitter"
  - "mcp-tool"
---
[x] TS 0부 「값과 식」 21판을 사전으로 세우고, _imports 의 타입 인자 await 구멍을 막았다

## 추가 기능

`docs/curriculum/ts.md` §1.5 의 0부 21판 중 **사전에 없던 열한 장**을 YAML + `.scm` + 골든으로 세웠다 — `value-bits` · `number-is-double` · `float-inexact` · `integer-division` · `text-length` · `truthy-falsy` · `operator-precedence` · `implicit-conversion` · `explicit-conversion` · `reference-sharing` · `loose-equality`. 나머지 열 장은 이미 있던 것이라 한 줄도 안 고쳤다.

함께 한 것 넷.

1. `_lang.yaml` 의 `essential` 을 0부 21 → 1부 12 → 2부 8 순서로 다시 세웠다(41줄). 0부 안에서는 **사용처가 얇은 판을 둘 이상 잇대지 않는다** — `ts-learning.md` §11.6 ⑥ 이 지적한 「축 A·B 가 붙어 사흘 내리 「네 코드엔 없다」만 나온다」를 막는 배치 규칙이고, 얇은 아홉이 3·5·8·10·12·14·16·18·21 번째에 놓인다.
2. `alternatives` 에 `gap: ts/comparison, present: ts/loose-equality` 를 더했다. `ECC` 는 410파일에 느슨한 쪽이 **1곳**, `ai-pm` 은 613파일에 **390곳**이다.
3. `_imports.scm` — 타입 인자가 붙은 `await` 호출이 **한 건도 안 잡히던** 구멍을 막았다. tree-sitter-typescript 는 타입 인자가 있으면 `await api.get<User>("/x")` 를 `(await api.get)<User>("/x")` 로 접어 `call_expression` 의 `function:` 자리에 `await_expression` 을 넣는다. 일곱 패턴의 `function:` 을 두 갈래 대안으로 넓혔다 — 패턴 수는 그대로라 기존 골든의 `patternIndex` 가 안 바뀌었다.
4. `docs/curriculum/ts.md` §1.5.1 축 표 여덟에 「사전」 열을 붙이고, §1.5.3-a 로 tree-sitter 실측을 적었다. §1.5.6 에는 D187 ⑰(선행 뒤집기)이 **지금 걸 자리가 없다**는 사실과 그 근거를 적었다.

## 동작 흐름

개념마다 `.scm` 이 사용처를 잡고 → `examples[]` 가 그 캡처를 못박고(`cargo test -p chickadee-parse --test dictionary`) → 골든 다섯 장(양성 3 · 음성 2)이 문법 업그레이드 회귀를 잡는다. 문항은 지목형 + 뜻 고르기가 기본이고 빈칸형은 셋(`value-bits` `operator-precedence` `loose-equality`)뿐이다 — 나머지 여덟은 구멍이 표준 라이브러리 이름이거나 한 글자라 `no_hole_reason` 으로 사유를 적었다.

`ts/implicit-conversion` 은 두 표본 1,035파일에서 캡처가 **0곳**이다. 없어서가 아니라 두 피연산자의 타입을 알아야 해서 정적으로 보이는 자리가 0곳이다(쿼리는 한쪽이 리터럴인 식만 잡는다). 사유는 `idiom` — 그 자리를 명시 변환이 가져갔다(537곳/255곳). `_lang.yaml` 에 그 사유를 적었고, `packages/cards/src/t0-synthetic.ts` 의 `ABSENCE` 표 한 줄은 그 파일이 이 세션의 소유가 아니라 범위 밖 요청으로 남겼다.

선행은 0부가 1부보다 앞이라는 배치(§1.5.4)에 맞춰 **1부 개념을 선행으로 걸지 않았다** — `text-length` 에서 `ts/property-access`, `integer-division`·`explicit-conversion` 에서 `ts/call-expression`, `truthy-falsy` 에서 `ts/if-statement` 를 뺐다. 그 결과 0부 21판이 전부 선행 깊이 ≤ 2 라 0장 후보에 든다.

## 검증

`pnpm dict:lint` 초록(부채 표 104/104 · 100/101 · 104/104 · 95/95 — 남은 하나는 기존 `ts/call-expression`) · `pnpm typecheck` · `pnpm lint` 초록 · `cargo test -p chickadee-parse` 49건 전부 초록(골든 5 · dictionary 6 포함). `pnpm test:unit` 은 195파일 중 `packages/course/src/curriculum.test.ts` 하나만 빨간데 그것은 병행 세션의 자바 `essential` 과 `JAVA_PARTS` 가 아직 안 맞아서다 — 이 세션의 파일과 무관하다.

## 메모

실측(tree-sitter, `ECC` js/jsx 410파일 · `ai-pm` ts 322 + tsx 291 = 613파일)에서 문서의 정규식 수와 크게 갈린 자리 넷: `string-literal`(정규식이 문자열을 먼저 지우고 셌다) · `number-is-double`(근거를 `Number.MAX_SAFE_INTEGER` 계열까지 넓혀 ECC 52곳) · `implicit-conversion`(못 쟀다 → 0곳) · `reference-sharing`(펼치기 대신 별칭 선언). `loose-equality` 는 문서와 붙는다(1곳 대 390곳).