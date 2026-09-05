---
schema_version: 1
type: feature
slug: "py-dictionary-session-merged"
status: done
difficulty: medium
created_at: "2026-09-06T01:30:06+09:00"
session_id: "20260906-001"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/py/_lang.yaml"
    op: update
  - path: "dictionary/py/attribute-access.yaml"
    op: create
  - path: "dictionary/py/dict-literal.yaml"
    op: create
  - path: "dictionary/py/class-definition.yaml"
    op: create
  - path: "dictionary/py/import.yaml"
    op: create
  - path: "packages/course/src/parts/py.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "docs/curriculum/py.md"
    op: update
related: []
tags:
  - "v11"
  - "사전"
  - "py"
  - "합류"
  - "mcp-tool"
---
[x] 파이썬 사전 42장 — 1부 열·2부 열넷, 신규 열여덟 전부 사용처 있음 (D190 py 세션 합류)

Opus 워크트리 세션(브랜치 `worktree-agent-a76646d9770352245`, 커밋 `06f68ca`)의 보고를 받아 병합했다.

## 추가 기능

- 24 → **42장** 11,063줄(한 장 263줄 — 2부 열넷이 302줄로 끌어올림). `essential` 42(0부 18 · 1부 10 · 2부 14), `parts/py.ts` 같음, 3부 없음. 1부 신규 넷(`none-value`·`for-in`·`call-expression`·`import`), 2부 열넷(`attribute-access`·`dict-literal`·`index-access`·`tuple-unpacking`·`set-and-membership`·`list-append`·`lambda`·`list-comprehension`·`type-hint`·`default-argument`·`class-definition`·`try-except`·`with-statement`·`decorator`).
- 골든 42장 전부 양성 2·음성 1 이상(132 / 75). 미달이던 셋(`function-definition`·`if-statement`·`while-loop`) 보강.
- 사용처 실측 네 리포 223파일 — 신규 열여덟 중 0곳 없음. `attribute-access` 13,476곳 · `call-expression` 12,997곳. 파서 ERROR 0/223.
- 정밀도를 눈으로 본 둘: `index-access` 는 대괄호 안을 리터럴 셋으로 열거해 타입 힌트 오탐 0(표본 20곳), 대가로 `d[key]` 를 못 본다(손실 안 잼). `attribute-access` 는 한 겹만.
- 얇은 판 배열 규칙 유지 — 얇은 것 열둘 → 열여덟, 셋이 붙는 자리 0. 깊이 ≤ 2 가 40/42 → 프롤로그 20일.

## 동작 흐름

문서와 어긋나 바꾼 넷은 `py.md` §12.6 표로 — `py/import` 선행에서 2부 개념 뺌 · `default-argument` 의 `universal` null · 부 안 순서 · 각주 갱신. 새 `common/` 후보 다섯은 등록부 초안으로. 합류에서 `DEBT_RATCHET` 155/159/155/146.

## 검증

병합 뒤 `packages/dictionary`·`packages/course` 초록(래칫 재잠금 뒤), cargo 골든 6/6. 못 한 것: 부 밖 심화 여섯(`augmented-assign` 268곳이 1순위) · 3부 네임스페이스 없음 · 두 큰 개념의 첫 노출 중복 영향 안 잼.