---
schema_version: 1
type: bug
slug: "poster-font-synthetic-bold-boxes"
status: done
difficulty: medium
created_at: "2026-09-05T14:29:58+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/styles/app.css"
    op: update
  - path: "apps/desktop/src/screens/course/CourseScreen.css"
    op: update
  - path: "apps/desktop/src/components/home/Masthead.tsx"
    op: update
  - path: "apps/desktop/src/components/home/Masthead.css"
    op: update
  - path: "apps/desktop/src/screens/session/T0Plate.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/PlateFrame.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/LiferNote.tsx"
    op: update
  - path: "apps/desktop/src/components/session/Summary.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.tsx"
    op: update
  - path: "packages/i18n/src/ko/session.ts"
    op: update
  - path: "packages/i18n/src/en/session.ts"
    op: update
  - path: "tests/e2e-ui/t0-session.spec.ts"
    op: update
related: []
tags:
  - "폰트"
  - "시각"
  - "D178"
  - "D179"
  - "촬영"
  - "mcp-tool"
---
[x] 한글 제목이 검은 상자로 찍혔다 — 합성 굵게가 이미 굵은 폰트의 획을 메웠다

## 발생 원인

완성본 촬영 중 코스 화면에서 「오▮ 15▮」·「▮그인」처럼 일부 한글이 **검은 상자**로 찍혔다. 「오」·「그」·「인」은 멀쩡한데 「늘」·「분」·「로」·「제」·「련」만 뭉갰다.

세 가지를 차례로 배제했다. ① **글리프 누락 아님** — `fontTools` 로 읽으니 `BlackHanSans-Regular.woff2` 에 2,733자가 있고 한글 음절 2,581자 **전부 윤곽선이 있다**. ② **크기 문제 아님** — 16~44px 열 단계로 렌더하니 전부 정상. ③ **폰트 로드 아님** — `document.fonts.check('24px "Black Han Sans"')` 가 참.

**진짜 원인은 합성 굵게다.** Black Han Sans 는 400 하나뿐인데 `h1`~`h3` 의 기본 `font-weight: bold` 가 걸리면 브라우저가 굵기를 합성한다. 이미 극단적으로 굵은 디스플레이 폰트에 획을 더 불리면 **속공간이 메워져 글자가 통째로 검은 덩어리**가 된다. 획이 많은 음절부터 먼저 무너지므로 「늘·분·로」가 걸리고 「오·그·인」은 살아남았다. 가중치를 400·500·600·700·800 으로 렌더해 600부터 무너지는 것을, 그리고 `font-synthesis-weight: none` 이 700 에서도 멀쩡한 것을 확인했다.

코스 화면(D171)이 처음 `h2` 에 이 폰트를 얹으면서 드러났지만, **다른 화면의 `h1`·`h2` 도 같은 조건이었다.**

## 해결 방법

`--f-poster` 를 쓰는 규칙 **21곳 전부**에 `font-weight: 400`(이미 굵기를 정한 셋은 제외)과 `font-synthesis-weight: none` 을 못박았다. 근거 주석은 `app.css` 의 `.wordmark` 한 곳에 남겨 다음 사람이 이유를 찾게 했다.

함께 걷어낸 것 셋 — 마스트헤드의 「Risograph Study Press」(컴포넌트에 하드코딩돼 D178 평문화가 못 지나갔다) · 판정 도장의 영어 부제 `in register`·`off register`·`LIFER`(도장이 이미 「같음」·「다름」·「첫 관찰」을 말한다) · 세션 머리의 `Run N`(→ `band.runNo` = 「{{n}}번째 학습」).

## 검증

`pnpm typecheck`·`pnpm lint` 무출력 · `pnpm test:unit` **2,305 통과 / 실패 0** · `check:contrast` 48쌍 · `design:check` 일치 · `test:gates` **114**(chromium+webkit) · `test:e2e-ui` **26**(양 엔진). 촬영을 다시 돌려 일곱 화면 전부 상자 0개를 눈으로 확인했다.

## 메모

디자인 게이트가 이것을 못 잡았다 — 활자 크기·대비·행 길이·모션은 재는데 **글자가 실제로 읽히는 모양인지**는 안 잰다. 스크린샷을 사람이 보지 않았으면 그대로 나갔을 자리다.