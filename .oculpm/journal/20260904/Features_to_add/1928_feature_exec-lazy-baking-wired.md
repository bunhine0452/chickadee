---
schema_version: 1
type: feature
slug: "exec-lazy-baking-wired"
status: done
difficulty: medium
created_at: "2026-09-04T19:28:26+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/data/blocks.ts"
    op: update
  - path: "packages/cards/src/index.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/1924_feature_exec-card-assembly.md"
    kind: "followup"
tags:
  - "D151"
  - "배선"
  - "D140"
  - "mcp-tool"
---
[x] 추적 카드를 게으르게 굽는다 — T1 이 이미 고른 블록을 그대로 쓴다 (D151)

## 추가 기능

`bakeNextExec` — 블록에서 추적 카드를 **세션당 한 장** 굽는다. `bakeNextT2`(D140)와 같은 모양이다.

## 판단 셋

**① 블록마다 굽지 않는다.** 일괄 생성 금지는 D140 이 T2 에 건 것과 같은 이유로 여기도 걸린다. 추적은 세션에 한두 장이면 되고, 짧은 함수에서는 생성기가 사유를 내고 물러나므로 시도 예산(6)을 두고 첫 성공에서 멈춘다.

**② 블록 후보를 새로 고르지 않는다.** `loadCandidates` 가 T1 용으로 이미 고른 것을 그대로 쓴다 — 새 statement 도 없고, 「어떤 블록이 쓸 만한가」의 정의가 두 벌이 되지도 않는다. `originalAst` 가 지나가는 길에 파스를 `block.ast_json` 에 캐시한다.

**③ 실패가 세션을 막지 않는다.** 추적 판이 한 장 안 나오는 것은 세션을 멈출 이유가 아니다.

## 곁다리 — 내보내기가 빠져 있었다

`makeExecCard` 를 `packages/cards/src/index.ts` 에 안 넣었는데 **타입 검사가 통과했다.** 워크스페이스가 소스로 해석해 주기 때문이고, 그대로 뒀으면 빌드 산출물에서 빠질 때까지 안 보였을 것이다. `exec-facts` 의 공개 면과 함께 제대로 내보냈다.

## 검증

`pnpm typecheck` 무출력 · `pnpm lint` 무출력 · **TS 전체 1,999건 / 179 파일 전량 통과**. 커밋 `40d50c2`.

전체 실행 중 `source-bytes` 시험이 한 번 빨갛게 났는데 **단독 실행과 재실행에서 모두 통과**했다 — 오늘 두 번 본 것과 같은 순서 의존 플레이크다(`catalog`·`T2 성능`도 같은 성격이었다). 실제 결함이 아니라고 판단했지만, 세 번째라 기록해 둔다: 전체 실행에만 나는 실패가 이 리포에 몇 군데 있다.

## 남은 것

세션 큐가 `bakeNextExec` 를 부르는 자리 하나. `cards.ts:101` 이 `bakeNextT2` 를 부르는 것과 같은 자리이고, **어떤 비율로 T0 어휘와 추적을 섞을지**가 그 앞의 결정이다 — 정본 §2 의 일일 예산(15분 · 새 판 2장)을 건드리므로 사용자 결정에 가깝다.