---
schema_version: 1
type: feature
slug: "zero-chapter-done-wired"
status: done
difficulty: medium
created_at: "2026-09-04T17:56:34+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/store-sql/src/schemas.ts"
    op: update
  - path: "packages/store-sql/src/rows.test.ts"
    op: update
  - path: "apps/desktop/src/data/settings.ts"
    op: update
  - path: "apps/desktop/src/session-flow.ts"
    op: update
  - path: "apps/desktop/src/screens/home/data.ts"
    op: update
  - path: "apps/desktop/src/flow.test.tsx"
    op: update
  - path: "apps/desktop/src/data/read-first.ts"
    op: update
  - path: "apps/desktop/src/data/read-first.test.ts"
    op: update
  - path: "apps/desktop/src/screens/session/T0Plate.tsx"
    op: update
related:
  - ref: "20260904/Features_to_add/1747_feature_bottom-concepts-eight-pairs.md"
    kind: "followup"
tags:
  - "D147"
  - "D136"
  - "0장"
  - "설정"
  - "예산"
  - "mcp-tool"
---
[x] 0장 종료 판정을 홈에 배선했다 — 조건 ②가 처음으로 돌고, 초보에게는 꺼진다 (a-wire)

## 추가 기능

`zeroChapterDone`(= `isDone`)은 export 만 되어 있고 **호출자가 없었다.** 홈은 대지마다 「노드가 전부 1겹이면 done」 하나만 보고 있었고, 그건 0장 종료 조건 ① 뿐이다. ②(뿌리 통과)와 ③(설정에서 끔)은 어디서도 안 돌았다. 그래서 사용자가 첫 실행에서 「프로그래밍이 처음」이라고 답해도 그 값이 판정까지 닿지 않았다.

## 동작 흐름

**① 새 설정 `rootCleared`.** 조건 ②는 `newcomer === 'none' && cleared` 인데 `cleared` 를 저장하는 곳이 없었다. `newcomerFlag` 로 대신할 수 없다 — **그쪽 `'none'` 은 「뿌리를 통과했다」와 「아직 아무것도 안 재 봤다」를 구별하지 못한다.** 첫날 사용자가 바로 `'none'` 이다. 그래서 KV 설정 한 칸을 늘렸다(`root_cleared`, 마이그레이션 불필요).

**② `afterSession` 이 박는다.** 그 함수는 조건이 쓰는 `roots`(= `RootResult[]`)를 이미 `newcomerFlag` 계산용으로 들고 있었다. 같은 배열을 `rootCleared()` 에 한 번 더 넘긴다. **한 번 참이면 참으로 남긴다** — D136 의 조건이 「뿌리를 통과한 세션이 **나옴**」이라 나중 세션이 그 사실을 되돌리면 안 된다.

**③ 홈이 0장만 갈라서 판정한다.** `buildSheets` 에 `ZeroChapterState{newcomer, cleared, declaredNewcomer}` 를 넘기고, 0장 대지에서만 `zeroChapterDone` 을 부른다. 나머지 대지는 「전부 1겹」 그대로다. 0장에 「전부 1겹」만 걸면 **그 언어를 이미 아는 사람이 24판을 다 찍어야 벗어난다**.

조건 ③(설정 「학습」에서 0장 끄기)은 **스위치가 아직 없어** `disabled: false` 로 고정하고 그 사실을 주석에 적었다. D136 이 요구하는 것이니 자리를 만들 때 여기로 들어온다.

## 회귀 시험 둘

`flow.test.tsx` 에 붙였다 — 실제 SQLite + 실제 인제스트를 지나는 자리라 배선이 끊기면 잡힌다.

- `root_cleared=true` 면 겹이 전부 0 이어도 0장이 **닫힌다** (조건 ②가 실제로 돈다)
- 거기에 `declared_newcomer=true` 를 더하면 **열려 있다** (초보에게는 ②가 꺼진다)

`rows.test.ts` 의 왕복 시험도 새 필드를 요구했다 — 「`Settings` 필드 전부가 한 행씩 돈다」를 세는 시험이라 픽스처에 한 줄 더했다.

## 판 높이·예산 재측 (c-budget)

0장 판은 문제 위에 사전 한 줄(`one_liner`)이 더 붙는다(D138). 후보 21장의 그 한 줄을 실측했다 — 태그 뺀 ko 기준 **최소 29 · 중앙 37 · 평균 38.3 · 최대 55자**. `--measure:36em` 이라 **1~2줄**이다.

| 읽기 속도 가정 | 판당 | t0_new(2.1분) 대비 | 하루 2장 | 15분 예산 대비 |
|---|---|---|---|---|
| 300자/분 | +7.7초 | +6.1% | +15초 | **1.7%** |
| 400자/분 | +5.8초 | +4.6% | +12초 | 1.3% |
| 500자/분 | +4.6초 | +3.7% | +9초 | 1.0% |

**`estMinFor` 는 안 고친다.** 근거 둘 — ① `BUDGET_SLACK` 이 1.15 라 15% 여유 안에 완전히 든다(최악 가정에서도 1.7%) ② `t0_new` 는 `card_state.est_min_ema` 가 이기므로 실측이 쌓이면 저절로 반영된다. 읽기 속도는 이 리포에 상수가 없어 **가정**이고, 그래서 셋을 나란히 적었다.

## 곁다리 — 낡은 숫자 여섯

`read-first.ts`·`T0Plate.tsx`·`read-first.test.ts` 가 「0장 8판」이라고 적고 있었다. D147 이 8 → 24 로 옮긴 뒤로 거짓이다. **숫자를 빼고** 「0장 대지의 판」으로 고쳤다 — 상한이 또 옮겨질 때 주석이 조용히 거짓이 되는 것을 막는다.

## 검증

`pnpm typecheck` 무출력 · **TS 전체 1,979건 / 177 파일 전량 통과**(새 시험 둘 포함) · `read-first` 15건 통과.

남은 것은 `c-real` 하나다 — 실리포에 앱을 띄워 0장 대지가 서는 모양(대지 머리·색인 띠 칩·완료 도장)을 **눈으로** 보는 일이라 사람의 확인이다. `target/debug/chickadee-app` 은 이미 빌드돼 있다.