---
schema_version: 1
type: feature
slug: "python-bottom-eight"
status: done
difficulty: high
created_at: "2026-09-04T19:59:52+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/py/_lang.yaml"
    op: update
  - path: "dictionary/py/boolean-literal.yaml"
    op: create
  - path: "dictionary/py/arithmetic.yaml"
    op: create
  - path: "dictionary/py/comparison.yaml"
    op: create
  - path: "dictionary/py/while-loop.yaml"
    op: create
  - path: "dictionary/py/function-definition.yaml"
    op: create
  - path: "dictionary/py/return-statement.yaml"
    op: create
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/1951_feature_python-reaches-the-parser.md"
    kind: "followup"
tags:
  - "D152"
  - "파이썬"
  - "사전"
  - "mcp-tool"
---
[x] 파이썬 바닥 여덟 — 개념마다 파이썬이라서 다른 것 하나씩 (D152)

## 추가 기능

바닥 여덟이 다 섰다 — `assignment` · `boolean-literal` · `arithmetic` · `comparison` · `if-statement` · `while-loop` · `function-definition` · `return-statement`. 파이썬이 `.py`·`.pyi` 를 **쿼리 열 개**(`_imports`·`_blocks` 포함)로 읽고, 쿼리는 전부 Rust 사전 시험이 진짜 문법에 돌려 검증했다.

## 개념마다 「파이썬이라서 다른 것」을 하나씩

TS 판을 번역하지 않았다. 각 개념이 자기 자리를 버는 근거가 파이썬 고유의 사실이다.

| 개념 | 그 개념이 존재하는 이유 |
|---|---|
| `assignment` | `const`/`let` 이 **없어** 만드는 줄과 옮기는 줄이 같은 모양이다. 어느 쪽인지는 위에 같은 이름이 있었는지로만 안다 (D152 ⓐ) |
| `boolean-literal` | 둘 다 **대문자로 시작**한다. 소문자로 적으면 값으로 읽히는 게 아니라 「그런 이름 없다」로 멈춘다 |
| `arithmetic` | 나누기가 **딱 떨어져도 소수**를 낸다 |
| `comparison` | 조건 안의 `=` 를 파이썬이 **아예 막는다** — 다른 언어에서 조용히 넘어가던 실수를 여기서 잡는다 |
| `if` · `while` | 묶음의 경계가 중괄호가 아니라 **들여쓰기**다 |
| `return` | 안 적으면 조용히 `None` 이 간다 — 멈추지 않고 **값만 비어 온다** |

`function-definition` 의 오답 셋(`class`·`lambda`·`return`)도 파이썬 것이다. `lambda` 는 식 하나만 담고 이름이 없다는 것이 요점이고, `return` 의 `yield` 오답은 **낱말 하나가 함수 전체의 종류를 바꾼다**는 것을 짚는다.

## 물려받은 것

여덟 전부 오늘 TS 용으로 쓴 **보편 개념을 그대로 쓴다**. 숙련도가 `universal_id` 로 전이되므로(D4), TS 에서 조건문을 익힌 사람은 파이썬 조건문을 첫 노출에 1겹으로 시작한다. D148 이 「두 번째 언어부터 싸진다」고 적은 것이 이 자리다.

## 린트가 잡은 것

조사 **21곳**과 영문 금칙어 둘(`failed`). 기계적인 것은 고치개로 돌리고 금칙어는 손으로 고쳤다. 여덟이 네 부채 규칙을 전부 채워 래칫을 **39/37/39/33** 으로 올려 잠갔다.

## 검증

`cargo test -p chickadee-parse --test dictionary` 통과(쿼리 전량이 진짜 문법에서 검증) · `pnpm typecheck`·`pnpm lint` 무출력 · `pnpm dict:lint` 13/13 · **TS 전체 2,006건 / 179 파일 전량 통과**. 커밋 `f8d00da`.

## 남은 것

파이썬 골든(개념당 양성 3·음성 2 = 40장, `golden.rs` 의 `(dir, least)` 목록에 `py` 추가)과 T1 들여쓰기 분기(D152 ⓑ — 탭·공백만 정규화하고 깊이는 유지). 그리고 실리포로 파이썬을 한 번 읽어 보는 것 — 지금은 파이프라인이 통했다는 것까지만 확인했다.