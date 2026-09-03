---
schema_version: 1
type: feature
slug: "t1-block-mask-spec-generator"
status: done
difficulty: high
created_at: "2026-09-03T15:55:52+09:00"
session_id: "20260903-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/cards/src/t1-types.ts"
    op: create
  - path: "packages/cards/src/t1-block.ts"
    op: create
  - path: "packages/cards/src/t1-mask.ts"
    op: create
  - path: "packages/cards/src/t1-spec.ts"
    op: create
  - path: "packages/cards/src/t1.ts"
    op: create
  - path: "packages/cards/src/t1-block.test.ts"
    op: create
  - path: "packages/cards/src/t1-mask.test.ts"
    op: create
  - path: "packages/cards/src/t1-spec.test.ts"
    op: create
  - path: "packages/cards/src/t1.test.ts"
    op: create
  - path: "packages/cards/src/index.ts"
    op: update
related: []
tags:
  - "t1"
  - "cards"
  - "04-grading-engines"
  - "m3"
  - "mcp-tool"
---
[x] T1 블록 선정·2단계 마스크·스펙 카드·카드 생성기 (packages/cards)

## 추가 기능

04 §3 의 T1 굽는 쪽 전부. D86 대로 선정·분절·마스크·스펙·왜 게이트 **문항**만 `packages/cards`
에 두고, 정렬·점수·이의는 손대지 않았다. 새 의존 없음(`text`·`dictionary`·`store-sql` 만).

- `t1-mask.ts` — 04 §3.2 표의 5종을 `ts/tsx/js(x)` · `py` · `go` · `rs` + 폴백으로 옮겼다.
  `keepKinds` 가 한 번 훑고 `keepSet` 이 색인만 낸다. `placeholderWidth` 는 목업 공식
  `min(30, max(4, 트림길이·0.56))`.
- `t1-block.ts` — `segment`(41줄↑ 을 최상위 문장 경계로, 2번째부터 `// …이어서`),
  `rankBlocks`(04 §3.1 순위를 **탈락 조건**과 **정렬 키**로 쪼갬), `pickConcept`(D27),
  `signatureRange`.
- `t1-spec.ts` — 04 §3.3. 출처 ①사용자 ②사전 `one_liner` ③행 정규식 휴리스틱(외부 호출·
  지역 변수 수·반환 루트·조기 반환), ①이 있으면 ②③은 3개.
- `t1.ts` — `generateT1`. 후보를 순위대로 훑고 첫 성립하는 판을 낸다. 왜 게이트는 사전
  `why_gate` 면 보기 3개, 없으면 일반 템플릿 + 보기 0개(`grading` 의 출처 구분 규약).

## 동작 흐름

`rankBlocks` → 후보 순회 → `pickConcept` → `keepKinds` → `buildSpec` → `buildWhy` → payload →
`contentHash({conceptId, kind:'transcribe', siteId: 대표개념.siteId, genVersion, payload})`.

## 문서가 모자라 정한 것

- 04 §3.2 「최상위 JSX 루트의 여는 태그 행」의 판정 = `return (` **바로 다음 줄**이 여는
  JSX 태그(자기 닫힘 아님)일 때. 목업 `show2` 가 `<form …>` 만 남기고 `<button …>로그인`·
  `<input … />` 는 지우므로 이 읽기만 그 집합을 낸다.
- 「200줄 초과 파일은 블록만」에 별도 조건을 두지 않았다. 파일 전체를 필사하는 후보는
  `kind === 'file'` 뿐이고 그것도 12~40줄 규칙을 받으므로 여기서 이미 떨어진다.
- ③휴리스틱은 AST 가 아니라 행 정규식. `cards` 는 01 §2 로 `ipc-client` 를 못 부르고
  `BlockCandidate` 는 원문 줄만 들고 온다.
- 왜 게이트 후보 줄 = **2단계에 지워지는 줄**. §6 ④ 「첫 비-시그니처 문장」을 그렇게 읽었다.
- `T1Request` 에 `concept` 를 넣지 않았다 — D27 이 대표 개념을 출력으로 정했다.

## 검증

`pnpm vitest run packages/cards` → 5 파일 80 테스트 통과(T1 57 · 기존 T0 23).
`keepSet(LOGIN_FORM 20줄, 'typescript')` 가 목업 `show2 = [0,1,5,6,9,10,11,12,17,18,19]` 를
그대로 낸다. 결정성 테스트(두 번 생성 `toStrictEqual`) 포함.
`pnpm --filter @chickadee/cards typecheck` · `npx eslint packages/cards` 무출력.