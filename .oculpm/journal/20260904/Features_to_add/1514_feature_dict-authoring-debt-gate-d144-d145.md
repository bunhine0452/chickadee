---
schema_version: 1
type: feature
slug: "dict-authoring-debt-gate-d144-d145"
status: done
difficulty: medium
created_at: "2026-09-04T15:14:40+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/dictionary/src/lint.ts"
    op: update
  - path: "packages/dictionary/src/lint.test.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "packages/dictionary/src/schema.ts"
    op: update
  - path: "packages/dictionary/src/index.ts"
    op: update
  - path: "dictionary/schema/concept.schema.json"
    op: update
  - path: "tests/support/quality.test.ts"
    op: update
  - path: "docs/03-ingest-parsing-dictionary.md"
    op: update
  - path: "CONTRIBUTING.md"
    op: update
  - path: ".github/PULL_REQUEST_TEMPLATE.md"
    op: update
related: []
tags:
  - "dictionary"
  - "lint"
  - "gate"
  - "llm"
  - "d144"
  - "d145"
  - "d138"
  - "mcp-tool"
---
[x] 사전 저작 부채를 dict:lint 래칫 게이트로 · LLM 은 저작 시점에만 (D144·D145)

## 추가 기능

「출제에 AI 를 쓰는 문제」의 답을 **게이트와 문서**로 박았다. 판 194장 중 193장(99.5%)이
의미형인 원인은 생성기가 아니라 사전 데이터라는 D132 실측을, 개념 단위로 세는 두 번째 표로
만들어 `pnpm dict:lint` 가 매번 찍게 했다.

### 1. 부채 게이트 (D145) — `packages/dictionary/src/lint.ts`

`lintDict` 은 **틀린 것**을 잡고 임계가 없다. 새로 만든 `authoringDebt` 는 **아직 안 쓴 것**을
세고 D132 식 래칫을 쓴다 — 오늘의 실측이 바닥, 목표는 대상 전량, 거리를 매번 찍는다.

| 규칙 | 대상 | 오늘 |
|---|---|---|
| `blank-or-reason` | essential | 2/23 |
| `point-picks` (`@pick.N` 3개 이상) | point 가 있는 개념 | 18/26 |
| `why-gate` | essential | 0/23 |
| `zero-one-liner` (D138 누설) | 0장 후보 | 4/6 |

임계는 `dict.test.ts` 의 `DEBT_RATCHET`. 다 채운 규칙은 래칫을 대상 전량으로 **올려 잠그도록**
테스트가 강제한다 — 그 순간이 D138 이 적은 「사전 린트가 실패한다」가 되는 순간이다.

### 2. 0장 누설 린트 (D138)

0장 후보(`essential` ∧ 그 집합 안 선행 깊이 1 이하)의 `one_liner` 가 그 개념 문항의 정답
토큰을 글자로 내면 걸린다. 정답 토큰의 출처는 `examples[].expect.picks`·`hole` 뿐이다 —
`pick.N` 은 자리 이름이라 그 자체로는 글자가 없다. 태그와 문장 끝 마침표·쉼표를 걷어낸 뒤에
보고, 식별자 꼴 토큰은 낱말 경계로 본다: `.` 이 정답인 `ts/property-access` 에서 한국어
문장의 마침표까지 걸리면 통과할 수 없는 규칙이 되고, `prev` 가 `previous` 안에서 걸리면
거짓 양성이 된다.

지금 걸리는 것: `ts/nullish-coalescing(??)` · `ts/property-access(.)`.
`ts/const-declaration` 은 병렬 세션이 이번 트리에서 이미 고쳤다.

0장 대지의 실제 8장은 리포마다 다르므로 사전만 보고는 알 수 없다 — 그래서 **후보 전량**을
본다. 어느 것이 뽑혀도 새면 안 된다.

### 3. 스키마 — `no_hole_reason`

빈칸형을 **못 내는** 사유. 「아직 안 썼다」와 「이 문법에는 뚫을 구멍이 없다」는 다른 상태인데
게이트는 그 둘을 구별할 수 없다. 빈칸형이 생긴 뒤에도 남아 있으면 `no-hole-reason-stale` 이
잡는다 — 표는 초록인데 이유는 거짓말인 상태를 안 만든다.

### 4. 문서 (D144)

- `docs/03` §5.1 부채 게이트 절 · §4.4 필드 · §5.2 「허용」→**「권장」**.
  안티패턴 네 행의 실제 위치를 표로 박았다(04 §1.4 · 04 §4.6 · 03 「대안과 버린 이유」 ·
  06 「대안과 버린 이유」) — 넷 다 그대로 남았고 D106 도 그대로다.
- `CONTRIBUTING.md` 에 검증기 넷과 **사람이 보는 둘**(의미형의 값 주장 · 진단문의 참·거짓).
- `.github/PULL_REQUEST_TEMPLATE.md` 에 Dictionary 절 — LLM 초안 신고 · 사람이 본 둘 ·
  부채 표 후퇴 금지.

### 5. 두 표를 잇는다

`tests/support/quality.test.ts` 가 최대 유형·래칫·목표·남은 거리를 한 줄로 찍고 부채 표를
가리킨다. 드롭 사유 「짚을 후보가 3개에 못 미친다 240×」·「이 사용처에는 구멍(@hole)이 없다
280×」가 부채 표의 두 줄에 그대로 대응한다.

## 검증

- `npx vitest run packages/dictionary tests/support/quality.test.ts scripts/dict-schema.test.ts` — 50 통과.
- `npx eslint packages/dictionary/src tests/support/quality.test.ts` 무결.
- `npx tsc --noEmit` — dictionary·cards·grading·store-sql·scheduler·concepts 전부 무결
  (`no_hole_reason` 기본값이 `Concept` 타입에 들어가므로 소비자 쪽을 따로 확인했다).
- Rust 0줄. 네트워크 0회. 키가 없는 사용자에게 달라지는 것 없음.