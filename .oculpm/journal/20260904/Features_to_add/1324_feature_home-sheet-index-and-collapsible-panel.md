---
schema_version: 1
type: feature
slug: "home-sheet-index-and-collapsible-panel"
status: done
difficulty: medium
created_at: "2026-09-04T13:24:26+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "98c786a8-97f4-4381-98c1-da629e144769"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/home/SheetIndex.tsx"
    op: create
  - path: "apps/desktop/src/components/home/SheetIndex.css"
    op: create
  - path: "apps/desktop/src/components/home/SheetIndex.test.tsx"
    op: create
  - path: "apps/desktop/src/components/home/Panel.tsx"
    op: update
  - path: "apps/desktop/src/components/home/Panel.css"
    op: update
  - path: "apps/desktop/src/screens/home/HomeScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/HomeScreen.css"
    op: update
  - path: "apps/desktop/src/screens/home/data.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/05-frontend.md"
    op: update
related: []
tags:
  - "D133"
  - "home"
  - "layout"
  - "mcp-tool"
---
[x] 홈이 대지 한 장과 색인 띠가 됐다 — 길이가 리포 크기와 무관해진다

사용자 보고 「리포가 클수록 창이 너무 길어진다」. 결정 등록부 D133.

## 추가 기능

- `components/home/SheetIndex.tsx`/`.css` 신설 — 대지마다 칩 하나(판번호 · 이름 · 진행 `n/m` ·
  진행 막대)가 **가로 한 줄**로 선다. `role="tablist"`, 칩은 `role="tab"` 이고 roving
  tabindex 라 탭 순서에는 고른 칩 하나만 있다. `← →` 로 옮기면 그 자리에서 걸리고(자동 활성)
  `Home`·`End` 가 양 끝이다. 칩 안의 이름은 잘릴 수 있어 읽히는 이름은 `aria-label` 이 든다.
- `HomeScreen` 은 고른 대지 **한 장만** `Sheet` 로 그린다(`role="tabpanel"`). 아직 안 골랐으면
  인쇄 중인 대지가 걸린다.
- `Panel` 에 `collapsible`·`defaultOpen` 을 더했다. 「잉크 겹」 패널을 접힌 채 연다 —
  접힌 속은 지우지 않고 `hidden` 으로만 덮는다. 「구멍 지도」는 접지 않는다: `prereq.noPlate`
  같은 다른 화면 문구가 그 안의 「판 만들기」를 가리킨다.

## 동작 흐름

실측이 근거다. 목업 홈 2,118px(대지 4장) · 대지 한 장 276px + 간격 24 = **장당 300px** ·
왼쪽 단은 대지가 0장이어도 1,719px. 대지 20개면 오른쪽 단만 6,000px(창 860 기준 7화면),
50개면 15,000px 이라 **상한을 두는 것으로는 부족하고 O(1) 로 만들어야** 했다.

D81·D105 의 윈도잉(`WINDOW_SHEETS` · `data-windowed` · `content-visibility`)은 함께 걷었다 —
화면 밖 대지가 DOM 에 아예 없으니 가시성 판정을 걸 대상이 없다. 05 §10 이 화면당 40개로
제한한 `<use>` Dee 가 391개였던 것(D115)도 대지 한 장치로 줄어든다.

시드(`fixtures/ipc/tiny`)는 대지가 0장이라 띠가 뜨지 않는다 — 실측은 왼쪽 단만으로
**2,022 → 1,703px**(잉크 겹 패널 접기)이고, 대지가 있는 리포의 효과는 그보다 훨씬 크다.

## 검증

`pnpm test:unit` 1,760 통과(`SheetIndex.test.tsx` 4건 신설) · `pnpm lint` · `pnpm -r typecheck` ·
`pnpm test:gates` 114 통과(axe serious 0 · 대비 · 행 길이 포함) · `pnpm test:e2e-ui` 24 통과.
브라우저로 홈을 띄워 접힌 패널과 페이지 높이를 눈으로 확인했다.