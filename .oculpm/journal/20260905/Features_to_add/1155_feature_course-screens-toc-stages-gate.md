---
schema_version: 1
type: feature
slug: "course-screens-toc-stages-gate"
status: done
difficulty: high
created_at: "2026-09-05T11:55:13+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/screens/course/CourseScreen.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/CourseScreen.css"
    op: create
  - path: "apps/desktop/src/screens/course/ChapterToc.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/ChapterPanel.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/StageOverlay.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/PlateFrame.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/ChoicePlate.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/HopPlate.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/CallerPlate.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/RepairPlate.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/ReimplPlate.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/StuckPanel.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/StageDone.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/data.ts"
    op: create
  - path: "apps/desktop/src/screens/course/run.ts"
    op: create
  - path: "apps/desktop/src/screens/course/gate.ts"
    op: create
  - path: "apps/desktop/src/screens/course/keys.ts"
    op: create
  - path: "apps/desktop/src/screens/course/store.ts"
    op: create
  - path: "apps/desktop/src/screens/course/gate.test.ts"
    op: create
  - path: "apps/desktop/src/screens/course/run.test.ts"
    op: create
  - path: "apps/desktop/src/screens/course/ChoicePlate.test.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/ChapterToc.test.tsx"
    op: create
  - path: "apps/desktop/src/App.tsx"
    op: update
  - path: "apps/desktop/src/flow.ts"
    op: update
  - path: "apps/desktop/package.json"
    op: update
  - path: "packages/i18n/src/ko/course.ts"
    op: create
  - path: "packages/i18n/src/en/course.ts"
    op: create
  - path: "packages/i18n/src/ko.ts"
    op: update
  - path: "packages/i18n/src/en.ts"
    op: update
  - path: "tests/e2e-ui/course.spec.ts"
    op: create
  - path: "docs/00-overview.md"
    op: update
related: []
tags:
  - "D171"
  - "코스"
  - "화면"
  - "course"
  - "mcp-tool"
---
[x] 코스 화면 — 목차·단 오버레이·어휘 관문·오늘 15분을 앱에 (D171)

## 추가 기능

D162 의 코스가 데이터(챕터·판·판정)까지만 있고 화면이 없었다. `screens/course/` 를 새로 세웠다 — 홈을 대신하는 **목차 화면** 하나와 세션처럼 전체화면인 **단 오버레이** 하나.

- **목차**(`ChapterToc`) — 기능 챕터 · 막간·부록(디렉터리 챕터) · 졸업(죽은 갈래). 진도는 **단**(`stage_reached`)으로 적고 통과·재검 만기·오늘은 접음·앞 챕터부터가 단보다 앞선다. 해금은 순서다 — 앞 기능 챕터가 통과 전이면 뒤는 잠긴다.
- **패널**(`ChapterPanel`) — 진도 · 어휘 「N개 중 M개가 1겹 이상」 · 다음 걸음 단추 하나. 1단이면 어휘 관문(0겹 개념을 `pickPlateNow` 로 오늘 큐에 끼우고 기존 교정쇄를 연다 — 새 판 화면 없음) 또는 다 찍었으면 「읽기 단 판정」, 2~5단이면 그 단 시작, 만기면 재검. 4단 판이 없으면 3단이 통과선(D165 기본값), 5단은 게이트가 아니라고 평문으로.
- **오늘 15분** — `planCourseDay` 결과를 `TimeQueue` 로. 재검만 남았으면 그렇다고 말한다. 「오늘 시작」은 첫 칸이 무엇이든 연다.
- **단 오버레이**(`StageOverlay`) — `SessionOverlay`·`JobBand` 재사용(Esc 네 겹·포커스 트랩·낭독). 판 모양은 `payload.track` 이 정한다: t0 → `ChoicePlate`(지목), t2 flow → `HopPlate`(`FlowDeck`), t2 radius → `CallerPlate`(파일 고르기), t3 선택형 다섯 → `ChoicePlate`(보기 + `contract` 의 이유 4지), repair → `RepairPlate`(한 줄 편집·고치기 전 쓰기·자리 고르기), reimpl → `ReimplPlate`(T1 `ClonePad` Monaco 지연 로드, 시험 환경은 textarea 폴백, handoff 는 프롬프트 복사). 채점은 `gradeStage`, 단이 끝나면 `recordStageResult`(2~5단) 또는 `finishRecheck`(재검 = 2단 1 + 3단 1 → `recheckGrade` → `scheduleRecheck`). 판정 카드(`StageDone`)가 통과·챕터 통과·재검 등급·다음 재검을 말한다.
- **막힘**(`StuckPanel`) — `stuckAction` 대로: 2단 경로 접기(`foldFlow`, 5칸→3칸), 3단 그 개념의 사전 한 줄 + 큐 앞에 끼우기, 4·5단 프롬프트(앞뒤 4줄) 복사, 3회면 `deferChapter`. 클래스 `reprint` 라 Esc 한 번에 패널만 닫힌다.
- **관문 상한**(`planGates`, 순수) — 첫 챕터 12 · 나머지 6 · 코스 40. 뒤 챕터가 잘린다.
- **배선** — 마스트헤드 「코스」= 새 코스(`openCourse`), 대지 카드 「코스 열기」= 클론 코스 그대로. 인제스트 끝에 `bakeCourse`+`bakeSiteless`(A8 의 `@chickadee/course`), 챕터를 고르면 `ensureChapterBaked`. 코스 상태는 `screens/course/store.ts` 가 따로 든다(`store.ts` 는 안 건드림).
- 문구 128키 `chapter.*`(ko 정본·en 병기). `course.` 접두어는 클론 코스가 이미 써서 피했다.

## 동작 흐름

홈 「코스」 → `CourseScreen` 이 `chapter.list`·`chapter.today`·`chapter.due`·`path.dead_list` + 챕터마다 `card.stage_counts`·`chapter.reading_layers` 를 읽는다 → 목차에서 챕터 선택 → 패널의 단추 하나 → (관문이면 교정쇄, 단이면 오버레이) → 판마다 고르기·Enter·Space → 마지막 판 뒤 `stage_log` 한 행 + `chapter` 갱신 → 판정 카드 → 「다음 단으로」/「목차로」. 원장에 쓰는 세션 행은 클론 코스처럼 태어날 때부터 `done`(`openCourseSession`).

## 검증

- `pnpm typecheck`·`pnpm lint`(eslint+stylelint) 무출력 · `pnpm check:contrast` 48쌍 통과 · `check:motion` 0 · `design:check` 통과.
- `pnpm test:unit` **200파일 2,230건 통과**(새 시험 27: 관문 상한·유형 변환·접기·셈·선택형 판 키·목차 상태).
- `playwright test tests/e2e-ui/course.spec.ts --project=chromium` **1/1** — 시드 사본에 챕터·어휘·줄기·2단 판을 심고 홈 → 코스 → 읽기 단 판정 → 2단 판 채점 → 판정 카드 → 원장(`chapter.stage_reached` 0→2 · `stage_log` 2행) → 목차 → 홈까지. webkit 은 이 기계에서 안 돌려 chromium 만.

## 메모

- 진행 중인 단의 답은 저장하지 않는다(나가면 그 단을 처음부터). 판정된 단은 원장에 있다.
- `stage.dunno_count` 는 `session_item` 을 거치므로 코스의 「모르겠어요」는 오버레이 메모리에서 센다.
- `hop` 판은 지도(`DependencyMap`) 없이 덱만 — 지도 껍데기가 세션 T2 판에 묶여 있다.
- 시드(`build-seed.ts`)에 챕터를 넣지 않았다 — 홈 대지 수가 바뀌어 다른 e2e·시각 골든이 흔들린다. 스펙이 자기 DB 사본에 심는다.