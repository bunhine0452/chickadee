---
schema_version: 1
type: feature
slug: "exec-facts-analysis-layer"
status: done
difficulty: high
created_at: "2026-09-04T19:01:33+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/cards/src/exec-facts.ts"
    op: create
  - path: "packages/cards/src/exec-facts.test.ts"
    op: create
related:
  - ref: "20260904/Features_to_add/1847_feature_evals-installed-and-first-meeting-gate.md"
    kind: "followup"
tags:
  - "D151"
  - "추적"
  - "출제로직"
  - "AST"
  - "mcp-tool"
---
[x] 실행 추적의 분석층을 짰다 — 진짜 파스 트리로 재서 버그 하나를 그 자리에서 잡았다 (D151)

## 추가 기능

D151 의 첫 관문 — 플랜이 「생성기가 안정적이지 않으면 개념 목록을 줄인다」고 걸어 둔 게이트다. `packages/cards/src/exec-facts.ts` 를 냈다.

**출제층과 가른 이유**가 곧 이 파일의 존재 이유다. 판 모양(`payload`)과 섞어 두면 「이 층이 믿을 만한가」를 판 모양 문제와 함께 재게 된다. 따로 두니 게이트를 따로 통과시킬 수 있었다.

## 로직

지키는 규칙 하나 — **트리만으로 100% 확실한 것만 사실로 낸다.** 「아마 이럴 것이다」는 정답지가 될 수 없다. 정본 §2 가 T0 를 실행 없이 채점한다고 못박았고, 흔들리는 정답지 위에는 정본 §3-2 의 오답 진단(「당신이 고른 그것이 **참이 되는 조건**」)을 쓸 수 없다. 그래서 **모르면 안 낸다.**

**① 문법표를 코드가 아니라 데이터로.** `Dialect{block, terminator, branching, fn}` 표에 문법별 노드 이름을 둔다. 파이썬(D152)이 들어올 때 고칠 것이 표 한 줄이어야 한다. 이름은 전부 `fixtures/golden` 의 `nodeKind` 에서 확인했다 — 추측한 것이 하나도 없다.

**② 직계만 본다.** `statementsOf` 가 블록의 직계 자식 중 이름 있는 것만 준다. 안쪽까지 훑으면 조건 안의 줄이 바깥 줄과 같은 자격으로 섞이고, 그 순간 「무엇이 먼저 도나」의 답이 흔들린다.

**③ 셋으로 정확히 가른다.** `execFacts` 가 블록 하나를 **반드시 돈다 · 돌 수도 있다 · 절대 안 돈다**로 나눈다. 가운데를 버리지 않고 들고 있는 것이 요점이다 — 조건 안의 줄을 고른 학습자에게 댈 말이 정확히 그 조건이고, 그게 §3-2 가 요구하는 진단이다.

**④ 끊김은 직계일 때만.** `if` 안의 `return` 은 「돌 수도 있다」이지 「여기서 끝난다」가 아니다. 이 한 줄이 `unreachable` 을 추측이 아니라 사실로 만든다.

## 진짜 트리로 쟀고, 그래서 버그를 잡았다

손으로 만든 픽스처는 내 가정을 그대로 베낀다. 그래서 `crates/parse/tests/t1_ast.rs` 가 구워 둔 **진짜 파스 트리**(`fixtures/golden/t1/ast/`, TS·파이썬·Go 포함)를 읽어 쟀다.

**잡힌 버그**: `fn` 표에 넣은 `'function'` 이 TS 문법에서는 함수식의 종류이면서 동시에 **`function` 키워드의 익명 노드 이름**이다(`14-ast-block.json` 에서 확인). 이름을 안 보면 키워드 하나가 함수 하나로 세어진다. `named` 를 보게 고치고 회귀를 붙였다.

`14-ast-block` 이 마침 **`return` 이 `if` 안에 있는** 모양이라 ④를 그대로 못박는 시험이 됐다 — 그 `return` 을 끊김으로 세면 `unreachable` 이 거짓으로 차오른다.

Go 트리에는 `dialectOf` 가 `null` 을 준다. 「모르면 안 낸다」를 시험으로 고정했다.

## 곁다리 — 의존 방향

`AstLite` 를 `@chickadee/ipc-client` 에서 가져왔더니 eslint 가 01 §2 위반으로 잡았다(`cards` 가 부를 수 있는 것은 concepts·store-sql·dictionary·text·i18n 뿐). `store-sql` 이 타입만 재수출하고 `t1-spec.ts` 가 이미 그 관용구를 주석에 적어 뒀다 — 그쪽으로 바꿨다.

## 검증

`pnpm typecheck` 무출력 · `pnpm lint` 무출력 · 새 시험 **10건**(전부 진짜 트리 위) · **TS 전체 1,991건 / 178 파일 전량 통과**.

**게이트 판정: 통과.** 분석층이 안정적이므로 D151 의 개념 목록을 줄이지 않고 간다. 다음은 이 층 위에 `exec/unreachable`(정적으로 가장 확실) → `exec/order` → `state/mutation` 순으로 출제층을 얹는 것이다.