---
schema_version: 1
type: feature
slug: "python-reaches-the-parser"
status: done
difficulty: medium
created_at: "2026-09-04T19:51:53+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/py/_lang.yaml"
    op: create
  - path: "dictionary/py/assignment.yaml"
    op: create
  - path: "dictionary/py/if-statement.yaml"
    op: create
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/1928_feature_exec-lazy-baking-wired.md"
    kind: "followup"
tags:
  - "D152"
  - "파이썬"
  - "사전"
  - "mcp-tool"
---
[x] 파이썬이 파서까지 내려간다 — 첫 답변에서 「판 0장」이라 한 것이 이제 사실이 아니다 (D152 첫 조각)

## 추가 기능

`langSpecs()` 가 쿼리 0개인 문법을 걸러서 `.py` 는 Rust 까지 내려가지도 못했다. 이제 내려간다 — 문법 목록이 `javascript · python · tsx · typescript` 이고 python 이 `.py`·`.pyi` 를 쿼리 4개로 읽는다.

**사용자에게 처음 답할 때 「파이썬 리포를 등록하면 판 0장」이라고 했던 것이 이 커밋으로 사실이 아니게 됐다.**

## 이미 깔려 있던 것

막는 것이 사전 하나뿐이었다는 fork 의 조사가 맞았다 — `grammarSchema` 가 `python` 을 이미 허용하고, T2 import 해석기 `resolvePy` 가 `__init__.py` 폴백까지 구현돼 있고, `t1-block` 이 `#` 주석을 안다.

## 넣은 것

- **쿼리 열 장.** Rust 사전 시험이 진짜 문법에 돌려 검증했다. `comparison` 이 유일한 함정이었다 — 파이썬 `comparison_operator` 는 `left`/`right` 필드가 없고 `a < b < c` 연쇄를 **한 노드**에 담아, 순진하게 쓰면 연쇄 하나가 사이트 넷으로 터진다. 앵커 `.` 로 「자식이 정확히 둘」만 잡는다.
- **`grammar_abi: 14`.** TS 는 15 다. 문법마다 다르고 틀리면 조용히 어긋난다.
- **개념 둘** — `assignment`·`if-statement`. 오늘 TS 용으로 쓴 **보편 개념을 그대로 물려받는다**(`common/variable-binding`·`common/conditional-branch`). D148 이 기대한 재사용이 실제로 일어났다.
- `essential` 에는 **실제로 쓴 것만** 올린다. 목록에 있는데 개념 파일이 없으면 사전이 아예 안 선다.

## 파이썬이라 다른 것

`assignment` 이 이 조각의 중심이다. 파이썬에는 `const`/`let` 이 없어 **만드는 줄과 옮기는 줄이 같은 모양**이고, 어느 쪽인지는 위에 같은 이름이 있었는지로만 안다. D152 가 「가르지 않는다」고 정한 것이 이 사실이고, 개념의 `why`·오답 진단이 전부 그 축에 서 있다.

`if-statement` 는 **묶음의 경계가 들여쓰기**라는 것이 TS 판과 갈리는 자리다.

## 린트가 잡은 것

조사 4곳(변수 뒤 조사는 `|josa:` 로)과 **영문 금칙어 둘** — `elif` 진단과 `why_gate` 피드백에 쓴 `failed` 가 `\b(wrong|incorrect|failed)\b` 에 걸렸다. 정본 §3-2 「진단은 판정이 아니다」가 영문에도 걸려 있다. `did not hold`·`does not hold` 로 고쳤다.

래칫을 33/33/33/28 로 올려 잠갔다.

## 검증

`cargo test -p chickadee-parse --test dictionary` 통과(쿼리가 진짜 문법에서 검증됨) · `pnpm typecheck`·`pnpm lint` 무출력 · `pnpm dict:lint` 13/13 · **TS 전체 2,006건 / 179 파일 전량 통과**. 커밋 `1ff47e6`.

## 남은 것

바닥 여덟 중 여섯 — `boolean-literal`(대문자 `True` 가 함정) · `arithmetic`(`/` 가 늘 실수, `//` 가 버림) · `comparison`(연쇄) · `while-loop` · `function-definition` · `return-statement`. 쿼리는 이미 다 검증돼 있고 남은 것은 산문이다. 그 다음이 파이썬 골든(개념당 양성 3·음성 2)과 T1 들여쓰기 분기(D152 ⓑ)다.