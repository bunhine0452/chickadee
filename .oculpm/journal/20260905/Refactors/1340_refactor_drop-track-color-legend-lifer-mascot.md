---
schema_version: 1
type: refactor
slug: "drop-track-color-legend-lifer-mascot"
status: done
difficulty: low
created_at: "2026-09-05T13:40:29+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/plate/LiferNote.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/LiferNote.css"
    op: update
  - path: "apps/desktop/src/components/home/Legend.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/Legend.css"
    op: delete
  - path: "apps/desktop/src/components/home/Legend.test.tsx"
    op: delete
  - path: "apps/desktop/src/components/home/Board.tsx"
    op: update
  - path: "apps/desktop/src/components/home/Board.test.tsx"
    op: update
  - path: "apps/desktop/src/components/shell/TimeQueue.css"
    op: update
  - path: "apps/desktop/src/components/home/TodayPanel.css"
    op: update
  - path: "apps/desktop/src/components/home/ColorBar.css"
    op: update
  - path: "apps/desktop/src/components/home/SheetIndex.css"
    op: update
  - path: "apps/desktop/src/components/home/Node.css"
    op: update
related:
  - ref: "20260905/Features_to_add/1326_feature_visual-restraint-decor-mascot-tokens.md"
    kind: "followup"
tags:
  - "d179"
  - "design"
  - "css"
  - "mascot"
  - "mcp-tool"
---
[x] 트랙 색과 범례를 걷고 첫 기록에서 마스코트를 뺀다 (D179 후속 — 결정 셋)

## 동기

앞선 일지가 남긴 사용자 결정 셋에 답이 왔다. 둘은 마저 하고 하나는 그대로 둔다.

**① 구문 강조 3색은 남긴다 — 할 일 없음.** 정본 §6 에 조항이 다시 들어갔다: 「코드 구문 강조는 지우지 않는다. 색은 상태에만의 예외 하나이고 판독 보조다」. 2026-09-02 에 한 번 지웠다가 「판독을 거래한 미검증 도박」으로 철회한 자리라 같은 실수를 되풀이하지 않는다.

**② `LiferNote` 의 Dee 는 뺀다.** 정본 §6 의 「빈 상태·완료 화면·표지에만」을 글자대로 읽는 것이 맞다 — 판정란은 문제 화면 안이고, 영구 기록(D131)의 값은 기록이지 그림이 아니다.

**③ 트랙 색과 범례를 걷는다.** 배지에서 색을 걷고 나니 트랙이 색을 고르는 자리가 진행 막대 하나만 남았는데, 「색은 상태에만」이 그 하나도 덮는다.

## 변경 요약

**② 첫 기록.** `LiferNote` 에서 `<Dee ly={4} size={56} sticker />` 와 `DEE_SIZE` 를 지우고 격자를 3열 → 2열로 좁혔다. 기록은 그대로다 — 머리말 · 개념 이름과 토큰 · 채집지(`당신의 time.ts:19 에서 채집 · T0 문법`) · 일련번호 `#001` · 「첫 관찰 LIFER」 도장. 요약(완료 화면)의 `lifer-box` Dee 는 정본이 허락한 자리라 남겼다.

**③ 트랙 색.** 「트랙마다 색이 갈리는」 자리만 골라 걷었다 — 전역 포커스 링(`--t0`)·기본 단추(`--t1`)처럼 트랙과 무관한 강조색은 그대로다.

- `Legend` 컴포넌트(tsx·css·test)를 지우고 `Board` 머리에서 뺐다. 트랙이 색을 안 고르면 색 범례가 설명할 것이 없다.
- `TimeQueue` — `.queue i.t0/.t1/.t2` 세 색을 `--state-progress` 하나로. **시간 비례는 그대로다**(정본 §3-5): 칸 너비는 여전히 `--w` = 예상 시간이고, 칸끼리는 2px 틈이 가르며, 무슨 트랙인지는 아래 `.qlist` 의 라벨이 말한다.
- `TodayPanel` — 줄머리 선 셋을 `--ink-mute` 하나로, 14일 미니 막대의 켜진 칸을 `--ink-soft` 로.
- `Node`(홈 대지 스티커) — `.node[data-track] .face` 의 잉크 3색 면과 `.face .g` 의 녹아웃 글자색을 지웠다. 면은 종이(`--paper-3`), 글자는 먹, 트랙은 오른쪽 위 `.tag` 의 `T0`·`T1`·`T2` 글자가 말한다. 완료의 `color-mix` 오버프린트 셋은 `inset 0 0 0 3px var(--rule)` 테두리 한 겹으로 바꿨다 — 완료는 이미 `.ck` 체크 배지가 말한다. 야간 후광도 트랙별 `--glow-t0/1/2` 를 걷고 `--glow: transparent` 로 두어, 빛나는 것은 **지금 여기**(`data-state="current"`) 하나만 남겼다.
- `ColorBar`(지난 14일 학습량) — 한 칸에 겹치던 잉크 3색 줄을 `--ink-soft` 한 색으로. 진하기가 정보이고 색상은 아니다.
- `SheetIndex` — 대지 칩의 진행 막대 채움 `--t0`·완료 `--t1` 을 `--state-progress` 로. 이 막대가 재는 것은 트랙이 아니라 진행이다.

## 검증

- `pnpm lint` · `pnpm -r typecheck` 통과(스타일린트 `comment-empty-line-before` 2건은 고쳤다).
- `pnpm design:check` 바이트 일치 · `pnpm check:contrast` 48쌍 통과 · `pnpm check:motion` 위반 0건. 토큰 출처는 안 건드렸다 — 쓰는 쪽만 바꿨다.
- `pnpm vitest run apps/desktop packages/ui` 117파일 950건 통과. `pnpm test:unit` **2,304건 통과 · 실패 0**(앞 일지에서 남았던 `chapter.targetRun` 도 해소됐다).
- `playwright test tests/gates --project=chromium` **57 통과 · 4 스킵 · 0 실패** — 대비 게이트가 브라우저에서 실제로 그려진 글자를 재는데, 노드 면이 잉크 → 종이가 되면서 오히려 넉넉해졌다.
- `playwright test tests/e2e-ui --project=chromium` **13 통과 · 6 스킵 · 0 실패**.
- 눈으로: 최종 스크린샷 넉 장(`shots-final/{home-day,home-night,plate,feedback}.png`). 홈 머리 오른쪽의 색 범례가 사라졌고, 「오늘 할 것」 진행바가 청·청·황 → 진행 한 색이 됐으며, 판정란의 첫 기록 상자에 마스코트가 없다.

## 메모

`home.legend`·`home.legendT0/T1/T2` 네 키는 C4 세션이 이미 카탈로그에서 지워 고아 키가 남지 않았다(`catalog.test.ts` 초록).

`Board.test.tsx` 의 단언 한 줄을 「범례가 있다」에서 「없다」로 뒤집었다 — 사라진 것을 지키는 시험이 더 쓸모 있다.