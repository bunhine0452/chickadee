# 화면 전수 스크린샷 — 24화면 × 폭 셋 × 테마 둘 = **144장**

D186 ② 가 「디자인이 이상하지 않다」를 이렇게 정의했다: **기존 게이트 일곱**(responsive ·
contrast · motion · glyph · decoration · no-retired-tokens · css-tokens) **+ 화면 전수
스크린샷을 한 곳에 모아 사람이 한 번에 본다.**

게이트가 못 재는 것이 있어서다. 넘침·대비·활자 크기·모션·글자 모양·장식·토큰은 자가 있다.
「밝게와 어둡게가 다른 화면처럼 보인다」·「진행 띠와 판이 서로 다른 자를 쓴다」·「새 판이
옛 판과 다른 손으로 그려졌다」는 **아무 자도 못 잰다.** 그래서 찍어서 본다.

| | |
|---|---|
| 찍는 자 | `scripts/shoot-screens.mjs` — `pnpm shots` |
| 하네스 | 게이트와 **같은 것**(`window.__ipc` → Node 의 better-sqlite3, `.seed/ui.sqlite` 사본) |
| 조합 | 폭 **720 · 1440 · 2560** × **밝게 · 어둡게**. 창 높이는 900 |
| 자리 | `design/system/shots/<screen>-<theme>-<width>.png` |
| 지키는 자 | `tests/gates/shots.spec.ts` — 장수 · 빈 화면 · **목록이 코드보다 뒤처졌나** |

720 은 1440 모니터의 반쪽, 2560 은 27인치 전체 화면이다(정본 §6 이 못박은 양 끝). 사이 폭은
`responsive.spec.ts` 가 여섯 폭 × 두 높이로 따로 훑는다 — 여기서는 **눈으로 보는 것**이 일이다.

---

## 1. 화면 목록

이 표가 「전수」의 정의다. 여기 없는 화면은 안 찍힌 화면이고, `tests/gates/shots.spec.ts` 가
`store.ts` 의 `Screen` 과 `stage-types.ts` 의 `StageType` 을 **소스에서 읽어** 빠진 것을 잡는다.

| # | id | 묶음 | 화면 | 무엇을 보이나 | 덮는 것 |
|---:|---|---|---|---|---|
| 1 | `firstrun` | 화면 | 첫 실행 | 리포가 0개일 때. 언어 고르기 + 「프로그래밍이 처음인가요」 한 문항. | 라우트 `first-run` |
| 2 | `ingest` | 화면 | 리포 추가 — 읽는 중 | 시간 비례 큐 하나로 진행을 말한다. 스피너 없음(정본 §3-7). | 라우트 `ingest` |
| 3 | `home` | 화면 | 홈 — 대지 · 색인 띠 | 오늘 할 것 한 장 + 아직 안 배운 문법 + 단원. 한 화면에 primary 하나. | 라우트 `home` |
| 4 | `shelf` | 화면 | 서가 | 등록된 리포 카드. 넓어지면 단이 는다(`.l-cols`). | 라우트 `repos` |
| 5 | `settings` | 화면 | 설정 | 예산 · 시간대 · 모양 · 사전 언어 · 키. 옆 패널 + 본문 두 단. | 라우트 `settings` |
| 6 | `course-toc` | 화면 | 코스 — 챕터 목차 | 부 · 챕터 · 진도. 왼쪽 목차 + 오른쪽 패널. | 코스 화면(D171) |
| 7 | `clone-course` | 화면 | 클론 코스 — 파일 목차 | 리포 하나를 순서대로 필사하는 모드(D120). 코스와 다른 화면이다. | 라우트 `clone` |
| 8 | `t0-ask` | 세션 오버레이 | 0장 판 — 미답 | 교정쇄 한 장: 물음 · 코드 창 · 보기 · **빈 판정란**. | t0 `point`·`blank`·`meaning` |
| 9 | `t0-right` | 세션 오버레이 | 0장 판 — 정답 판정란 | 판정란이 미리 비워 둔 자리에 들어온다 — 위 글이 0px 도 안 밀린다. | 판정란 · LIFER |
| 10 | `t0-wrong` | 세션 오버레이 | 0장 판 — 오답 판정란 | 오답은 빨간 면이 아니라 왼쪽 선과 낱말이다(정본 §3-1). | 오답 판정란 |
| 11 | `t0-ladder` | 세션 오버레이 | 사다리 열림 | 「?」로 여는 4단 재인쇄 사다리. 판 위에 겹치지 않고 아래로 선다. | 사다리 4단 |
| 12 | `t0-leave` | 세션 오버레이 | 이탈 확인 (Esc) | Esc 네 겹의 마지막 — 나갈지 묻는 자리. | 이탈 |
| 13 | `t2-map` | 세션 오버레이 | 구조 판 — 영향 반경 지도 | 보기 번호가 없는 판. 파일 상자를 골라 답한다 — 지도가 화면에서 가장 큰 요소다. | t2 `radius` |
| 14 | `summary` | 세션 오버레이 | 학습 요약 | 오늘 걸은 판 · 다음 인쇄일. 숫자와 막대가 진도를 말한다. | 요약 |
| 15 | `stage-exec` | 코스 판 | 코스 2단 — 실행 결과(exec) | 코드 창 + 줄 고르기. 0장 판과 같은 재료로 서야 한다. | `exec`→ChoicePlate |
| 16 | `stage-hop` | 코스 판 | 코스 2단 — 경로 추적(hop) | 지도 모양을 빌린 판. 판 너비가 `wide` 다. | `hop`→HopPlate |
| 17 | `stage-caller` | 코스 판 | 코스 2단 — 부르는 쪽(caller) | 영향 반경 지도. 상자를 골라 답한다. | `caller`→CallerPlate |
| 18 | `stage-trace-table` | 코스 판 | 코스 2단 — 값 추적 격자(trace-table) | **새 판 ①**(D187 ⑱). 시간 × 열 격자 — 720 에서 표만 흐르고 문서는 안 밀려야 한다. | `trace-table`→TraceTablePlate |
| 19 | `stage-cut` | 코스 판 | 코스 3단 — 예측 선택형(cut) | 선택형 여덟의 대표. 1·2·3단이 같은 모양을 쓴다. | `cut`→ChoicePlate |
| 20 | `stage-repair` | 코스 판 | 코스 4단 — 한 줄 수정(patch-line) | 코드 창 안의 그 줄만 입력칸이 된다. 실행 상태 넷이 여기 실린다. | `patch-line`→RepairPlate |
| 21 | `stage-reimpl` | 코스 판 | 코스 5단 — 백지 재구현(reimpl-spec) | 가장 오래 머무는 자리. 사양 위 · 편집기(Monaco) 아래. | `reimpl-spec`→ReimplPlate |
| 22 | `stage-order` | 코스 판 | 코스 5단 — 순서 맞추기(order) | **새 판 ②**(D187 ⑱). 조각을 끌어 놓는 대신 자리를 눌러 넣는다. | `order`→OrderPlate |
| 23 | `stage-stuck` | 코스 판 | 코스 판 — 막힘 패널 | 「모르겠어요」가 여는 처방. 사다리와 같은 자리·같은 종이. | 막힘 |
| 24 | `stage-done` | 코스 판 | 코스 — 단 완료 | 몇 문제 중 몇 개 · 통과 여부 · 다음 단. 낱말이 먼저고 색이 뒤다. | 단 판정 |

**유형 열여덟이 판 일곱을 나눠 쓴다.** `point`·`twin`·`blank`·`exec`·`origin`·`cut`·`reorder`·
`contract` 여덟이 `ChoicePlate` 하나로 그려지고, `patch-line`·`patch-place`·`rollback` 셋이
`RepairPlate`, `reimpl-spec`·`reimpl-layer`·`handoff` 셋이 `ReimplPlate` 다. 전수가 재는 것은
유형이 아니라 **모양**이라 여덟을 다 찍어도 사람이 보는 것은 한 장이다 — 대신 유형이 하나라도
늘면 `RENDERER_OF` 에 자리가 없어 게이트가 걸린다.

## 2. 아직 못 찍는 것 — 그리고 그 이유

빼지 않고 적는다(D186 ④ 정직성). 목록에서 빼면 다음 사람이 「전수」를 다 봤다고 믿는다.

| 무엇 | 왜 못 찍나 |
|---|---|
| **그림 일곱 (진열대)** | `packages/ui/src/dev/Gallery.tsx` 가 **어느 화면에도 마운트되지 않는다.** 앱 안에서 `Diagram`·`BitField`·`EvalTree`·`ValueBox` 를 부르는 곳이 0곳이라, 그림 열 개가 만들어졌지만 **화면에 오른 적이 없다.** 띄울 문(`?gallery=1`)이 서면 `SCREENS` 에 한 줄만 더하면 된다 |
| **T1 필사(`transcribe`)** — 편집기 · 채점 카드 · 어긋난 줄 | tiny 시드에 `block` 행이 없어 T1 판이 큐에 안 선다(`gates.ts` `T1_SKIP`). 합성으로 띄우려면 Monaco 모델과 원본 블록이 함께 있어야 해서 판 하나가 아니라 화면 한 벌이다 |
| **`value` · `step` · `table`** | `CardPayload` 에 그 셋의 모양이 **없다** — `fundamentals.md` §6 이 설계했고 마이그레이션(`0010`)이 서면 생긴다. 없는 판은 못 찍는다 |

## 3. 이상한 곳 — 무엇이 · 어디서 · 왜 · 고쳤나

그림 144장을 보고 잡은 것 **열아홉**이다. 「왜 이상한가」는 정본 §6 과 `design/system/README.md`
§7(금지 목록)의 어느 줄에 걸리는지로 적는다.

### 고쳤다 (열넷)

| 심각도 | 무엇이 | 어디서 | 왜 이상한가 | 고친 자리 |
|---|---|---|---|---|
| **심각** | 진행 띠의 첫 줄이 **9px 잘려** 글자 윗부분만 보인다 | 세션·코스 오버레이 전부, macOS(`data-chrome="overlay"`) | 잘림. `.proof` 가 `fixed; inset:0` 이라 `body` 의 `padding-top`(28px) 밖에 서는데, 신호등 자리를 덮는 **불투명한** `.chrome-drag`(z-index 90)가 그 위에 있다. 실측 — 띠 0~28 · 글자 상자 19~43 | `SessionOverlay.css` `.proof { padding-top: var(--chrome-top) }` |
| **심각** | 카드·행 목록이 **36em 에서 잘려** 칸의 오른쪽 절반이 빈다 | 서가(2560 에서 1120px 칸 안 573px) · 홈 「오늘 할 것」 목록(1120px 카드 안 541px) · 요약 「오늘 오른 숙련도」 · 인제스트의 시간 비례 목록 | 폭마다 다른 정렬. `reset.css` 의 `p·li·dd{max-width:36em}` 은 **읽는 글**의 규칙인데 카드와 행이 `<li>` 라 같이 걸린다 | `layout.css` (`.l-cols>*`·`.l-row>*`·`.l-split>*`) · `TodayCard.css` · `Summary.css` · `TimeQueue.css` |
| 중 | 진행 띠의 왼쪽 자와 판의 왼쪽 자가 **다르다** (1440 에서 116px · 2560 에서 118px) | 세션·코스 오버레이 전부 | 폭마다 다른 정렬. 띠는 `--content-max`(1120), 판은 `.ps`(880) | `JobBand.css` `.jb-line { max-width: 880px }` |
| 중 | 2560 에서 격자가 **다섯 단**까지 늘어난다 | `.l-cols` 를 쓰는 화면 전부(서가 · 홈) | D187 ⑪ 「2000px+ 는 2단 상한」 위반 | `layout.css` `@media (width >= 2000px)` + `responsive.spec.ts` 단언 |
| 중 | 코드가 **15px** 로 실리는 창이 셋 | 4단 넣은 줄 · 5단 사양·이웃 층 · T1 어긋난 줄 | D187 ⑩ 「코드 창 16px」 위반. 같은 코드가 한 화면에서 두 크기로 보인다 | `StagePlate.css`(`.cc-inserted`·`.cc-spec pre`·`.cc-files pre`) · `DiffRows.css`(`.drow`) |
| 중 | 어둡게가 **토큰에만** 있고 시스템을 안 따른다 | 전부 | D187 ⑫ 「시스템 따름 + 설정 덮어씀」의 CSS 쪽이 비어 있었다 | `sync-design.mjs` → `tokens.css` 에 `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` 블록 |
| 하 | 굵기 **600** 을 부르는 자리 여덟 | 시간 비례 목록 · T2 다섯 · T1 편집기 상태 | 활자. 굵기는 셋이다(400·500·700, §2) — 600 파일은 D182 이전 CSS 가 참조해 번들에 남은 것이고 새 규칙에서는 안 쓴다 | `TimeQueue`·`MapStatus`·`DependencyMap`·`DirectionQuiz`·`PickedChips`·`CommitSource`·`ResultGroups`·`EdStatus` → `var(--fw-medium)` |
| 하 | 전수 그림에 **뒤에 남은 화면이 딸려 나온다** | 오버레이가 선 화면 전부 | 그림이 거짓말을 한다. `fullPage` 는 문서 전체를 잇는데 `position: fixed` 인 판은 첫 창에만 그려진다 | `shoot-screens.mjs` — `.proof` 가 있으면 창만 찍는다 |
| 중 | 마스트헤드의 글이 아래 카드보다 **32px 안쪽**에 선다 | 홈 · 1440 에서 상표 x=192 대 카드 x=160 | 폭마다 다른 정렬. `.mh-in` 이 `.l-wrap`(1120 가운데 정렬)인데 그 **안쪽**에 `--pad-x` 를 또 줬다 | `Topbar.css` — 여백을 `.masthead` 바깥으로. 720·1440·2560 에서 좌우가 카드와 **한 픽셀도 안 어긋난다**(16/704 · 160/1280 · 720/1840) |
| 중 | 「네 코드에 없습니다」 한 줄이 다른 곁글과 **구분이 없다** | 0장 판, 판 머리 바로 아래 | 신호 주기. 앱이 못 하는 것을 말하는 줄인데(D186 ④) `.note` 만 붙어 회색 산문에 섞인다 | `SessionScreen.css` `.t0-absent` — `--info` 선 + `--info-bg` 면 + `--text`. 면을 칠하되 색은 뜻(「안내」)에만 |
| 하 | 인제스트 완료의 단추 둘이 **화면 칸 간격**(16~32px)으로 벌어진다 | 인제스트 — 다 읽은 뒤 | 근접성. 짝을 이루는 단추는 한 덩어리로 읽혀야 한다 | `IngestScreen.css` `.ingest-acts` — `--gap: var(--s-3)` + 위로 `--s-5` |
| 하 | 「오늘 15분」의 단추가 **칸 너비를 다 먹는다**(2560 에서 1120px 짜리 단추) | 코스 — 계획이 빈 날 | 신호 주기. 단추 크기는 중요도지 칸 크기가 아니다 | `CourseScreen.css` `.cc-today > .press-btn { justify-self: start }` |
| 하 | 3칸 스위치가 좁은 폭에서 **넘칠 수 있다** | 설정 — 밝기(시스템 따름·밝게·어둡게), `en` 라벨은 더 길다 | 넘침. `.sw span` 이 `nowrap` 인데 `.sw` 가 줄을 안 바꿨다 | `Switch.css` — `flex-wrap: wrap` + `max-width: 100%` |
| 하 | 이동 단추 셋이 **4px** 로 붙어 한 낱말로 읽힌다 | 마스트헤드 | 신호 주기. D187 ⑫ 로 밝기 스위치가 빠지면서 경계를 대신하던 테두리가 사라졌다 | `Topbar.css` `.mh-nav { gap: var(--s-2) }` |

### 안 고쳤다 — 마크업(S1)이거나 시드 밖이다 (다섯)

**첫 줄은 이 표에서 가장 큰 것이다.** 고칠 자리가 `.css` 가 아니라 `.ts`·`.html` 이라 여기서
못 고쳤고, 그동안 이 폴더의 `*-dark-*.png` 144장 중 절반이 **밝게와 바이트까지 같다.**

| 심각도 | 무엇이 | 어디서 | 왜 이상한가 | 누구 |
|---|---|---|---|---|
| **심각** | **어둡게가 설정 화면에서만 걸린다.** 홈·서가·코스·클론·인제스트·첫 실행·세션 오버레이가 늘 밝다 | 24화면 중 **23** (`*-dark-*.png` 가 `*-light-*.png` 와 바이트까지 같다) | 밝게/어둡게 불일치. `applyTheme()` 을 부르는 곳이 `useAppearance()` **훅** 하나뿐이라 그 훅이 붙은 화면에서만 산다 — D187 ⑫ 로 마스트헤드 스위치가 빠지면서 `Topbar` 가 그 훅을 놓았고, 홈까지 밝게로 굳었다. `index.html` 의 `data-theme="light"` 못박기는 CSS 의 시스템 따름(`:root:not([data-theme="light"])`)도 막는다 | **S1** — ① `boot.ts` 에서 `applyTheme(resolveTheme(mode))` 를 **창을 보이기 전에** 한 번 부르고 ② `index.html` 의 `data-theme` 을 지운다. 토큰 쪽은 이미 서 있어 그 두 줄이면 24화면이 전부 따라온다 |
| **심각** | 5단 재구현에서 **판은 밝고 편집기만 검다** | `stage-reimpl-dark-*` | 밝게/어둡게 불일치. Monaco 는 `StageOverlay` 가 넘긴 `settings.theme` 을 따르는데 화면은 안 따라서 둘이 갈렸다 | **S1** (위와 같은 뿌리) |
| 중 | `order` 판의 출처 줄이 **「내 코드 a」** 로 나온다 | `stage-order-*` | 뜻 없는 글. `OrderPlate.tsx:103` 이 `sourceOf(p.pieces[0]?.id ?? '', null)` — **조각 id 를 파일 경로 자리에** 넣는다. `order` payload 에는 `file` 이 없다 | **S1** — 출처 줄을 빼거나 챕터의 파일을 싣는다 |
| 중 | 5단에서 **「시그니처」가 두 번** 나온다(물음 아래 힌트 + `<dt>`), 30px 사이 | `stage-reimpl-*` | 없어도 되는 것이 아니라 뺏어 가는 것(§1 일관성). `ReimplPlate.tsx` 가 `Ask hint` 와 `<dt>` 에 같은 `t('chapter.reimplSig')` 를 쓴다 | **S1** |
| 하 | 「이 챕터는 값 추적 판을 굽지 못했습니다」가 판 **위에 가운데 정렬로** 뜬다 | 2단인데 `trace-table` 이 없는 챕터 | 폭마다 다른 정렬. `.bench` 가 `justify-items: center` 라 그 문장만 가운데로 서고 판은 왼쪽 자를 쓴다 | **S1** — 문장을 판 안(`PlateFrame` 위)으로 넣으면 자가 하나가 된다 |

### 실측 — 숫자로 남기는 것

| 잰 것 | 값 |
|---|---|
| 코드 창 활자 · 줄 높이 | **16px** · **29.6px**(`--fs-4` × `--lh-code` 1.85). Monaco 는 `LINE_HEIGHT 30` |
| 720 높이에서 보이는 코드 줄 | **10.4줄**. 작업대 안쪽 571px 이고 코드 창 윗변이 y=412 라 아래로 308px 이 남는다 |
| **40줄이 720 높이에 드나** | **안 든다.** 40 × 29.6 = **1184px** 이라 작업대(571px)의 두 배가 넘는다. 세로 스크롤이 답이고(정본 §6 은 가로만 금지) D141 의 20줄 접힘도 592px 라 그대로는 안 든다 |
| 행 길이 `--measure` | 36em = **576px** (한글 40.4자) |
| 판 폭 `.ps` · 진행 띠 `.jb-line` | **880 · 880** (고치기 전 880 대 1120 — 1440 에서 116px · 2560 에서 118px 어긋났다) |
| 마스트헤드 좌 · 우 = 카드 좌 · 우 | 720 **16 / 704** · 1440 **160 / 1280** · 2560 **720 / 1840** (고치기 전 32px 안쪽) |
| 대비 | **142쌍** 전부 통과. 가장 빠듯 — 본문·뜻 7.15:1 · 코드 7.17:1 · UI 경계 3.31:1 |
| 폭 셋 넘침 | 가로 스크롤 · 이탈 · 겹침 · 글자 넘침 **0** (`responsive.spec.ts` 34건, 두 엔진) |
| 어둡게가 안 걸리는 화면 | **24 중 23** — 아래 「안 고쳤다」 첫 줄. 설정 화면 하나만 따라온다 |

## 4. 색인 — 화면 × 폭, 위가 밝게 아래가 어둡게

### 1. 첫 실행 — `firstrun`

리포가 0개일 때. 언어 고르기 + 「프로그래밍이 처음인가요」 한 문항.

| 720 | 1440 | 2560 |
|---|---|---|
| ![firstrun 밝게 720](firstrun-light-720.png) | ![firstrun 밝게 1440](firstrun-light-1440.png) | ![firstrun 밝게 2560](firstrun-light-2560.png) |
| ![firstrun 어둡게 720](firstrun-dark-720.png) | ![firstrun 어둡게 1440](firstrun-dark-1440.png) | ![firstrun 어둡게 2560](firstrun-dark-2560.png) |

### 2. 리포 추가 — 읽는 중 — `ingest`

시간 비례 큐 하나로 진행을 말한다. 스피너 없음(정본 §3-7).

| 720 | 1440 | 2560 |
|---|---|---|
| ![ingest 밝게 720](ingest-light-720.png) | ![ingest 밝게 1440](ingest-light-1440.png) | ![ingest 밝게 2560](ingest-light-2560.png) |
| ![ingest 어둡게 720](ingest-dark-720.png) | ![ingest 어둡게 1440](ingest-dark-1440.png) | ![ingest 어둡게 2560](ingest-dark-2560.png) |

### 3. 홈 — 대지 · 색인 띠 — `home`

오늘 할 것 한 장 + 아직 안 배운 문법 + 단원. 한 화면에 primary 하나.

| 720 | 1440 | 2560 |
|---|---|---|
| ![home 밝게 720](home-light-720.png) | ![home 밝게 1440](home-light-1440.png) | ![home 밝게 2560](home-light-2560.png) |
| ![home 어둡게 720](home-dark-720.png) | ![home 어둡게 1440](home-dark-1440.png) | ![home 어둡게 2560](home-dark-2560.png) |

### 4. 서가 — `shelf`

등록된 리포 카드. 넓어지면 단이 는다(`.l-cols`).

| 720 | 1440 | 2560 |
|---|---|---|
| ![shelf 밝게 720](shelf-light-720.png) | ![shelf 밝게 1440](shelf-light-1440.png) | ![shelf 밝게 2560](shelf-light-2560.png) |
| ![shelf 어둡게 720](shelf-dark-720.png) | ![shelf 어둡게 1440](shelf-dark-1440.png) | ![shelf 어둡게 2560](shelf-dark-2560.png) |

### 5. 설정 — `settings`

예산 · 시간대 · 모양 · 사전 언어 · 키. 옆 패널 + 본문 두 단.

| 720 | 1440 | 2560 |
|---|---|---|
| ![settings 밝게 720](settings-light-720.png) | ![settings 밝게 1440](settings-light-1440.png) | ![settings 밝게 2560](settings-light-2560.png) |
| ![settings 어둡게 720](settings-dark-720.png) | ![settings 어둡게 1440](settings-dark-1440.png) | ![settings 어둡게 2560](settings-dark-2560.png) |

### 6. 코스 — 챕터 목차 — `course-toc`

부 · 챕터 · 진도. 왼쪽 목차 + 오른쪽 패널.

| 720 | 1440 | 2560 |
|---|---|---|
| ![course-toc 밝게 720](course-toc-light-720.png) | ![course-toc 밝게 1440](course-toc-light-1440.png) | ![course-toc 밝게 2560](course-toc-light-2560.png) |
| ![course-toc 어둡게 720](course-toc-dark-720.png) | ![course-toc 어둡게 1440](course-toc-dark-1440.png) | ![course-toc 어둡게 2560](course-toc-dark-2560.png) |

### 7. 클론 코스 — 파일 목차 — `clone-course`

리포 하나를 순서대로 필사하는 모드(D120). 코스와 다른 화면이다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![clone-course 밝게 720](clone-course-light-720.png) | ![clone-course 밝게 1440](clone-course-light-1440.png) | ![clone-course 밝게 2560](clone-course-light-2560.png) |
| ![clone-course 어둡게 720](clone-course-dark-720.png) | ![clone-course 어둡게 1440](clone-course-dark-1440.png) | ![clone-course 어둡게 2560](clone-course-dark-2560.png) |

### 8. 0장 판 — 미답 — `t0-ask`

교정쇄 한 장: 물음 · 코드 창 · 보기 · **빈 판정란**.

| 720 | 1440 | 2560 |
|---|---|---|
| ![t0-ask 밝게 720](t0-ask-light-720.png) | ![t0-ask 밝게 1440](t0-ask-light-1440.png) | ![t0-ask 밝게 2560](t0-ask-light-2560.png) |
| ![t0-ask 어둡게 720](t0-ask-dark-720.png) | ![t0-ask 어둡게 1440](t0-ask-dark-1440.png) | ![t0-ask 어둡게 2560](t0-ask-dark-2560.png) |

### 9. 0장 판 — 정답 판정란 — `t0-right`

판정란이 미리 비워 둔 자리에 들어온다 — 위 글이 0px 도 안 밀린다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![t0-right 밝게 720](t0-right-light-720.png) | ![t0-right 밝게 1440](t0-right-light-1440.png) | ![t0-right 밝게 2560](t0-right-light-2560.png) |
| ![t0-right 어둡게 720](t0-right-dark-720.png) | ![t0-right 어둡게 1440](t0-right-dark-1440.png) | ![t0-right 어둡게 2560](t0-right-dark-2560.png) |

### 10. 0장 판 — 오답 판정란 — `t0-wrong`

오답은 빨간 면이 아니라 왼쪽 선과 낱말이다(정본 §3-1).

| 720 | 1440 | 2560 |
|---|---|---|
| ![t0-wrong 밝게 720](t0-wrong-light-720.png) | ![t0-wrong 밝게 1440](t0-wrong-light-1440.png) | ![t0-wrong 밝게 2560](t0-wrong-light-2560.png) |
| ![t0-wrong 어둡게 720](t0-wrong-dark-720.png) | ![t0-wrong 어둡게 1440](t0-wrong-dark-1440.png) | ![t0-wrong 어둡게 2560](t0-wrong-dark-2560.png) |

### 11. 사다리 열림 — `t0-ladder`

「?」로 여는 4단 재인쇄 사다리. 판 위에 겹치지 않고 아래로 선다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![t0-ladder 밝게 720](t0-ladder-light-720.png) | ![t0-ladder 밝게 1440](t0-ladder-light-1440.png) | ![t0-ladder 밝게 2560](t0-ladder-light-2560.png) |
| ![t0-ladder 어둡게 720](t0-ladder-dark-720.png) | ![t0-ladder 어둡게 1440](t0-ladder-dark-1440.png) | ![t0-ladder 어둡게 2560](t0-ladder-dark-2560.png) |

### 12. 이탈 확인 (Esc) — `t0-leave`

Esc 네 겹의 마지막 — 나갈지 묻는 자리.

| 720 | 1440 | 2560 |
|---|---|---|
| ![t0-leave 밝게 720](t0-leave-light-720.png) | ![t0-leave 밝게 1440](t0-leave-light-1440.png) | ![t0-leave 밝게 2560](t0-leave-light-2560.png) |
| ![t0-leave 어둡게 720](t0-leave-dark-720.png) | ![t0-leave 어둡게 1440](t0-leave-dark-1440.png) | ![t0-leave 어둡게 2560](t0-leave-dark-2560.png) |

### 13. 구조 판 — 영향 반경 지도 — `t2-map`

보기 번호가 없는 판. 파일 상자를 골라 답한다 — 지도가 화면에서 가장 큰 요소다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![t2-map 밝게 720](t2-map-light-720.png) | ![t2-map 밝게 1440](t2-map-light-1440.png) | ![t2-map 밝게 2560](t2-map-light-2560.png) |
| ![t2-map 어둡게 720](t2-map-dark-720.png) | ![t2-map 어둡게 1440](t2-map-dark-1440.png) | ![t2-map 어둡게 2560](t2-map-dark-2560.png) |

### 14. 학습 요약 — `summary`

오늘 걸은 판 · 다음 인쇄일. 숫자와 막대가 진도를 말한다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![summary 밝게 720](summary-light-720.png) | ![summary 밝게 1440](summary-light-1440.png) | ![summary 밝게 2560](summary-light-2560.png) |
| ![summary 어둡게 720](summary-dark-720.png) | ![summary 어둡게 1440](summary-dark-1440.png) | ![summary 어둡게 2560](summary-dark-2560.png) |

### 15. 코스 2단 — 실행 결과(exec) — `stage-exec`

코드 창 + 줄 고르기. 0장 판과 같은 재료로 서야 한다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![stage-exec 밝게 720](stage-exec-light-720.png) | ![stage-exec 밝게 1440](stage-exec-light-1440.png) | ![stage-exec 밝게 2560](stage-exec-light-2560.png) |
| ![stage-exec 어둡게 720](stage-exec-dark-720.png) | ![stage-exec 어둡게 1440](stage-exec-dark-1440.png) | ![stage-exec 어둡게 2560](stage-exec-dark-2560.png) |

### 16. 코스 2단 — 경로 추적(hop) — `stage-hop`

지도 모양을 빌린 판. 판 너비가 `wide` 다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![stage-hop 밝게 720](stage-hop-light-720.png) | ![stage-hop 밝게 1440](stage-hop-light-1440.png) | ![stage-hop 밝게 2560](stage-hop-light-2560.png) |
| ![stage-hop 어둡게 720](stage-hop-dark-720.png) | ![stage-hop 어둡게 1440](stage-hop-dark-1440.png) | ![stage-hop 어둡게 2560](stage-hop-dark-2560.png) |

### 17. 코스 2단 — 부르는 쪽(caller) — `stage-caller`

영향 반경 지도. 상자를 골라 답한다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![stage-caller 밝게 720](stage-caller-light-720.png) | ![stage-caller 밝게 1440](stage-caller-light-1440.png) | ![stage-caller 밝게 2560](stage-caller-light-2560.png) |
| ![stage-caller 어둡게 720](stage-caller-dark-720.png) | ![stage-caller 어둡게 1440](stage-caller-dark-1440.png) | ![stage-caller 어둡게 2560](stage-caller-dark-2560.png) |

### 18. 코스 2단 — 값 추적 격자(trace-table) — `stage-trace-table`

**새 판 ①**(D187 ⑱). 시간 × 열 격자 — 720 에서 표만 흐르고 문서는 안 밀려야 한다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![stage-trace-table 밝게 720](stage-trace-table-light-720.png) | ![stage-trace-table 밝게 1440](stage-trace-table-light-1440.png) | ![stage-trace-table 밝게 2560](stage-trace-table-light-2560.png) |
| ![stage-trace-table 어둡게 720](stage-trace-table-dark-720.png) | ![stage-trace-table 어둡게 1440](stage-trace-table-dark-1440.png) | ![stage-trace-table 어둡게 2560](stage-trace-table-dark-2560.png) |

### 19. 코스 3단 — 예측 선택형(cut) — `stage-cut`

선택형 여덟의 대표. 1·2·3단이 같은 모양을 쓴다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![stage-cut 밝게 720](stage-cut-light-720.png) | ![stage-cut 밝게 1440](stage-cut-light-1440.png) | ![stage-cut 밝게 2560](stage-cut-light-2560.png) |
| ![stage-cut 어둡게 720](stage-cut-dark-720.png) | ![stage-cut 어둡게 1440](stage-cut-dark-1440.png) | ![stage-cut 어둡게 2560](stage-cut-dark-2560.png) |

### 20. 코스 4단 — 한 줄 수정(patch-line) — `stage-repair`

코드 창 안의 그 줄만 입력칸이 된다. 실행 상태 넷이 여기 실린다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![stage-repair 밝게 720](stage-repair-light-720.png) | ![stage-repair 밝게 1440](stage-repair-light-1440.png) | ![stage-repair 밝게 2560](stage-repair-light-2560.png) |
| ![stage-repair 어둡게 720](stage-repair-dark-720.png) | ![stage-repair 어둡게 1440](stage-repair-dark-1440.png) | ![stage-repair 어둡게 2560](stage-repair-dark-2560.png) |

### 21. 코스 5단 — 백지 재구현(reimpl-spec) — `stage-reimpl`

가장 오래 머무는 자리. 사양 위 · 편집기(Monaco) 아래.

| 720 | 1440 | 2560 |
|---|---|---|
| ![stage-reimpl 밝게 720](stage-reimpl-light-720.png) | ![stage-reimpl 밝게 1440](stage-reimpl-light-1440.png) | ![stage-reimpl 밝게 2560](stage-reimpl-light-2560.png) |
| ![stage-reimpl 어둡게 720](stage-reimpl-dark-720.png) | ![stage-reimpl 어둡게 1440](stage-reimpl-dark-1440.png) | ![stage-reimpl 어둡게 2560](stage-reimpl-dark-2560.png) |

### 22. 코스 5단 — 순서 맞추기(order) — `stage-order`

**새 판 ②**(D187 ⑱). 조각을 끌어 놓는 대신 자리를 눌러 넣는다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![stage-order 밝게 720](stage-order-light-720.png) | ![stage-order 밝게 1440](stage-order-light-1440.png) | ![stage-order 밝게 2560](stage-order-light-2560.png) |
| ![stage-order 어둡게 720](stage-order-dark-720.png) | ![stage-order 어둡게 1440](stage-order-dark-1440.png) | ![stage-order 어둡게 2560](stage-order-dark-2560.png) |

### 23. 코스 판 — 막힘 패널 — `stage-stuck`

「모르겠어요」가 여는 처방. 사다리와 같은 자리·같은 종이.

| 720 | 1440 | 2560 |
|---|---|---|
| ![stage-stuck 밝게 720](stage-stuck-light-720.png) | ![stage-stuck 밝게 1440](stage-stuck-light-1440.png) | ![stage-stuck 밝게 2560](stage-stuck-light-2560.png) |
| ![stage-stuck 어둡게 720](stage-stuck-dark-720.png) | ![stage-stuck 어둡게 1440](stage-stuck-dark-1440.png) | ![stage-stuck 어둡게 2560](stage-stuck-dark-2560.png) |

### 24. 코스 — 단 완료 — `stage-done`

몇 문제 중 몇 개 · 통과 여부 · 다음 단. 낱말이 먼저고 색이 뒤다.

| 720 | 1440 | 2560 |
|---|---|---|
| ![stage-done 밝게 720](stage-done-light-720.png) | ![stage-done 밝게 1440](stage-done-light-1440.png) | ![stage-done 밝게 2560](stage-done-light-2560.png) |
| ![stage-done 어둡게 720](stage-done-dark-720.png) | ![stage-done 어둡게 1440](stage-done-dark-1440.png) | ![stage-done 어둡게 2560](stage-done-dark-2560.png) |

---

## 5. 다시 찍는 법

```
pnpm build                 # dist 가 낡았으면 (찍는 것은 `vite preview` 가 내주는 빌드다)
pnpm shots                 # 시드 굽기 + 144장 전부
node --import tsx scripts/shoot-screens.mjs --only=home,shelf   # 몇 장만
node --import tsx scripts/shoot-screens.mjs --list              # 목록만 (찍지 않는다)
pnpm exec playwright test tests/gates/shots.spec.ts             # 그림이 규약을 지키나
```

**화면을 더할 때.** `scripts/shoot-screens.mjs` 의 `SCREENS` 에 한 줄을 더하고
(`id`·`name`·`group`·`note`·`open`, 그리고 라우트면 `route`, 코스 판이면 `renders`),
이 문서 §1 표와 §4 색인에 같은 `id` 를 더한다. 셋 중 하나라도 빠지면
`tests/gates/shots.spec.ts` 가 걸린다.

**시드에 없는 판을 띄우는 법.** `PLATES` 에 payload 를 적고 `openPlanted(page, app, '<유형>')`
를 부른다. 스크립트가 `card` 행을 그 자리에 심고 `chapter.stage_reached` 를 한 단 낮춰
「N단 시작」이 서게 만든다 — **화면과 채점기는 한 줄도 안 고친다.** payload 는
`packages/store-sql/src/schemas.ts` 의 zod 를 그대로 통과하는 진짜 모양이라, 그림에 찍히는
것은 진짜 판이고 다른 것은 그 payload 를 누가 만들었나뿐이다.

**흔들리는 것.** 그림은 시각 회귀 기준선이 **아니다**(그쪽은 `tests/visual/`). 여기 그림은
사람이 보라고 있는 것이라 몇 픽셀이 달라져도 아무도 안 깨진다 — 게이트가 재는 것은
「있나 · 비었나 · 목록이 코드를 따라오나」 셋뿐이다.
