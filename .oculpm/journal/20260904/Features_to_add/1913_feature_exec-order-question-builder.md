---
schema_version: 1
type: feature
slug: "exec-order-question-builder"
status: done
difficulty: medium
created_at: "2026-09-04T19:13:13+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/cards/src/t0-exec.ts"
    op: create
  - path: "packages/cards/src/t0-exec.test.ts"
    op: create
  - path: "packages/cards/src/exec-facts.ts"
    op: update
  - path: "packages/cards/src/exec-facts.test.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
related:
  - ref: "20260904/Features_to_add/1901_feature_exec-facts-analysis-layer.md"
    kind: "followup"
tags:
  - "D151"
  - "출제로직"
  - "실측"
  - "mcp-tool"
---
[x] 실행 추적 출제층 — 그리고 실측이 개념 하나를 죽였다 (D151 개정)

## 추가 기능

`exec-facts.ts`(사실) 위에 `t0-exec.ts`(출제)를 얹었다. 층을 가른 규칙은 그대로다 — **문법 이름을 아는 것은 아래층뿐**이고 위층은 사실만 받는다. 새 언어가 들어와도 출제층은 안 고친다.

**산문을 코드에 안 넣는다.** 오답마다 「그것이 참이 되는 조건」(정본 §3-2)을 내야 하는데 그 문장은 사전이 대고, 이 파일은 **왜 틀렸는지의 기계 코드**(`WrongBecause`)만 낸다. 산문이 코드에 박히면 `dict:lint` 가 못 보고 로케일도 못 탄다(D117). 다른 개념과 같은 구조다.

## 실측이 개념 하나를 죽였다 — `exec/unreachable`

D151 이 「정적으로 가장 확실한 정답지」라며 첫째로 꼽았던 것이다. 실제로 확실하다. 그런데 **있지가 않다.**

- 골든 AST 픽스처의 TS 블록 넷 중 도달 못 하는 줄이 있는 것 **0건**
- 이 리포 **238파일 · 함수 약 802개**에서 「`return` 뒤에 같은 들여쓰기의 코드가 오는 자리」 **0건**

린터와 타입 검사기가 이미 잡는 모양이라 실제 코드에 남지 않는다. 사전 한 편과 골든 다섯 장을 써서 카드가 0장 나오는 개념이다. **확실한 것과 있는 것은 다르다** — 등록부 D151 을 실측과 함께 개정해 뺐다.

이게 플랜이 `a-generator` 를 첫 항목으로 둔 이유다. 생성기를 먼저 짜지 않았으면 사전부터 썼을 것이다.

## `exec/order` — 남은 것

「이 함수를 부르면 **가장 먼저** 도는 줄은?」

정답이 안 흔들리는 이유: `facts.first` 는 블록의 직계 첫 statement 이고, 그것이 조건이든 아니든 **가장 먼저 닿는 것**은 그 줄이다. 안쪽 줄이 도느냐 마느냐는 다음 문제이고, 그 구분이 곧 오답 진단이 된다.

오답 넷의 출처가 정확히 네 갈래다 — 정의 줄(`definition`, 「정의는 실행이 아니다」) · 뒤에 오는 무조건 줄(`runs`) · 조건 안의 줄(`conditional`) · 끊김 뒤(`runs`). 초보가 실제로 걸리는 자리와 하나씩 대응한다.

**게이트**: 오답 셋을 못 채우면 안 낸다. 진짜 트리(`16-ast-paren`, 직계 statement 둘)로 게이트가 닫히는 것을 확인했다 — 작은 함수에서 조용히 약한 문제를 내느니 안 내는 편이 맞다.

줄 오름차순으로 낸다. 위치가 정보이고 `← →` 이동 순서와 같아야 한다(04 §1.1).

## 검증

`pnpm typecheck` 무출력 · `pnpm lint` 무출력 · 새 시험 **5건**(게이트 하나는 진짜 트리 위) · **TS 전체 1,997건 / 179 파일 전량 통과**.

곁다리로 `lineIndex` 를 **바이트 기준**으로 고쳤다. tree-sitter 오프셋은 바이트인데 JS 문자열 인덱스는 UTF-16 이라, 한국어 주석이 정본인 이 리포에서는 주석 한 줄 아래부터 줄 번호가 통째로 밀린다. 회귀를 붙였다.

## 남은 것

`exec/order` 사전 편찬(`dictionary/exec/order.yaml` — `WrongBecause` 네 키에 산문을 댄다)과 카드 굽는 경로 배선. `state/mutation` 은 그 다음이고, 재료는 이미 사전이 갈라 둔 `common/mutating-append` ↔ `map-transform` 이다.