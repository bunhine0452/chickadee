---
schema_version: 1
type: feature
slug: "bottom-concepts-eight-pairs"
status: done
difficulty: high
created_at: "2026-09-04T17:47:18+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/common/boolean-value.yaml"
    op: create
  - path: "dictionary/common/comparison.yaml"
    op: create
  - path: "dictionary/common/arithmetic.yaml"
    op: create
  - path: "dictionary/common/reassignment.yaml"
    op: create
  - path: "dictionary/common/function-definition.yaml"
    op: create
  - path: "dictionary/common/return-value.yaml"
    op: create
  - path: "dictionary/common/loop-while.yaml"
    op: create
  - path: "dictionary/ts/boolean-literal.yaml"
    op: create
  - path: "dictionary/ts/comparison.yaml"
    op: create
  - path: "dictionary/ts/arithmetic.yaml"
    op: create
  - path: "dictionary/ts/reassignment.yaml"
    op: create
  - path: "dictionary/ts/function-declaration.yaml"
    op: create
  - path: "dictionary/ts/return-statement.yaml"
    op: create
  - path: "dictionary/ts/while-loop.yaml"
    op: create
  - path: "dictionary/ts/if-statement.yaml"
    op: update
  - path: "dictionary/ts/_lang.yaml"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "fixtures/golden/ts"
    op: create
related:
  - ref: "20260904/Features_to_add/1727_feature_exercism-as-concept-list-source.md"
    kind: "followup"
tags:
  - "사전"
  - "D147"
  - "D148"
  - "0장"
  - "골든"
  - "mcp-tool"
---
[x] 바닥 개념 여덟 짝 완성 — 0장 후보가 12 → 21 이 됐고, 빈칸 오답 규칙의 사각을 찾았다

## 추가 기능

D148 로 목록을 정한 뒤 바닥 개념 **여덟 짝**(보편 + TS)을 다 짰다. `ts/if-statement` 는 앞 일지에서 했고 이번에 일곱을 더했다.

| 깊이 | ts | common |
|---|---|---|
| 0 | `reassignment` · `boolean-literal` · `arithmetic` · `function-declaration` · `if-statement` | `reassignment` · `boolean-value` · `arithmetic` · `function-definition` · `conditional-branch` |
| 1 | `comparison` · `return-statement` | `comparison` · `return-value` |
| 2 | `while-loop` | `loop-while` |

## 동작 흐름 — 0장이 실제로 담게 되는 것

`essential` 30개의 선행 깊이를 집합 안에서 다시 재 봤다.

```
깊이 0 · 9   깊이 1 · 6   깊이 2 · 6   |  깊이 3 · 5   깊이 4 · 3   깊이 5 · 1
└────────── 0장 후보 21 ──────────┘     └──── 0장 밖 9 ────┘
```

**0장 후보 21, 상한 24.** D147 이 깊이 2 를 고른 근거가 「후보가 상한 언저리에 와서 자르는 규칙이 거의 일하지 않는 값」이었는데 실제로 그 자리에 앉았다. 바닥도 의도대로다 — 깊이 0 에 조건문·함수 정의·참거짓·셈·다시 넣기가 `const` 와 리터럴들과 나란히 선다.

## 린트가 잡은 것 45건

둘 다 이 리포의 규칙이 제대로 일한 자리다.

**① `josa-filter` 31건.** `{{pick.2|code}} 와` 처럼 변수 바로 뒤에 조사를 그냥 붙였다. 값이 `res.user` 인지 `'손님'` 인지에 따라 조사가 달라지므로 반드시 틀린다. 규칙이 `\}\}\s*(은|는|이|가|을|를|과|와|으로|로)` 라 기계적으로 고칠 수 있어 고치개를 써서 **44곳**을 `{{X|code}}{{X|josa:과,와}}` 꼴로 바꿨다.

**② `blank-wrong-from-confusions` 14건 — 여기서 규칙의 사각을 봤다.** 규칙은 「빈칸 오답은 `confusions` 에 적은 개념의 `token` 이라야 한다」인데, **키워드 구멍의 좋은 오답이 대개 개념으로 존재하지 않는다** — `let` · `var` · `switch` · `class` · `break` · `throw` · `yield` · `+=` 중 사전에 있는 것이 하나도 없다. 그렇다고 이것들을 개념으로 만들면 사전이 오답을 위해 부풀어 오른다.

규칙은 `confusions` 가 비면 검사를 건너뛰고, `ts/const-declaration`(오답 `let`·`var`·`readonly`)이 이미 그 선례다. 그래서 갈랐다:

- **제대로 묶은 셋** — `comparison`(오답 `=` `=>` `&&`) · `arithmetic`(`===` `=` `&&`) · `reassignment`(`===` `=>` `+`). 오답이 전부 실제 개념 토큰이다. `reassignment` 의 오답은 원래 `+=` 였는데 개념이 없어 **`+`(ts/arithmetic)로 바꿨다** — 「값을 만들 뿐 어디에도 담지 않는다」가 되어 교훈이 오히려 또렷해졌다.
- **`confusions: []` 로 둔 넷** — `if-statement`(`while`·`for`·`switch`) · `while-loop`(`if`·`for`·`switch`) · `function-declaration`(`const`·`class`·`return`) · `return-statement`(`break`·`throw`·`yield`). 사유를 파일마다 주석으로 남겼다.

래칫은 D145 대로 대상 전량으로 올려 잠갔다 — `blank-or-reason` 24→**31** · `point-picks` 26→**31** · `why-gate` 24→**31** · `zero-one-liner` 12→**18**.

## 골든 픽스처 40장

`crates/parse/tests/golden.rs` 가 개념마다 **양성 3 · 음성 2** 를 강제한다(처음에 2·1 로 냈다가 걸렸다). 여덟 개념 × 5 = 40장을 `UPDATE_GOLDEN=1` 로 굽고 눈으로 봤다.

- **음성 16장 전부 `[]`** — 쿼리가 안 잡아야 할 것을 안 잡는다. 값 있는 음성들이다: `"true"` 따옴표 · `this.count = n`(속성 쓰기라 이름 재대입이 아님) · 화살표 함수 짧은 꼴(`return` 낱말 없음) · 삼항(흐름을 안 가름) · `for…of`(되풀이지만 다른 문법) · `switch`.
- **양성 24장** — `site` 의 `nodeKind` 와 픽 수를 전부 대조했다. `return;` 은 픽 1, `return x` 는 픽 2, `else` 붙은 갈림은 픽 4 로 선택 캡처가 의도대로 동작한다.

## 검증

`cargo test -p chickadee-parse` 전량 통과(골든 포함) · `pnpm dict:lint` 13/13, 부채 표 네 규칙 모두 래칫에 잠김 · `pnpm typecheck` 무출력 · **TS 전체 1,977건 / 177 파일 전량 통과**. 앞 일지에서 다른 세션 것이라 적었던 UI 시험 실패도 지금은 없다 — 그쪽이 자기 시험을 따라잡았다.