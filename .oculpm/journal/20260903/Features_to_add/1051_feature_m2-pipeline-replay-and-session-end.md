---
schema_version: 1
type: feature
slug: "m2-pipeline-replay-and-session-end"
status: done
difficulty: medium
created_at: "2026-09-03T10:51:08+09:00"
session_id: "20260903-003"
agent:
  id: "claude-code"
  version: "Opus 5"
language: "ko"
verified_by_user: false
files_touched: []
related: []
tags:
  - "m2"
  - "integration"
  - "perf"
  - "handoff"
  - "mcp-tool"
---
[x] M2 마무리 — Rust 덤프 재생 통합 테스트, 세션 종료 배선, M3 인계

## 추가 기능

**Q4 통합** — `apps/desktop/src/data/pipeline.test.ts` 가 `fixtures/ipc/tiny/`(Rust 파이프라인 테스트가 실제로 쓴 JSON)를 읽어 사용처를 파생하고 **진짜 사전으로 카드를 만든 뒤** 오답 → 다시 찍기 → 사다리 2단 → 복귀 → 요약까지 돈다. 다른 세션 테스트는 카드를 손으로 넣지만 이 파일은 안 넣는다 — 사전이 비면 여기가 먼저 빨개진다.

**Q3 골든·property** — T0 채점 골든 6건(`packages/grading/src/__golden__/t0/*.json`, 각 케이스가 04 규칙을 `rule` 로 참조) + fast-check 속성 5개(1,000회, seed 20260902).

**Q5 일부** — 목업 `__audit` 의 `fonts`·`contrast`·`measure` 를 `devtools/gates.ts` 로 옮겼고 `scripts/check-motion.mjs` 가 모션 상한을 정적으로 본다.

**세션 종료 배선** — `card_state`(prints·stage·실측 EMA α=0.3) · `unknown_count` 재계산(02 §6.1) · 초보 감지 플래그(02 §6.4).

**성능** — 헤드리스 실측: 큐 짜기(만기 60·후보 200) < 0.05 ms · 판 완료 계산 < 0.02 ms · 원장 1,000행 재생 약 8 ms.

## 이번에 잡은 것

- **property (c) 가 규칙 버그를 잡았다.** 같은 날 「모르겠어요」를 두 번 누르면 두 겹이 내려갔다. 02 §3.3 의사코드는 매번 −1 인데 06 §1.3 은 「두 번 눌러도 더 안 내림」을 요구한다. 06 이 맞다 — 천장은 하루 한 번만 오르는데 바닥만 무제한이면 사다리를 두 번 연 사람이 손해를 본다(D78).
- **맥락 줄을 못 읽으면 코드 판이 빈 카드가 나왔다.** 통합 테스트가 잡았다. `excerpt` 한 줄로 물러선다 — 좁은 판이 빈 판보다 낫다.
- **`finishPlate` 가 `card_state` 를 부르는 쪽에서 받으면 안 된다.** 판을 마치는 곳이 셋인데 하나만 빠뜨려도 인쇄 횟수가 1 에 멈춘다. 첫 판이 실제로 그렇게 실패했다 — 읽기를 안으로 옮겼다.

## 미측정 · 미완

- **WKWebView 프레임 수치는 여전히 없다.** `m1-05-wkwebview-perf` 와 `m2-01-perf-bench` 둘 다 `blocked` — macOS GUI 에서 사람이 한 번 돌려야 한다(`audit.ts` 의 `HOW`).
- **Playwright 7게이트 하네스가 없다**(`m2-06-q5-audit-port` 는 `in_progress`). 브라우저가 필요해 M5 의 E2E 하네스와 같이 놓는 편이 맞다고 보고 미뤘다.

## 검증

`pnpm vitest run` — 97 파일 861 테스트 통과. `eslint`·`stylelint`·`typecheck` 무출력. 번들 JS 257 KB gzip(예산 350) · CSS 11 KB gzip(예산 60). `check:contrast` 46쌍 · `check-motion` 위반 0 · Rust 예산 2,043/2,300.