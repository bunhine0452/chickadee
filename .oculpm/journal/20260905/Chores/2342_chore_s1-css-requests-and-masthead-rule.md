---
schema_version: 1
type: chore
slug: "s1-css-requests-and-masthead-rule"
status: done
difficulty: low
created_at: "2026-09-05T23:42:03+09:00"
session_id: "20260905-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/screens/ingest/IngestScreen.css"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.css"
    op: update
  - path: "apps/desktop/src/screens/course/CourseScreen.css"
    op: update
  - path: "apps/desktop/src/components/home/Topbar.css"
    op: update
  - path: "packages/ui/src/Switch.css"
    op: update
  - path: "scripts/shoot-screens.d.mts"
    op: create
  - path: "tests/gates/shots.spec.ts"
    op: update
  - path: "design/system/shots/README.md"
    op: update
related: []
tags:
  - "design"
  - "css"
  - "responsive"
  - "theme"
  - "d186"
  - "d187"
  - "mcp-tool"
---
[x] S1 이 넘긴 CSS 요청 다섯과, 그림이 잡은 마스트헤드 32px

S1(UX)이 마크업을 올리고 `.css` 다섯을 넘겼다. 전수 스크린샷을 다시 찍어 눈으로 보고 고쳤고,
그 김에 그림이 하나를 더 잡았다.

## 변경 요약

| 무엇 | 어떻게 |
|---|---|
| `.ingest-acts` (신규) | 짝을 이루는 단추 둘은 `--gap: var(--s-3)` 로 붙여 한 덩어리로 읽히게. `.l-row` 의 `--gap`(16~32px)은 화면 칸 사이의 값이라 단추 사이로는 넓다 |
| `.t0-absent` (신규) | 「네 코드에 없습니다」 한 줄에 `--info` 선 + `--info-bg` 면 + `--text`. 장식이 아니라 **위계**로 눈에 걸리게 — 색은 뜻(정본 §6 「잠김 · 안내」)에만 |
| `.cc-today > .press-btn` | `justify-self: start`. 격자 칸을 다 먹으면 2560 에서 1120px 짜리 단추가 된다 |
| `.sw` (3칸 라디오) | `flex-wrap: wrap` + `max-width: 100%`. `en` 라벨이 더 길어 720 설정 화면에서 넘칠 자리였다 |
| `.mh-nav` | 4px → 8px. D187 ⑫ 로 스위치가 빠지면서 경계를 대신하던 테두리가 사라져 단추 셋이 한 낱말로 읽혔다 |

**그림이 더 잡은 것** — 마스트헤드의 글이 아래 카드보다 **32px 안쪽**에 섰다(1440 에서 상표
x=192 대 카드 x=160). `.mh-in` 이 `.l-wrap`(1120 가운데 정렬)인데 그 **안쪽**에 `--pad-x` 를
또 줘서다. 여백을 `.masthead` 바깥으로 옮겼다 — 화면의 `.l-page` 와 같은 셈이 되어 어느
폭에서도 세로선이 하나다.

`tests/gates/shots.spec.ts` 가 `pnpm typecheck` 를 깨던 것도 고쳤다 — `scripts/shoot-screens.d.mts`
를 두었다. `.mjs` import 는 `.d.ts` 가 아니라 **`.d.mts`** 를 찾는다. 값은 그 파일에 없다:
목록의 출처는 여전히 `.mjs` 하나이고 선언은 모양만 적는다.

## 검증

실측(720·1440·2560): 마스트헤드 좌·우가 카드와 **한 픽셀도 안 어긋난다** — 16/704 · 160/1280 ·
720/1840. `pnpm lint` · `pnpm typecheck` · `pnpm design:check` · `pnpm check:contrast`(142쌍) ·
`pnpm check:motion` 초록. `playwright test tests/gates --workers=2` **202 passed · 0 failed**
(기본 4워커에서는 `startSession` 대기가 흔들린다 — CI 는 2워커다). 스크린샷 144장 다시 찍었다.

## 메모

**어둡게가 더 나빠졌다.** D187 ⑫ 로 마스트헤드 스위치가 빠지면서 `Topbar` 가 `useAppearance()`
훅을 놓았고, 이제 `applyTheme()` 을 부르는 화면이 **설정 하나**다 — 전수 그림 24화면 중 **23**의
`*-dark-*.png` 가 `*-light-*.png` 와 바이트까지 같다. 토큰 쪽(`@media (prefers-color-scheme: dark)`)
은 이미 서 있으므로 고칠 것은 두 줄이다: `boot.ts` 에서 창을 보이기 전에 `applyTheme` 를 한 번
부르고, `index.html` 의 `data-theme="light"` 못박기를 지운다. 그 못박기가 CSS 의 시스템 따름
(`:root:not([data-theme="light"])`)까지 막고 있다. 둘 다 `.css` 밖이라 여기서 못 고쳤다.