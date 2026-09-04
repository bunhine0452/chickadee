---
schema_version: 1
type: feature
slug: "exercism-as-concept-list-source"
status: done
difficulty: medium
created_at: "2026-09-04T17:27:06+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/03-ingest-parsing-dictionary.md"
    op: update
  - path: "dictionary/common/conditional-branch.yaml"
    op: create
  - path: "dictionary/ts/if-statement.yaml"
    op: create
  - path: "dictionary/ts/if-statement.scm"
    op: create
  - path: "dictionary/ts/_lang.yaml"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/1707_feature_canon-opens-to-first-time-programmers.md"
    kind: "followup"
tags:
  - "사전"
  - "D148"
  - "D147"
  - "외부재료"
  - "0장"
  - "mcp-tool"
---
[x] Exercism 을 개념 목록의 출처로 붙였다 — 간선은 안 가져온다 (D148), 첫 바닥 개념 ts/if-statement

## 추가 기능

D147 이 만든 일 — 바닥 개념 사전을 채워야 하는데 **목록과 순서를 무엇에 근거해 정하나**. 사용자 결정으로 Exercism 을 붙인다. 등록부 **D148** 이 먼저 올라갔다.

## 실제로 받아 본 것

`github.com/exercism/{javascript,typescript}` 의 `config.json` 을 받아 개념 그래프를 뽑았다. 라이선스는 **MIT · © 2021 Exercism**(`LICENSE` 확인).

- **JS 트랙** — 개념 연습 30 · 개념 37. 깊이 0~3 이 `basics · booleans · numbers · strings · arithmetic-operators · arrays · comparison · conditionals · for-loops · while-loops · increment-decrement`.
- **TS 트랙** — 개념 연습 **1**. 쓸 것이 없다. TS 사전의 참고 출처는 JS 트랙이다.

## 가져오는 것과 안 가져오는 것 (D148 의 핵심)

**목록은 가져오고 `prerequisites` 간선은 안 가져온다.** 뜻이 다르다 — 그쪽은 *연습문제를 여는 조건*이고 우리 `prereq` 는 *개념 이해의 선행*(03 §3.1)이다. 반례 하나로 충분하다:

```
d6  functions  <- objects, arrays, null-undefined
```

함수가 배열보다 어려워서가 아니라 그 연습이 객체·배열을 다루기 때문이다. 간선을 베끼면 **함수 정의가 0장(깊이 ≤ 2, D147)에 영영 못 들어온다** — D147 이 바닥이라 지목한 바로 그 개념이.

거꾸로 목록 쪽은 **독립 검증**이 됐다. D147 은 우리 개념 50개를 훑어 「식 수준만 있고 문 수준이 0개」라고 판정했는데, 남이 실제로 가르치는 깊이 0~3 도 같은 자리였다.

산문은 안 베낀다. 개념 이름과 목록은 사실의 나열이지만 `about.md` 문장을 가져오면 MIT 고지 의무가 생기고, `THIRD_PARTY_NOTICES.md` 는 **생성 파일**이라(「Do not edit it by hand」) 손으로 넣을 자리도 아니다. 베끼게 되면 D148 을 고쳐 자리를 새로 만든다.

progmiscon.org(오개념 247건)는 내용이 더 맞지만 **재사용 라이선스 명시가 없어** 안 쓴다. 인용 요청만 있고 조건이 없으면 기본 저작권이다.

## 정한 목록 (우리 축으로 다시 매긴 선행)

깊이는 `essential` 집합 안에서 센다. 여덟 짝 전부 0장 상한 2 안에 든다.

| 깊이 | ts | common(보편) |
|---|---|---|
| 0 | `let-reassign` · `boolean-literal` · `arithmetic` · `function-declaration` · **`if-statement`** | `reassignment` · `boolean-value` · `arithmetic` · `function-definition` · **`conditional-branch`** |
| 1 | `comparison` · `return-statement` | `comparison` · `return-value` |
| 2 | `while-loop` | `loop-while` |

`if-statement` 의 `prereq` 를 비워 뿌리로 뒀다 — 조건은 사용자 코드에 이미 참·거짓으로 서 있고, 비교(`comparison`)를 선행으로 걸면 깊이만 늘고 얻는 것이 없다.

## 첫 짝을 실제로 짰다

`common/conditional-branch.yaml` · `ts/if-statement.yaml` · `ts/if-statement.scm` · `_lang.yaml` `essential` 배선.

`.scm` 은 `const-declaration.scm` 과 같은 방식으로 키워드 익명 노드를 잡는다(`"if" @pick.1 @hole`). `else_clause` 는 `?` 로 선택. `crates/parse/tests/dictionary.rs` 가 `examples` 로 실제 매칭을 검증했다 — 양성 2(else 있는 것·없는 것) · 음성 1(삼항은 안 잡힌다).

**린트가 두 번 잡았다.** 둘 다 이 리포의 규칙이 실제로 일한 자리다:
1. `one_liner` **태그 뺀 80자 상한** — 처음 쓴 `en` 이 넘었다.
2. `diagnosis-not-verdict` — `why_gate` 피드백의 `what would go wrong` 이 `\b(wrong|incorrect|failed)\b` 에 걸렸다. 정본 §3-2 「진단은 판정이 아니다」가 en 에도 걸려 있다.

부채 표는 네 규칙 모두 새 개념을 통과시켰고, D145 규칙대로 **래칫을 올려 잠갔다** — `blank-or-reason` 23→24 · `point-picks` 25→26 · `why-gate` 23→24 · `zero-one-liner` 11→12.

## 검증

`cargo test -p chickadee-parse` 전량 통과(쿼리 5건 포함) · `pnpm dict:lint` 13/13 통과 · `pnpm typecheck` 무출력 · 내가 건드린 영역(`packages/concepts` · `packages/dictionary` · `packages/cards` · `flow.test.tsx`) 521건 전량 통과.

전체 실행에는 실패가 더 있는데 **내 것이 아니다** — `empty.tsx`·`packages/i18n/**`·`HomeScreen` 이 이 턴 도중(17:24:50)에 다른 세션에서 바뀌었다. 새 문구(「변수」·「함수」가 처음이어도 됩니다…)와 두 번째 스위치가 들어왔고 그쪽 시험이 아직 옛 문구를 붙들고 있다. 플랜 A(`a-scope-copy`·`a-ask`)를 병렬로 하는 중으로 보이며, 그 파일들은 손대지 않았다.