---
schema_version: 1
type: feature
slug: "generator-quality-gate"
status: done
difficulty: medium
created_at: "2026-09-04T13:01:12+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "98c786a8-97f4-4381-98c1-da629e144769"
language: "ko"
verified_by_user: false
files_touched:
  - path: "tests/support/quality.test.ts"
    op: create
  - path: "tests/tsconfig.json"
    op: update
  - path: "docs/00-overview.md"
    op: update
related: []
tags:
  - "D132"
  - "cards"
  - "quality-gate"
  - "mcp-tool"
---
[x] 생성기 집합 품질 게이트 — 유형 쏠림 99.5% 를 처음 재다

사용자 보고 「문제의 수준이 좋은지 나쁜지 모르겠다」에 대한 답. 결정 등록부 D132.

## 추가 기능

`tests/support/quality.test.ts` — 시드 리포(`fixtures/ipc/tiny`, 개념 15) × 시드 20번으로
판을 대량으로 굽고 두 경로를 따로 잰다.

- **새 판**(`generateT0`) — 유형을 생성기가 고르고 사용처 사슬을 탄다. 사용자가 매일 만나는 길.
- **재출제**(`generateKind`) — 유형을 고정하고 첫 사용처에만 건다 (04 §2.3).

재는 것 다섯: 드롭률과 사유 상위 · 유형 쏠림 · 정답 위치 1~4 분포 · 보기 중복 ·
평문으로 그려지는 자리(`edge.code`·`mono` 보기)의 HTML 엔티티 누출. 임계를 넘으면 실패하고,
통과해도 표를 찍는다 — 사람이 수준을 눈으로 보는 자리가 그 표다.

## 동작 흐름

`buildSeed` 로 시드 DB 를 굽고 IPC 를 그 위로 돌린다(D108 과 같은 다리). `card.gap_reason` 을
가로채 드롭 사유를 세고, 경로마다 `MAX(card.id)` 를 표시로 남겨 **그 경로가 새로 만든 고유
판만** 뜯어본다(`content_hash` 가 유일하므로 「만듦」과 「고유 판」이 다르다).

첫 실측:

```
새 판   만듦 300 · 고유 판 194 · 드롭 0 (0.0%)
        유형 point 1 (0.5%) · blank 0 (0.0%) · meaning 193 (99.5%)
        정답 위치 62 50 47 49 — 최대칸 29.8%
재출제  point    20/300 만듦 · 93.3% 드롭 — 240× 짚을 후보가 3개에 못 미친다
        blank     0/300 만듦 · 100% 드롭 — 280× 이 사용처에는 구멍(@hole)이 없다
        meaning 300/300 만듦 · 0% 드롭
```

**이 시드에서는 사실상 의미형 한 유형만 나온다.** 원인은 생성기가 아니라 사전 질의
(`dictionary/**/*.scm`)다 — 지목형은 짚을 후보가 3개에 못 미쳐, 빈칸형은 `@hole` 이 없어
떨어진다. 유형 쏠림 임계는 목표(0.8)와 오늘의 실측 래칫(0.996)을 따로 두었다: 게이트는
래칫으로 판정하고 목표까지의 거리는 표가 매번 찍는다. 임계를 오늘 값에 맞추고 목표를
지우면 그 거리가 안 보인다.

D128 의 「정답 위치 분포 실측」은 이 게이트의 한 열로 흡수된다. 새 판 경로의 최대칸은 29.8%
(균등 25%)로 임계 45% 안이다 — 보고된 「정답이 늘 2번」은 지목형의 것인데 이 시드에서는
지목형 고유 판이 1장뿐이라 여기서는 재지 못한다.

## 검증

`pnpm vitest run tests/support/quality.test.ts` 통과(1.8초) · `pnpm test:unit` 1,753 통과
(이 파일 포함) · `pnpm lint` · `pnpm -r typecheck` 통과. 게이트가 앱의 `data/cards.ts` 를
부르느라 `@chickadee/ui` 의 `.tsx` 까지 타입 사슬이 닿아 `tests/tsconfig.json` 에
`"jsx": "react-jsx"` 한 줄을 더했다.

## 메모

시드가 파일 5개 · 개념 15개라 **수치는 이 픽스처의 것**이다. 더 큰 리포에서는 지목형·빈칸형
후보가 더 나올 수 있다 — 그 확인은 `projectox` 급 시드를 굽는 일과 같이 와야 한다(06 §1.2).