---
schema_version: 1
type: refactor
slug: "g3-home-course-shelf-redesign"
status: done
difficulty: high
created_at: "2026-09-05T16:08:05+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/screens/home/HomeScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/HomeScreen.css"
    op: update
  - path: "apps/desktop/src/screens/home/HomeScreen.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/locale-en.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/empty.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/empty.css"
    op: update
  - path: "apps/desktop/src/components/home/Topbar.tsx"
    op: create
  - path: "apps/desktop/src/components/home/Topbar.css"
    op: create
  - path: "apps/desktop/src/components/home/TodayCard.tsx"
    op: create
  - path: "apps/desktop/src/components/home/TodayCard.css"
    op: create
  - path: "apps/desktop/src/components/home/UnitList.tsx"
    op: create
  - path: "apps/desktop/src/components/home/UnitList.css"
    op: create
  - path: "apps/desktop/src/components/home/GapList.tsx"
    op: create
  - path: "apps/desktop/src/components/home/GapList.css"
    op: create
  - path: "apps/desktop/src/components/home/Notice.tsx"
    op: create
  - path: "apps/desktop/src/components/home/Notice.css"
    op: create
  - path: "apps/desktop/src/components/home/labels.ts"
    op: update
  - path: "apps/desktop/src/components/home/labels.test.ts"
    op: update
  - path: "apps/desktop/src/components/home/Masthead.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/TodayPanel.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/Board.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/Sheet.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/SheetIndex.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/Node.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/NodeDetail.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/InkScale.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/InkRail.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/ColorBar.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/ConceptList.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/Forecast.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/GapsPanel.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/LockedPanel.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/Newcomer.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/Panel.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/Guide.tsx"
    op: delete
  - path: "apps/desktop/src/App.tsx"
    op: update
  - path: "apps/desktop/src/screens/repos/ReposScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/repos/ReposScreen.css"
    op: update
  - path: "apps/desktop/src/screens/repos/RepoSwitcher.tsx"
    op: update
  - path: "apps/desktop/src/screens/repos/RepoSwitcher.css"
    op: update
  - path: "apps/desktop/src/screens/repos/CloneField.css"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.css"
    op: update
  - path: "apps/desktop/src/screens/settings/KeyPanel.css"
    op: update
  - path: "apps/desktop/src/screens/ingest/IngestScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/ingest/IngestScreen.css"
    op: update
  - path: "apps/desktop/src/screens/course/CourseScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/CourseScreen.css"
    op: update
  - path: "apps/desktop/src/screens/course/ChapterToc.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/ChapterPanel.tsx"
    op: update
  - path: "apps/desktop/src/screens/clone/CloneScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/clone/CloneScreen.css"
    op: update
  - path: "apps/desktop/src/screens/clone/CourseToc.tsx"
    op: update
  - path: "apps/desktop/src/screens/clone/CourseToc.css"
    op: update
  - path: "packages/i18n/src/ko/home.ts"
    op: update
  - path: "packages/i18n/src/en/home.ts"
    op: update
  - path: "packages/i18n/src/ko/core.ts"
    op: update
  - path: "packages/i18n/src/en/core.ts"
    op: update
  - path: "tests/e2e-ui/shell.spec.ts"
    op: update
  - path: "tests/e2e-ui/t1-t2.spec.ts"
    op: update
related: []
tags:
  - "d182"
  - "ui"
  - "home"
  - "course"
  - "responsive"
  - "a11y"
  - "mcp-tool"
---
[x] 홈·코스·서가·설정·첫 실행·인제스트를 하나의 초점으로 다시 짰다 (D182)

## 동기

D182 가 리소그래프 시각 시스템을 폐기했다. 어휘만 평문으로 바꾼 D178·D179 는 반쪽이었다 —
낱말이 바뀌어도 홈은 여전히 인쇄 대지 위에 스티커를 붙인 화면이었다.

정본 §6 의 「하나의 초점」·「장식 0」으로 홈을 다시 재면 요소가 너무 많았다. 학습자가 홈에서
할 일은 **하나**다: 오늘 학습을 시작한다. 그런데 화면에는 마스트헤드 넉 칸 · 오늘 할 것 ·
숙련도 사다리 · 단원 색인 띠 · 대지 한 장 · 개념 스티커 격자 · 도장 카드 · 14일 막대 ·
아직 안 배운 문법 · 다시 풀 개념 · 미조판 예고 둘이 있었다.

## 변경 요약

### 홈 — 뺀 것과 이유

화면의 모든 요소가 작업 기억을 쓴다. 읽고 나서 **할 일이 바뀌지 않는 것**을 뺐다.

| 뺀 것 | 왜 |
|---|---|
| 오늘 요약 넉 칸(리포·날짜·연속·평균 숙련도) | 리포는 스위처가, 연속은 오늘 카드 한 줄이 말한다. 날짜는 OS 가, 평균 숙련도는 아무 행동도 안 바꾼다 |
| 도장 카드(도장 + 14칸 격자 + 날짜) | 그림. 연속 학습은 숫자 한 줄이면 된다 (정본 §3-7) |
| 지난 14일 막대(`ColorBar`) | 이력이지 오늘 할 일이 아니다 |
| 숙련도 사다리(`InkScale` 5칸 + 설명 두 문단) | 집계라 다음 행동을 안 바꾼다 |
| 다시 풀 개념 목록(`ConceptList`) | 만기 개념이 곧 오늘 큐다 — 「오늘 할 것」과 같은 말을 두 번 했다 |
| 개념 스티커 격자(`Node`) + 상세 팝오버(`NodeDetail`) | 개념 하나에 90px 카드 + 지터 + 도장. 목록 한 줄(이름 · 트랙 · 숙련도 · 상태)로 갈았다 |
| 미조판 예고 두 종(`Forecast`) | 「아직 없다」를 두 문단으로 말했다. 「책임 배치」쪽만 「아직 못 하는 것」 문단으로 살렸다(D170 ⑤) |
| 길잡이 한 줄(`Guide`) | 「오늘 할 것」이 그 일을 한다 |
| 마스코트(`DeeSprite`·`DeeLogo`) | 정본 §7 |
| 「장식 보이기·숨기기」 스위치 | D182 가 장식을 토큰째 지웠으니 끌 것이 없다 |

**남긴 구조** — 맨 윗줄(상표 · 리포 스위처 · 코스/서가/설정 · 밝게·어둡게) → **오늘 할 것**
(화면에서 가장 크고 가장 진하다) → 단원 목록 + 아직 안 배운 문법(무게가 비슷한 두 덩이,
좁으면 한 단 넓으면 두 단).

밝게·어둡게 스위치는 맨 윗줄에 남겼다. 방의 밝기에 따라 실제로 매일 바뀌는 값이라
설정까지 두 걸음을 걸으면 안 바꾸게 된다.

### 다른 화면

- **코스** — 목차 진행 막대의 점무늬를 걷고, 「오늘 15분」만 테두리 한 단 진하게(하나의 초점).
- **서가** — 카드 격자(`.l-cols`). 못 읽는 리포는 `--warn` 면, 지우기 확인은 `--bad` 면.
- **설정** — 섹션 하나가 카드 하나. 「장식 숨김」 스위치를 뺐다.
- **첫 실행** — 마스코트·종이 질감을 걷고 물음 둘 + 리포 넣는 문 하나.
- **인제스트** — 시간 비례 큐 그대로, 옛 토큰만 갈았다.

### 뼈대와 토큰

- `components/shell/Page`·`Split`(G2)로 여섯 화면의 `<main>` 을 통일했다. 화면마다 손으로
  짠 격자·미디어 쿼리를 지웠다 — 반응형 규칙이 한 군데에만 산다.
- 옛 토큰(`--paper*`·`--ink*`·`--t0/1/2`·`--verdict-*`·`--f-poster` …)이 내 범위에서 0 이다.
- `--text-faint` 는 **글자에 안 쓴다** — 표면 위 5.81:1 이라 대비 게이트(7:1)를 못 넘는다.
  전부 `--text-muted` 로 올렸다.
- `section.today` 로 좁힌 자리가 하나 있다: 코스 목차의 「오늘 챕터」 줄이 `li.cc-row.today`
  라, 맨 `.today` 로 두면 그 줄에 카드 테두리가 그려졌다(실측).
- `CourseScreen.css` 의 단 오버레이 규칙 250줄을 지웠다 — G4 의 `StagePlate.css` 가
  `.course-run` 아래 두 칸 특이도로 이미 이기고 있었다.

### 문구

키는 더하고 값은 그대로가 원칙이지만, **거짓이 된 값 셋**은 고쳤다.
`home.noSheetsRead` 의 「왼쪽 「오늘 할 것」」(이제 위다) · `settings.look.plain` 과
`settings.look.note` 의 「장식」(스위치가 없어졌다). 고아가 된 홈 키 58개와 장식 스위치 키
셋은 지웠다(카탈로그 린트가 「아무도 안 쓰는 키」를 막는다).

## 검증

`pnpm typecheck` 통과 · `pnpm lint` 통과 · `pnpm vitest run` **2,252 통과**(apps/desktop 792) ·
`pnpm check:contrast` 142쌍 통과 · `pnpm test:gates` **71 통과 / 1 실패**(남은 하나는
`packages/ui` 의 `PressButton[disabled]` 가 `--text-faint` on `--surface-3` 5:1 — 내 범위 밖) ·
`pnpm test:e2e-ui` **13 통과 / 0 실패**.

Playwright 로 홈·서가·설정·코스를 폭 720·1280·2560 에서 찍었다 — 네 화면 세 폭 전부
`scrollWidth === clientWidth`(가로 넘침 0). `responsive.spec` 의 일곱 화면도 720~2560 × 600+
에서 초록이다.