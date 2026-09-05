---
schema_version: 1
type: feature
slug: "c-dictionary-session-merged"
status: done
difficulty: high
created_at: "2026-09-06T04:48:55+09:00"
session_id: "20260906-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/c/_lang.yaml"
    op: create
  - path: "dictionary/c/undefined-behavior.yaml"
    op: create
  - path: "dictionary/c/pointer-declaration.yaml"
    op: create
  - path: "dictionary/c/conditional-compilation.yaml"
    op: create
  - path: "packages/course/src/parts/c.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "docs/curriculum/c.md"
    op: update
related: []
tags:
  - "v11"
  - "사전"
  - "c"
  - "합류"
  - "mcp-tool"
---
[x] C 사전 38장 — 기계 층 0부 열둘, 빌드와 규격까지, jq 로 실측 (D190 c 세션 합류)

Fable 포크 워크트리 세션(브랜치 `worktree-agent-a1531aa0327113699`, 커밋 `2e22dc6`)의 보고를 받아 병합했다. 세션 한도로 한 번 멈췄다가 재개해 끝냈다.

## 추가 기능

- 0 → **38장** 8,948줄(개념당 228줄). `essential` 38(0부 12 · 1부 8 · 2부 18), `parts/c.ts` 같음. 0부 신규 열둘이 규약 8 상한에 정확히. 문서의 3부 「빌드와 규격」 아홉은 2부 끝에 이었다 — 등록부 시험이 3부를 프레임워크 사전 전량 아니면 빈 목록으로 못박는다.
- 골든 116/62, 빈칸형 27장 · `no_hole_reason` 11장. 표본은 공개 리포 `jqlang/jq` `src/`(.c 21 · .h 21) — 0곳 없음, `function-call` 7,088/27 부터 `undefined-behavior` 5/2 까지 표는 `c.md` §12.
- **파서 첫 실측** — `tree-sitter-c` 0.24.2 로 .c 20장: ERROR 든 파일 15/20 · poor 3 · ERROR 바이트 17.8%. poor 셋(`jv_dtoa.c` 100% · `main.c` 72% · `jq_test.c` 34%)은 `#ifdef … #include … #elif` 와 `#ifdef` 로 갈린 문자열 이어붙이기가 파일을 통째로 무너뜨린 것(§8 ③ 그대로). 셋을 빼면 0.44%, .h 는 2.2%. `derive` 가 poor 파일 캡처를 버릴지는 열려 있다.
- 0부 id 는 README §8 의 축 id 조각이 아니라 `c.md` §0.1 의 것(`integer-type`·`float-type`·`char-literal`·`conversion` …)을 따랐고 전이는 `universal` 로만 — 규약 3 과 문서 중 어느 쪽을 고칠지 등록부 초안.
- ABSENCE 행 없음(사용자 리포에 사람이 쓴 `.c` 0장 — 리포 없이 열면 전부 `no-files`).

## 동작 흐름

`cs/` 45장에 없는 넷(signed-and-unsigned · null-terminated-string · preprocessing · alignment-and-padding) · `common/` 후보 다섯 · `confusions` 를 비운 이유(린트 `blank-wrong-from-confusions` 가 C 오답에 안 맞음) · `resolve-imports.ts` 에 c/h 가 없어 `#include` 간선이 안 서는 것은 등록부 초안. `pedagogy.md` §13 ④ 권고는 `parts/c.ts` 머리 주석에 남았다. 합류에서 `DEBT_RATCHET` 255/237/255/246.

## 검증

병합 뒤 `packages/dictionary`·`packages/course` 초록(래칫 재잠금 뒤), cargo 골든 6/6. 못 한 것: `integer-promotion`·`boolean` 개념 · 두 겹 포인터·`sizeof x`·`return;` 미포착 · 쿼리 정밀도 눈 대조 0(골든 178 로만) · `drills/` 에 C 문제 없음(러너가 C 를 모름).