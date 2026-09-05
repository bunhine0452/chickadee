---
schema_version: 1
type: feature
slug: "java-dictionary-session-merged"
status: done
difficulty: medium
created_at: "2026-09-06T01:05:26+09:00"
session_id: "20260906-001"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/java/final.yaml"
    op: create
  - path: "dictionary/java/checked-exception.yaml"
    op: create
  - path: "dictionary/java/main-method.yaml"
    op: create
  - path: "dictionary/java/generics-erasure.yaml"
    op: create
  - path: "dictionary/java/_lang.yaml"
    op: update
  - path: "packages/course/src/parts/java.ts"
    op: update
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "docs/curriculum/java.md"
    op: update
related: []
tags:
  - "v11"
  - "사전"
  - "java"
  - "합류"
  - "mcp-tool"
---
[x] 자바 사전 47장 — 심화 넷 추가, 0부에 string-concat·autoboxing 복귀, 골든 47장 전부 (D190 java 세션 합류)

Opus 워크트리 세션(브랜치 `worktree-agent-ae005af321d0e960b`, 커밋 `f69d8e1`)의 보고를 받아 병합했다.

## 추가 기능

- 신규 넷: `java/final`(52곳/31파일) · `java/checked-exception`(4/3) · `java/main-method`(1/1) · `java/generics-erasure`(0/0). 사전 43 → **47장**, `essential` 41 → 47(0부 19 · 1부 8 · 2부 20), `parts/java.ts` 같음.
- **`string-concat`·`autoboxing` 이 0부 `essential` 로 돌아왔다.** 축 H 대표 예(`Integer` 캐시, D187 ⑰)의 선행이 `autoboxing` 인데 그것이 essential 밖이라 `pickConcept`·`buildGaps` 가 64파일에 있는 개념을 못 골랐다. 0부 신규 essential 12 → 14 — 규약 8 을 「축 여덟」로 읽은 판정이고 등록부 초안으로 남겼다.
- 골든 47장 전부 양성 2·음성 1 이상(양성 114 · 음성 47). `reference-equality` 의 `why` 에 남아 있던 `new String("a") == "a"` 를 지우고 `prereq` 에 `autoboxing` 을 더했다.
- 파서 ERROR 비율: MonggleMonggle java 20파일 0%.
- ABSENCE 표에 `java/generics-erasure: library` 한 줄(오케스트레이터가 넣음).

## 동작 흐름

세션은 `crates/parse/tests/` 에 임시 시험을 써 47개 쿼리의 사용처를 세고 지웠다. 0곳 여덟 · 얇은 것 여섯 = 14장(30%)이 내 코드로는 못 가르치는 자리다.

## 검증

병합 뒤 메인 트리에서 `packages/dictionary`·`packages/course` 155 초록, cargo 골든 6/6, `packages/cards` 초록. 세션이 만지지 말라는 목록 밖 둘을 고쳤다 — `dict.test.ts` 의 `DEBT_RATCHET`(126/126/117, 자바만 본 값)과 `curriculum.test.ts` 의 part0 17→19. 래칫은 열 세션 합류 뒤 다시 잠근다. 못 한 것: `java/map-and-set`(`ds/` 몫일 수 있음) · `spring/bean-lifecycle` 여전히 안 섬 · `spring/` 골든은 쿼리가 없어 하네스가 안 돈다.