---
schema_version: 1
type: bug
slug: "t2-rotation-and-budget-order"
status: done
difficulty: high
created_at: "2026-09-04T15:16:19+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/scheduler/src/plan.ts"
    op: update
  - path: "packages/scheduler/src/plan.test.ts"
    op: update
  - path: "packages/scheduler/src/index.ts"
    op: update
  - path: "packages/store-sql/statements/queue.sql"
    op: update
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "apps/desktop/src/data/session.ts"
    op: update
  - path: "apps/desktop/src/data/graph.ts"
    op: update
  - path: "apps/desktop/src/data/t2.test.ts"
    op: update
  - path: "docs/02-data-model-and-scheduling.md"
    op: update
  - path: "docs/04-grading-engines.md"
    op: update
related:
  - ref: "20260904/Chores/1402_chore_v04-four-requests-parallel-survey.md"
    kind: "followup"
tags:
  - "t2"
  - "queue"
  - "scheduler"
  - "d140"
  - "v04"
  - "mcp-tool"
---
[x] T2 는 리포당 평생 한 장이었다 — 큐가 늘 같은 행을 줬고 예산이 T2 를 T1 보다 먼저 버렸다 (D140)

## 발생 원인

조사 일지가 든 「고장 1번」을 재현하고 고쳤다. 원인은 셋이 겹쳐 있었다.

1. **`queue.next_track_card` 가 `LIMIT 1`** — `ORDER BY (prints=0), last_printed_at, id LIMIT 1` 이라 카드가 한 행이라도 있으면 늘 그 행을 준다. 앱에 은퇴 경로가 없으니 `prints=0` 인 행이 다시 생길 일도 없다.
2. **그래서 `forUnit` 이 죽은 코드였다** — `data/session.ts` 의 `trackSlot` 은 큐가 빌 때만 굽는데, 큐가 빈 적이 첫 판 이전 한 번뿐이었다. D107 「네 종을 다 굽는다」가 한 번도 일어나지 않았다.
3. **예산이 T2 를 먼저 버렸다** — `DROP_ORDER = ['new:t0','new:t2','new:t1']`. 만기 20건인 날 `0.5×20 + 7 + 4 + 2×2 = 25 > 15×1.15 = 17.25` 라 T0 둘과 **T2** 가 잘려 14 가 됐다. 만기가 쌓인 사람일수록 구조 판을 못 봤다.

## 해결 방법

**예산** — `DROP_ORDER` 를 `['new:t0','new:t1','new:t2']` 로. T2 자리는 이틀에 한 번이라 한 번 잘리면 이틀을 기다리고, T1 은 주 2회 리듬이라 같은 주에 자리가 또 있으며, 새 T0 은 하루 상한 2장이라 내일 그대로 온다. 같은 산수가 이제 T0 둘과 **T1** 을 버려 똑같이 14 를 만들고 T2 를 남긴다.

**큐** — `queue.next_track_card` 에 `printedBefore` 를 넣어 `COALESCE(last_printed_at,0) <= :printedBefore` 로 좁혔다. 창은 트랙이 정한다 — `REPRINT_GAP_DAYS = { t1: 0, t2: 7 }`.

T1 이 0 인 이유: 3단계 페이딩(04 §3.2)이 같은 카드를 일부러 다시 부른다. 창을 두면 1단계에서 멈춘 필사가 일주일 뒤에야 2단계로 간다.

T2 가 7 인 이유 셋 — ① `trackSlot` 이 리듬을 재는 창이 이미 최근 7일이라 큐의 「최근」이 하나로 남는다 ② `t2_gap_days = 2` 라 7일 안에 T2 자리는 최대 넷이고, 판 넉 장(= 대지 하나의 네 종)이면 언제나 창 밖의 것이 하나 있다 ③ 진짜 만기를 막지 않는다 — 만기 T2 는 `queue.due` → `queue.pick_card` 로 오고 이 창은 그 경로를 안 건드린다. FSRS 기본 `w[2] = 3.173`(첫 Good 의 안정도, 일)이라 7일 창은 원장보다 늘 뒤에 선다.

**`trackSlot` 의 우선순위 — 여기서 한 번 틀렸고 테스트가 잡았다.** 창만 넣고 「있는 카드 먼저」를 그대로 두면 회전이 **판 넉 장에서 멈춘다**: 넷째를 구운 다음 날이면 첫 판이 이미 창 밖이라 다섯째를 구울 날이 영영 오지 않는다. 대지 3 × 종 4 테스트가 12 를 기대한 자리에서 4 를 냈다.

02 §5.3 이 두 트랙을 이미 다르게 적어 뒀다. 2번 T1 은 「단계 미완 카드 우선」= **이어서 칠 판**, 3번 T2 는 「새 T2 1장」= **아직 안 본 판**. 코드가 그 차이를 안 지키고 있었다. 이제 T1 은 있는 카드가 언제나 먼저이고, T2 는 「구워 두고 아직 안 쓴 판(`prints=0`) → 없으면 한 장 굽는다 → 다 구웠을 때만 창 밖 옛 판」이다.

**회전** — `data/graph.ts` 에 `t2Todo`(순수 함수)와 `bakeNextT2` 를 더했다. `queue.units`·`queue.t2_made` 두 문장으로 안 구운 `(대지, 종)` 을 알고, 순서는 **종이 바깥 고리**다: 책임 배치를 리포의 모든 대지에 한 바퀴 돌린 뒤 영향 반경으로 내려간다. 책임 배치만 실제 커밋을 정답지로 쓰고(정본 §2), 대지를 옮겨 가는 쪽이 사용자가 보는 변화도 크다 — 같은 대지의 네 종은 같은 지도 위 네 문제다.

`queue.units` 를 새로 판 이유: `home.units` 는 대지 × 스티커라 대지 하나가 여러 행이고, `unit_node` 를 INNER JOIN 하므로 개념 스티커가 없는 대지가 통째로 빠진다. T2 의 지도는 `unit_file` 이 세우므로 스티커와 무관하다.

**일괄 생성 금지** — 세션당 한 장, 시도는 3 조합까지. 그리고 `makeT2Card` 가 **책임 배치가 아닌 종에서는 `loadCommits` 를 통째로 건너뛴다**(04 §8.3 — 나머지 셋은 그래프만 본다).

## 실측 (#b-perf)

better-sqlite3 인프로세스 · 대지 20 · 파일/대지 12~24 · 커밋 1,200 · 한 대지당 후보 커밋 60(최악):

| | 시간 | 쿼리 |
|---|---|---|
| 책임 배치 한 장 | 4.2~8.4 ms | **69** |
| 그래프 3종 한 장 | 0.5~6.5 ms | **7** |
| 다 구운 뒤(굽지 않음) | — | 2 |

69 중 60이 `t2.commit_files` 다. 실제 앱에서는 Tauri 왕복 60번이므로 여기가 유일한 값비싼 자리이고, 세션당 한 번·회전이 차는 동안만 든다. 05 §10 에 큐 짜기 예산은 없다(가장 가까운 것이 `session:mount ≤ 50 ms`, 실측 3~6 ms). SQL+생성기 몫 4~8 ms 는 그 예산 안이고, 남는 위험은 왕복 60번의 IPC 지연뿐이다. 줄이려면 `t2.commit_files` 를 `json_each(:ids)` 로 묶는 문장이 필요한데 `t2.sql` 은 이 세션 소유가 아니라 부모에게 넘긴다.

## 검증

- `npx vitest run apps/desktop/src/data packages/scheduler packages/store-sql packages/cards` — 527 통과.
- 회전 증거(`t2.test.ts` 의 「T2 회전 (D140 · 대지 3 × 종 4)」 8건): `bakeNextT2` 를 부를 때마다 새 `(대지, 종)` 이 하나씩 늘어 12 에서 멈추고 그 뒤 `null`; 세션을 이틀 간격으로 12번 열면 판 12장이 **전부 다르고** 대지 셋·종 넷이 다 나온다(고장 났을 때 이 배열은 `[1,1,1,…]` 이었다); 7일 창이 실제로 거른다(0일·2일·6일 뒤 0건, 7일 뒤 1건); T1 은 안 걸러진다.
- 예산 회귀(`plan.test.ts` 「만기 20건인 날에도 새 T2 가 남는다 (D140)」): 만기 20건이 한 장도 안 빠지고 T2 1장이 남아 `plannedMin = 14`.
- `bash scripts/check-rust-budget.sh` — 2331/2800, Rust 0줄 변경.
- `npx eslint` · `npx tsc --noEmit -p apps/desktop/tsconfig.json` 깨끗.
- 전체 `npx vitest run` 에서 빨간 것은 `components/t1/ClonePad.test.tsx` 16건뿐인데(`editor.onDidPaste is not a function`) 이 세션 소유 밖이고 자동완성 세션이 지금 고치는 중이다.

## 남은 것

`forUnit`(`apps/desktop/src/data/cards.ts:90`)이 아직 `bakeNextT2` 를 안 부른다 — 그 파일은 병렬 세션(0장)이 잡고 있어 손대지 않았다. 3줄 패치를 보고서에 적어 부모에게 넘긴다. 그 한 줄이 붙기 전까지 앱에서는 회전이 돌지 않는다.