---
schema_version: 1
type: feature
slug: "exec-card-assembly"
status: done
difficulty: high
created_at: "2026-09-04T19:24:09+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/cards/src/t0-exec.ts"
    op: update
  - path: "packages/cards/src/t0-exec.test.ts"
    op: update
  - path: "packages/i18n/src/ko/cards.ts"
    op: update
  - path: "packages/i18n/src/en/cards.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/1918_feature_exec-order-dictionary-and-prose.md"
    kind: "followup"
tags:
  - "D151"
  - "생성기"
  - "D70"
  - "D137"
  - "mcp-tool"
---
[x] 추적 카드 조립 — 사이트 없는 카드에 센티넬을 세워 정본 계약을 그대로 태웠다 (D151)

## 추가 기능

`makeExecCard` — 블록 하나에서 실행 추적 카드 한 장까지. 이걸로 D151 의 생성 경로가 패키지 층에서 끝에서 끝까지 이어진다.

## 푼 문제 — 사이트가 없는 카드

`exec/*` 는 쿼리가 없어 `concept_site` 행이 없다. 그런데 `commonPayload`·`finish` 는 전부 `SiteInput` 을 받는다. 없는 행을 지어내면 거짓말이고, 별도 경로를 파면 시드·해시·사전 3층 계약이 갈라진다.

**선례가 이미 있었다.** 합성 카드(D137)가 `SYNTHETIC_SITE_ID = -1` 로 **메모리에만 사는 센티넬 사이트**를 세우고 정상 경로를 그대로 쓴다. 원장에는 `site_id: NULL` 로 들어간다. 같은 길을 따랐고 센티넬은 **-2** 로 뒀다 — 합성과 섞이지 않고, 진짜 사용처 id(자동 증가, 1부터)와도 안 겹친다.

**시드는 `block.text_hash` 에 건다.** D70 이 「줄이 밀려도 같은 카드가 다시 나와야 한다」를 요구하고, 그걸 주는 것은 줄 번호가 아니라 내용 해시뿐이다.

## 오프셋 문제

`block.ast_json` 은 블록만 따로 파싱한 것이라 오프셋이 **블록 기준**이다. 판은 **파일 기준** 줄 번호를 쓴다. `at = window.from + rel(offset) - 1` 로 옮긴다. `rel` 은 바이트 기준 `lineIndex` 다(오늘 고친 그것).

## 모르면 안 낸다

사유를 내고 물러나는 자리 넷 — 문법을 모를 때 · 블록에 함수가 없을 때 · 짚을 후보가 넷에 못 미칠 때 · 픽 하나라도 줄에 자리를 못 잡을 때(보기 번호가 어긋난다). **짧은 함수에서는 아무것도 안 나온다. 그게 의도한 결과다.**

짚는 자리는 **들여쓰기를 뺀 코드 부분**이다. 들여쓰기까지 짚게 하면 빈칸을 짚는 셈이 된다.

## 시험

끝에서 끝까지 한 건이 핵심이다 — 만든 페이로드를 **진짜 `cardPayloadSchema` 에 통과시킨다.** 타입이 맞는 것과 저장할 수 있는 것은 다르고, 그 둘을 가르는 것이 zod 다. 정답이 첫 실행 줄(11행)이고 정의 줄(10행)이 오답으로 들어가는 것까지 확인한다 — 그 오답이 이 문항의 존재 이유다.

## 검증

`pnpm typecheck` 무출력 · `pnpm lint` 무출력 · **TS 전체 1,999건 / 179 파일 전량 통과**. 커밋 `9797355`.

## 남은 것

앱 쪽 배선 — `makeExecPlate`(DB 삽입, `makeSyntheticPlate` 와 같은 모양)과 **언제 굽나**. `bakeNextT2` 처럼 세션당 한 장씩 게으르게 굽는 것이 맞아 보인다: 블록마다 굽는 것은 일괄 생성 금지에 걸린다.