---
schema_version: 1
type: feature
slug: "ts-dictionary-session-merged"
status: done
difficulty: medium
created_at: "2026-09-06T01:21:06+09:00"
session_id: "20260906-001"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/ts/_lang.yaml"
    op: update
  - path: "dictionary/ts/narrowing.yaml"
    op: create
  - path: "dictionary/ts/union-type.yaml"
    op: create
  - path: "dictionary/ts/type-annotation.yaml"
    op: create
  - path: "dictionary/ts/class-declaration.yaml"
    op: create
  - path: "dictionary/ts/prototype-chain.yaml"
    op: create
  - path: "packages/course/src/parts/ts.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "docs/curriculum/ts.md"
    op: update
related: []
tags:
  - "v11"
  - "사전"
  - "ts"
  - "합류"
  - "mcp-tool"
---
[x] TS 사전 69장 — 2부 18·심화·표기 짝 22장 신설, essential 52 (D190 ts 세션 합류)

Opus 워크트리 세션(브랜치 `worktree-agent-a5a8d177f01201471`, 커밋 `c2898f6`)의 보고를 받아 병합했다.

## 추가 기능

- 47 → **69장**. 신규 22장 4,567줄(한 장 208줄 — README §11 어림 213 의 −2.3%). `essential` 41 → **52**(0부 21 · 1부 13 · 2부 18), 부 밖 17(심화·표기 짝). `parts/ts.ts` 같음. 3부는 `react/` 한 장이라 비워 둠.
- 결정된 순서 반영: `class-declaration` 이 `prototype-chain` 을 선행으로 · 타입 축 셋(`type-annotation`·`union-type`·`narrowing`)은 2부 맨 앞(§1.5.4 를 정본으로, §3 의 「if 직후」와 어긋남은 문서 §12.5 에 표로) · `alternatives` 에 `{ gap: ts/narrowing, present: ts/typeof-guard }`, 둘의 문법을 `[typescript, tsx]` / `[javascript, vue]` 로 갈라 한 줄이 두 번 세이지 않게.
- 골든 69장 전부 양성 2·음성 1 이상(164 / 84). 사용처 실측 다섯 리포 1,186파일 — `object-literal` 6,370/493(ai-pm) 부터 `narrowing` 15/10 까지 표로 `ts.md` 에. 파서 ERROR ai-pm·ECC 각 0/20.
- 전 표본 0곳은 `implicit-conversion` 뿐(이미 ABSENCE) — 신규 ABSENCE 없음.

## 동작 흐름

세션은 `crates/parse/tests/ts_measure.rs` 임시 시험으로 72개 `.scm` 을 표본에 돌려 `@site` 를 세고 지웠다. 합류에서 `DEBT_RATCHET` 을 137/141/137/128 로 다시 잠갔다(세션은 그 파일을 안 만졌다 — 브리프대로).

## 검증

병합 뒤 `packages/dictionary`·`packages/course` 초록(래칫 재잠금 뒤), cargo 골든 6/6. 못 한 것: `narrowing` 쿼리가 `typeof`·`in`·`instanceof` 세 꼴만 잡아 얇다(15곳) · ECC 의 `prototype` 관용구 미분리 · `ts.md` 869줄(800 상한 초과). 새 `common/` 후보 여덟과 `cs/task-queue` 신청은 등록부 초안으로.