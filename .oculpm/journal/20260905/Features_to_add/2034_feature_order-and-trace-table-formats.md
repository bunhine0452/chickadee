---
schema_version: 1
type: feature
slug: "order-and-trace-table-formats"
status: done
difficulty: high
created_at: "2026-09-05T20:34:42+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/cards/src/order.ts"
    op: create
  - path: "packages/cards/src/trace-table.ts"
    op: create
  - path: "packages/cards/src/order.test.ts"
    op: create
  - path: "packages/cards/src/trace-table.test.ts"
    op: create
  - path: "packages/cards/src/stage-types.ts"
    op: update
  - path: "packages/cards/src/stage-common.ts"
    op: update
  - path: "packages/cards/src/stage.ts"
    op: update
  - path: "packages/cards/src/stage.test.ts"
    op: update
  - path: "packages/cards/src/index.ts"
    op: update
  - path: "packages/grading/src/order.ts"
    op: create
  - path: "packages/grading/src/trace-table.ts"
    op: create
  - path: "packages/grading/src/order.test.ts"
    op: create
  - path: "packages/grading/src/trace-table.test.ts"
    op: create
  - path: "packages/grading/src/stage.ts"
    op: update
  - path: "packages/grading/src/index.ts"
    op: update
  - path: "packages/store-sql/src/types.ts"
    op: update
  - path: "packages/store-sql/src/schemas.ts"
    op: update
  - path: "apps/desktop/src/screens/course/OrderPlate.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/TraceTablePlate.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/TracePlate.css"
    op: create
  - path: "apps/desktop/src/screens/course/OrderPlate.test.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/TraceTablePlate.test.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/StageOverlay.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/ChoicePlate.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/PlateFrame.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/ChapterPanel.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/run.ts"
    op: update
  - path: "apps/desktop/src/screens/course/gate.test.ts"
    op: update
  - path: "packages/i18n/src/ko/course.ts"
    op: update
  - path: "packages/i18n/src/en/course.ts"
    op: update
  - path: "packages/i18n/src/ko/grading.ts"
    op: update
  - path: "packages/i18n/src/en/grading.ts"
    op: update
  - path: "docs/program/fundamentals.md"
    op: update
related: []
tags:
  - "D187"
  - "fundamentals"
  - "stage-2"
  - "stage-5"
  - "parsons"
  - "trace-table"
  - "mcp-tool"
---
[x] 형식 둘 — order(Parsons) · trace-table(시간 × 열 격자) + 2단에 값 추적 (D187 ⑱)

## 추가 기능

`docs/program/fundamentals.md` §13 이 후보로만 적어 두었던 형식 둘을 세웠다. `pedagogy.md` §1.2 가 잰 어긋남 하나가 착수 이유다 — 연구의 tracing 은 값·상태를 굴리는 것인데 앱의 2단 넷(`exec`·`hop`·`origin`·`caller`)은 전부 경로여서 값을 굴리는 판이 하나도 없었다.

- **`order`** — 조각 N(3~7)의 순열. 자리는 **5단의 1겹**(T1 페이딩 앞)이고 4·5단 「사이」가 아니다(`pedagogy.md` §2.2). 채점은 2단 `hop` 의 인접쌍 비율 그대로이고 부분 점수가 있다. 재료 둘 — 챕터의 홉 순서와 0부 `FoldStep` 사다리.
- **`trace-table`** — 시간 × 열 격자. 자리는 **2단**. 채점은 칸마다 값 일치(부분 점수) + `step` 의 이월. 열 축은 `var`·`obj`·`addr`·`place`·`row` 다섯 중 **둘만 구현**하고 나머지는 타입에 자리만 두었다.

## 동작 흐름

**오답 진단을 사람이 안 적는다.** `order` 는 조각마다 `fact` 한 줄(홉이면 부르는 방향과 간선 종류, 사다리면 그때의 타입)을 싣고, 채점기가 틀린 인접쌍마다 「B 가 A 보다 먼저다 — <B 의 사실>」을 **계산**한다. `siblings` 가 값 적기에서 한 일과 같은 수법이다.

**상자 라벨은 글자가 아니라 분할이 정답이다.** A·B 로 쓰든 1·2 로 쓰든 「같은 상자끼리 같은 이름」이면 맞다. 값이 안 바뀐 칸의 기댓값은 **앞 칸에 학습자가 쓴 이름**이고(이월), 값이 바뀌는 칸은 앞에서 쓴 적 없는 이름이어야 한다(분할).

**예측 모드는 그림의 I2 규칙 그대로다** — 값이 바뀌는 칸(`carry === null`)만 가리고 나머지는 채워진 채로 남아 예측의 재료가 된다.

**재료는 리포에서 계산한다.** 창 안에서 「같은 이름에 두 번 대입하는 자리」를 글자(정규식)로 찾아 열을 세운다. 표본 리포 `MonggleMonggle` 의 `AuthService.login` 을 읽어(`:78` 선언 → `:87` DB 만 바뀜 → `:90` 재대입) `java-learning.md` §12.5 의 표와 같은 열 셋(`user` 의 상자 · `role` · `token`)이 나오는 것을 확인했다.

**정직성(D186 ④)** — 재대입하는 자리가 없어 격자를 못 구운 챕터는 판을 숨기지 않고 「굽지 못했다 — 이유」를 판 자리에서 말하고, 그 챕터의 2단은 경로 판만으로 통과한다.

**저장은 마이그레이션 0줄이다.** `card.kind` CHECK 를 늘리려면 표를 다시 만들어야 하므로(D146) D164 처럼 있는 값을 빌렸다 — `trace-table` → `flow`(2단 추적의 자리), `order` → `reorder`(순서를 묻는 판). 화면·채점기는 `payload.kind`(`trace`·`order`)로 갈리므로 두 뜻이 안 섞인다. `fundamentals.md` §6 이 설계한 `kind='value'` 는 마이그레이션 `0010` 이 서면 옮겨 갈 자리다.

## 검증

`pnpm typecheck` 초록 · `pnpm lint` 는 내 파일 0건(남은 1건은 S10 의 `ParallelSteps.css`) · `pnpm test:gates` 144 통과 8 건너뜀 · 새 시험 64개 전부 통과. `pnpm test:unit` 의 남은 5건은 전부 `packages/dictionary` 이고 동시 세션(S4·S5·S8)이 고치는 중인 `dictionary/**` 때문이다 — 내 범위 밖. 720 폭에서 열 다섯짜리 격자를 실제로 세워 재 봤다: 표 너비 650px, 문서 가로 스크롤 0.