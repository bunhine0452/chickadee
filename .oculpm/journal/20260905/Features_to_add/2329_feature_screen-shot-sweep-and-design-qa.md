---
schema_version: 1
type: feature
slug: "screen-shot-sweep-and-design-qa"
status: done
difficulty: high
created_at: "2026-09-05T23:29:21+09:00"
session_id: "20260905-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "scripts/shoot-screens.mjs"
    op: create
  - path: "tests/gates/shots.spec.ts"
    op: create
  - path: "design/system/shots/README.md"
    op: create
  - path: "scripts/sync-design.mjs"
    op: update
  - path: "tests/gates/responsive.spec.ts"
    op: update
  - path: "design/system/README.md"
    op: update
  - path: "design/system/responsive.md"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "apps/desktop/src/styles/layout.css"
    op: update
  - path: "apps/desktop/src/components/session/SessionOverlay.css"
    op: update
  - path: "apps/desktop/src/components/session/JobBand.css"
    op: update
  - path: "apps/desktop/src/components/session/Summary.css"
    op: update
  - path: "apps/desktop/src/components/home/TodayCard.css"
    op: update
  - path: "apps/desktop/src/components/shell/TimeQueue.css"
    op: update
  - path: "apps/desktop/src/components/t1/DiffRows.css"
    op: update
  - path: "apps/desktop/src/screens/course/StagePlate.css"
    op: update
  - path: "package.json"
    op: update
related: []
tags:
  - "design"
  - "gates"
  - "screenshots"
  - "responsive"
  - "theme"
  - "d186"
  - "d187"
  - "d188"
  - "mcp-tool"
---
[x] 화면 전수 스크린샷 144장과 그것이 잡은 열셋 — D186 ② · D187 ⑩⑪⑫

## 추가 기능

D186 ② 가 「디자인이 이상하지 않다」를 **기존 게이트 일곱 + 화면 전수 스크린샷**으로 정의했는데
찍을 자가 없었다. 셋을 만들었다.

1. **`scripts/shoot-screens.mjs`** (`pnpm shots`) — 24화면 × 폭 셋(720·1440·2560) × 테마 둘 =
   **144장**을 `design/system/shots/` 에 둔다. 하네스는 게이트와 **같은 것**이다
   (`window.__ipc` → Node 의 better-sqlite3, `.seed/ui.sqlite` 사본). 시드에 없는 판
   (`trace-table`·`order`·4단·5단)은 `card` 행을 그 자리에 심고 `chapter.stage_reached` 를 한 단
   낮춰 **진짜 화면**을 띄운다 — payload 는 `schemas.ts` 의 zod 를 그대로 통과하는 모양이고
   화면·채점기는 한 줄도 안 고쳤다.
2. **`tests/gates/shots.spec.ts`** — ① 장수 = 목록 × 6 이고 남는 그림도 없다 ② 0바이트·빈 화면이
   없다(160×90 으로 줄여 잰 밝기 표준편차 ≥ 4 — 가장 조용한 진짜 그림이 7.3) ③ **목록이 코드보다
   뒤처지지 않았다**: `store.ts` 의 `Screen` 과 `stage-types.ts` 의 `StageType` 을 소스에서 읽어
   새 화면·새 유형이 목록에 없으면 걸린다. 못 찍는 셋은 `NOT_SHOT` 에 사유와 함께 남겼다(D186 ④).
3. **`design/system/shots/README.md`** — 화면 목록 표 · 못 찍는 것 · 「이상한 곳」 열셋 · 실측 ·
   격자 색인(화면마다 폭 셋 × 두 줄) · 다시 찍는 법.

결정 셋도 CSS 쪽을 채웠다.

- **D187 ⑩ 코드 창 16px** — Monaco·`.code`·`.cc-window` 는 이미 16px 이었고, 15px 로 남아 있던
  코드 창 셋(`.cc-inserted`·`.cc-spec pre`·`.drow`)을 올렸다.
- **D187 ⑪ 2000px+ 2단 상한** — `.l-cols` 가 2000 이상에서 두 단에서 멈춘다. 「단」은 **300px 이상
  트랙이 셋 이상인 격자**로 정의했다(숫자 넷을 늘어놓은 셈 줄은 단이 아니다). `responsive.spec.ts`
  가 화면 일곱마다 2560 에서 잰다.
- **D187 ⑫ 테마 CSS** — `sync-design.mjs` 가 어두운 한 벌을
  `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` 에 한 번 더 낸다.
  값의 출처는 여전히 `design/system/tokens.css` 하나다.

## 동작 흐름

`pnpm shots` → 시드 굽기 → `vite preview` 기동 → 화면마다 테마 둘로 컨텍스트를 새로 열고
(`settings.theme`·`theme_mode` 를 DB 에 못박아 그림이 이 기계의 시스템 설정에 안 달리게 한다)
열어 둔 채 폭 셋을 훑는다. `.proof`(오버레이)가 서 있으면 `fullPage` 를 끄고 창만 찍는다 —
`fixed` 인 판은 첫 창에만 그려져서, 안 끄면 뒤에 남은 화면이 그림 아래에 딸려 나온다.

## 그림이 잡은 것 — 열셋 (고침 여덟 · S1 다섯)

고친 것 가운데 큰 둘.

- **진행 띠의 첫 줄이 9px 잘렸다** (macOS, 세션·코스 오버레이 전부). `.proof` 가 `fixed; inset:0`
  이라 `body` 의 `padding-top`(28px) 밖에 서는데, 신호등 자리를 덮는 **불투명한** `.chrome-drag`
  (z-index 90)가 그 위에 있다 — 실측 띠 0~28 · 글자 상자 19~43. `responsive.spec.ts` 가
  `.chrome-drag` 를 SKIP 에 넣어서 게이트가 못 잡았다(D183 과 같은 종류의 사고다).
- **카드·행 목록이 36em 에서 잘려** 칸의 오른쪽 절반이 빈다. `reset.css` 의 `p·li·dd{max-width:36em}`
  은 읽는 글의 규칙인데 카드와 행이 `<li>` 라 같이 걸린다 — 2560 서가에서 카드가 1120px 칸 안에서
  **573px**, 홈 「오늘 할 것」이 541px 이었다. `layout.css` 가 `.l-cols>*`·`.l-row>*`·`.l-split>*`
  에서 상한을 풀고, 나머지 넷은 자기 자리에서 푼다.

## 검증

`pnpm lint`(eslint + stylelint) · `pnpm design:check`(2개 생성물 바이트 일치) ·
`pnpm check:contrast`(142쌍) · `pnpm check:motion`(위반 0) 전부 초록.
`pnpm test:gates` 201 passed — `responsive.spec.ts` 34건(가로 스크롤·이탈·겹침·넘침 0, 2560 단 수 ≤ 2)과
`shots.spec.ts` 13건 포함. WebKit `학습 — 요약` 한 건이 한 번 흔들렸고(`startSession` 대기 초과)
따로 다시 돌려 통과했다 — cb4b0d1 이 고친 것과 같은 WebKit 흔들림이고 이 변경과 무관하다.
`pnpm test:unit` 은 `packages/dictionary/src/dict.test.ts`(DEBT_RATCHET, S6 소관) 한 건만 빨갛고
나머지 2,581건 통과.

## 메모

**실측** — 코드 창 16px · 줄 높이 29.6px. 720 높이에서 작업대 안쪽이 571px 이고 코드 창 윗변이
y=412 라 **10.4줄**이 보인다. **40줄은 안 든다** — 40 × 29.6 = 1184px 로 작업대의 두 배가 넘고,
D141 의 20줄 접힘(592px)도 그대로는 안 든다. 세로 스크롤이 답이다(정본 §6 은 가로만 금지).

**S1 에 넘긴 다섯** — ① 어둡게가 홈·설정에서만 걸린다(24화면 중 12가 밝게와 바이트까지 같다).
`applyTheme()` 을 부르는 곳이 `useAppearance()` 뿐이고 그 훅이 `Topbar`·`SettingsScreen` 에만 붙어
있다. `index.html` 의 `data-theme="light"` 못박기도 CSS 의 시스템 따름을 막는다 → `boot.ts` 에서
한 번 세우고 그 속성을 지운다 ② 5단에서 판은 밝고 Monaco 만 검다(같은 뿌리) ③ `OrderPlate.tsx:103`
이 `sourceOf(p.pieces[0]?.id ?? '', null)` 로 **조각 id 를 파일 경로 자리에** 넣어 판 머리가
「내 코드 a」다 ④ 5단에서 「시그니처」가 30px 사이로 두 번 나온다 ⑤ 「값 추적 판을 굽지 못했습니다」가
판 위에 가운데 정렬로 뜬다(`.bench` 의 `justify-items: center`).