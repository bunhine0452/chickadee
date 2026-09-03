---
schema_version: 1
type: feature
slug: "t2-dependency-map-components"
status: done
difficulty: high
created_at: "2026-09-03T18:40:58+09:00"
session_id: "20260903-008"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/t2/DependencyMap.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/DependencyMap.css"
    op: create
  - path: "apps/desktop/src/components/t2/DependencyMap.test.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/MapStatus.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/MapStatus.css"
    op: create
  - path: "apps/desktop/src/components/t2/MapStatus.test.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/PickedChips.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/PickedChips.css"
    op: create
  - path: "apps/desktop/src/components/t2/PickedChips.test.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/HintBox.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/HintBox.css"
    op: create
  - path: "apps/desktop/src/components/t2/HintBox.test.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/Verdict.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/Verdict.css"
    op: create
  - path: "apps/desktop/src/components/t2/Verdict.test.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/ResultGroups.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/ResultGroups.css"
    op: create
  - path: "apps/desktop/src/components/t2/ResultGroups.test.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/CommitSource.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/CommitSource.css"
    op: create
  - path: "apps/desktop/src/components/t2/CommitSource.test.tsx"
    op: create
related: []
tags:
  - "m4"
  - "t2"
  - "frontend"
  - "svg"
  - "a11y"
  - "mcp-tool"
---
[x] M4 T2 화면 조각 7개 — DependencyMap SVG · 결과 3티어 · 커밋 출처

## 추가 기능

`apps/desktop/src/components/t2/` 에 T2 구조 판의 화면 조각 7개. 목업 `design/src/ink/t2.js` 와
`session.css` 의 시각을 그대로 옮기되, 05 §4.2 의 13px 하한과 토큰 별칭 규칙에 맞췄다.

- `DependencyMap` — 계층 밴드 SVG. `layoutMap()`·`mapEdges()` 는 04 §7.3 의 식 그대로다
  (밴드 행 `y = PADT + r·(NH+GY)`, 가로 중앙 정렬, 포트 `span = min(NW−40, (n−1)·22)`,
  아래로 `dy = max(18, (ty−sy)·0.42)` · 역방향 제어점 30). `files` 순서를 정렬하지 않는다 —
  생성기가 barycenter 로 이미 정했다.
- `MapStatus` · `PickedChips` · `HintBox` · `Verdict` · `ResultGroups` · `CommitSource`.

## 동작 흐름

호버·포커스 둘 다 관련 엣지를 `hl`, 나머지를 `fade` 로 만들고 `onHover` 로 경로를 올려보낸다.
`MapStatus` 가 그것을 받아 「이 파일을 쓰는 곳 N · 이 파일이 쓰는 것 M」을 적되 `aria-live` 는
쓰지 않는다(05 §5 — Tab 으로 24개를 지나가면 24번 읽힌다). 판정이 색만으로 전해지지 않게
노드 `aria-label` 에 낱말을 같이 싣는다. 노드는 `React.memo` 라 호버가 24개를 다시 그리지 않는다.

`CommitSource` 는 `commit` 이 없는 카드(그래프만으로 만든 3종과 커밋 부족 폴백, D100)에서
`null` 을 돌려준다 — 안 온 출처를 적으면 그 문장이 거짓이 된다.

## 목업에 없어서 새로 그린 것 넷

- `type` 엣지 점선 — 실행 시점엔 없는 선이라 실선이면 거짓말이 된다. `.band-line` 이 이미
  쓰는 어휘다.
- `http` 엣지 이중선 — 같은 베지어를 x 로 ∓1.7px 밀어 두 줄. 엣지가 대체로 수직이라 x 이동이
  법선 이동과 같다. 화살촉은 뒤쪽 줄(`.under`)에서 떼어 앞쪽 줄에만 붙인다.
- `⟲` 순환 — 「＋ 새 파일」과 같은 모양의 배지를 왼쪽 위 모서리에. 오른쪽 위는 새 파일 자리라
  겹치지 않는다. 기호만 두면 수수께끼라 「⟲ 순환」으로 낱말을 같이 낸다.
- 접힌 폴더 — 이름 `lib/ (3)`(04 §7.4) + 상자 뒤에 5px 어긋난 상자 한 장. 점선은 이미
  missed·wrong·sec 의 뜻이라 쓸 수 없었다.

## 13px 하한 때문에 바꾼 치수

`.dir` 12.5px · `.newtag` 12px 가 `chickadee/no-font-size-below-13` 에 걸려 둘 다 `--fs-13`.
「＋ 새 파일」 배지 폭 56 → 74, **`NW` 178 → 196**(+18). 근거: 가장 긴 표본 이름
`QuantityStepper.tsx` 는 19자 × 14px 모노 = 159.6px, 왼 여백 11 을 더해 170.6px 에서 끝나는데
178 폭에서는 판정 배지 자리(`NW−22` = 156)를 이미 밟고 있었다. 196 이면 배지가 174 에서
시작해 3.4px 이 남는다. 나머지 상수(NH·GX·GY·PAD*)는 목업 그대로.

판정 원색은 전부 별칭으로 옮겼다 — `ok`→`--verdict-exact`, `missed`→`--verdict-differ`,
`sec`→`--verdict-equiv`. 면으로 칠하는 자리(「＋ 새 파일」 배지 · 막대의 놓침 칸 · 커밋 해시
도장)는 `--verdict-differ-face`/`--on-verdict-differ`(D95). 목업의
`[data-theme="dark"] .nd.sel rect{filter:none}` 은 지웠다 — filter 가 하나도 없고 다크 선택자는
T2 에 허용되지 않는다(05 §4.3). `.nd.missed` 의 `animation: blip .5s 3` 은 유한 500ms 라 그대로.

`ResultGroups` 의 `rows` 는 채점기 `T2Row`(`packages/grading/src/t2-types.ts`) 모양에 맞췄다 —
`tier: 'missed' | 'found' | 'wrong' | 'sec'`, `stat: string | null`(null 이면 「변경 없음」).

## 검증

`npx vitest run apps/desktop/src/components/t2` 43건 통과(7 파일). `npx eslint` 14파일 0건,
`npx stylelint` 7파일 0건(일부러 12px·`var(--pink)` 를 넣어 룰이 실제로 잡는 것을 확인).
`pnpm check:motion` 위반 0건, `pnpm typecheck` 10개 워크스페이스 전부 Done.