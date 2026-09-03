---
schema_version: 1
type: feature
slug: "home-manual-plate-and-newcomer-note"
status: done
difficulty: medium
created_at: "2026-09-03T15:58:00+09:00"
session_id: "20260903-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/data/manual.ts"
    op: create
  - path: "apps/desktop/src/data/manual.test.ts"
    op: create
  - path: "apps/desktop/src/components/home/Newcomer.tsx"
    op: create
  - path: "apps/desktop/src/components/home/Newcomer.css"
    op: create
  - path: "apps/desktop/src/components/home/Newcomer.test.tsx"
    op: create
  - path: "apps/desktop/src/App.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/data.ts"
    op: update
  - path: "apps/desktop/src/screens/home/HomeScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/HomeScreen.test.tsx"
    op: update
related:
  - ref: "20260903/Chores/1055_chore_m2-handoff-and-closing-checks.md"
    kind: "followup"
tags:
  - "d88"
  - "home"
  - "session-queue"
  - "newcomer"
  - "mcp-tool"
---
[x] D88 · 홈의 「이 판 찍기」·「판 만들기」 배선과 초보 안내 한 줄

## 추가 기능

M2 가 흘려보낸 두 자리를 채웠다.

- `data/manual.ts` — 동사 둘. `pickPlateNow`(`role='manual'`)는 겹에 맞는 카드를 `queue.pick_card` 로 고르고 없으면 `makeCard` 로 굽는다. `makePlateFor`(`role='gap'`)는 판이 없는 문법에 카드를 만든다(`gap.status='card_made'` 는 `makeCard` 가 이미 닫는다). 자리는 `manualAt`, 예상 시간은 `estMinFor(track, role)` — 숫자를 손으로 쓰지 않는다.
- `App.tsx` — `onMake`·`onPick` 이 그 둘로 간다. 토스트가 **어디에 무엇이 들어갔는지**를 말한다(「…판을 오늘 큐 2번째에 넣었습니다」). 이전에는 「M3 에서 열립니다」만 냈다.
- `components/home/Newcomer` — `settings.newcomer_flag` 가 `suspect`·`confirmed` 면 홈 상단(마스트헤드 바로 아래)에 안내 한 줄. 값은 `HomeData.newcomerFlag` 로 오고 `loadHome` 이 `loadSettings()` 에서 채운다. 버튼·닫기 없음, 경고색 없음 — 게이트가 아니라 안내다(02 §6.4 · 정본 §3-7).

## 동작 흐름

1. 오늘 세션(`session.open_today`)이 있으면 **현재 자리 뒤**(`manualAt(curPos, role, estMin)`)에 끼운다. 현재 자리는 화면이 그 세션을 열고 있으면 걸린 판, 아니면 첫 미완 판이고 남은 판이 없으면 큐 끝이다.
2. 같은 카드가 이미 미완으로 큐에 있으면 끼우지 않고 그 자리를 돌려준다 — 두 번 눌러도 판은 한 장이다(`insertRetry` 의 `pending_retry` 검사와 같은 뜻).
3. 오늘 세션이 없으면 **선택 ⓐ**: `startSession` 으로 정상 큐를 세운 뒤 그 앞(`pos:0`)에 한 장을 얹는다. 문서(02 §5.5)의 「새 세션의 0번」은 지키고, 큐를 직접 짜지 않으므로 만기 복습이 빠지지 않는다. `planSession` 이 그 카드를 이미 집었으면 끼우지 않고 그 자리로 이동한다.
4. 큐가 비어 세션이 안 열리면(02 §5.3 빈 상태) 카드만 남고 `pos: null` 로 돌아가, 화면이 「오늘은 인쇄할 큐가 없어 큐에 넣지는 못했습니다」로 말한다.

## 검증

`pnpm vitest run apps/desktop/src/data/manual.test.ts apps/desktop/src/screens/home` → 3 파일 16 테스트 통과. 앱 전체 `pnpm vitest run apps/desktop` → 55 파일 351 테스트 통과. `pnpm --filter @chickadee/desktop typecheck`·`npx eslint apps/desktop/src`·`npx stylelint` 모두 0.

`insertPlate` 의 `manual`·`gap` 갈래는 이번에 처음 돌았다. `manual.test.ts` 가 진짜 SQLite 로 ① 현재 뒤 삽입 ② 뒤 판 두 장이 밀리며 `UNIQUE(session_id,pos)` 를 안 깨는지(`session.shift_park` → `shift_unpark` → `item_insert` 순서를 실제로 지나는지 batch op 이름으로 확인) ③ 세션 없을 때 0번 ④ 진짜 사전으로 카드가 구워지고 구멍이 닫히는지 를 본다. 시각은 실시간이다 — `pickPlateNow` 가 시계를 주입받지 않으므로 고정 상수 `T` 로 심으면 하루 뒤 빨개진다.

## 메모

문서와 달라진 것 둘, 결정 등록부 행이 필요하다.

- **02 §6.4** 는 `confirmed` 에만 안내를 보이라고 적혀 있는데 `suspect` 에도 보인다(사유 문장만 다르다: 「오늘…」 / 「두 세션 내리…」). 한 세션 증거로도 안내는 손해가 없고 아무것도 잠그지 않는다.
- **05 §2.1 표의 `newcomer`** 는 `plugin-opener` 링크를 요구하지만 `@chickadee/ipc-client` 에 외부 링크를 여는 문이 아직 없다. 자료 두 개(생활코딩 `opentutorials.org` · CS50 `cs50.harvard.edu`)를 **주소 글자**로만 보인다.

남긴 것: 삽입이 `session.planned_min` 을 늘리지 않는다(02 §5.4 는 늘리라고 한다). `insertRetry`·`insertPrereq` 도 안 늘리고 있어 삽입 경로 공통의 빈자리다 — 고치려면 `data/session.ts` 를 건드려야 해서 이번 범위 밖으로 뒀다.