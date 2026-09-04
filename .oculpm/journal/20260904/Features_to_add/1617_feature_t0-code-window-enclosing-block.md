---
schema_version: 1
type: feature
slug: "t0-code-window-enclosing-block"
status: done
difficulty: high
created_at: "2026-09-04T16:17:39+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/cards/src/lines.ts"
    op: update
  - path: "packages/cards/src/lines.test.ts"
    op: create
  - path: "packages/cards/src/types.ts"
    op: update
  - path: "packages/cards/src/t0-point.ts"
    op: update
  - path: "packages/cards/src/t0-blank.ts"
    op: update
  - path: "packages/cards/src/t0-meaning.ts"
    op: update
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "packages/cards/src/index.ts"
    op: update
  - path: "packages/cards/src/t0.test.ts"
    op: update
  - path: "apps/desktop/src/data/cards.ts"
    op: update
  - path: "apps/desktop/src/components/plate/CodePlate.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/CodePlate.css"
    op: update
  - path: "apps/desktop/src/components/plate/CodePlate.test.tsx"
    op: update
  - path: "packages/store-sql/migrations/0004_t0_block_window.sql"
    op: create
  - path: "fixtures/db/v0004.db"
    op: create
related: []
tags:
  - "t0"
  - "cards"
  - "d141"
  - "migration"
  - "a11y"
  - "mcp-tool"
---
[x] T0 코드 창을 초점 ±2 에서 감싸는 블록으로, 20줄에서 접기 (D141)

## 추가 기능

사용자 보고 「문제에서 보여주는 코드도 너무 일부분만 보여준다」에 대한 구현.

`packages/cards/src/lines.ts` 의 `LINES_WINDOW = 2` 는 목업을 잘못 일반화한 값이었다 —
목업 카드 네 장은 5·5·6·3줄이고 오프셋도 제각각이며, 공통점은 줄 수가 아니라 감싸는 함수였다.

### 창 = 감싸는 최소 블록

`windowOf(focus, block?)`:
- 블록 없음 / 초점이 블록 밖 → `초점 ±2` 폴백 (지금까지의 동작 그대로, 카드는 반드시 나온다)
- 블록 있음 → `block ∪ 초점 ±2` (합집합인 이유: 목업 카드 1 의 `addItem` 은 3줄짜리 함수라
  블록만 쓰면 창이 **좁아진다** — 창은 넓히는 것이지 좁히는 것이 아니다)
- 40줄(`WINDOW_MAX_LINES`) 초과 → 초점을 가운데 두고 자름

재료는 새로 만들지 않았다. T1 이 쓰던 `block.by_file` 이 줄 범위를 준다 — **새 statement 0장,
Rust 0줄**(2331/2800 그대로). `apps/desktop/src/data/cards.ts` 가 파일마다 한 번만 묻고
초점을 감싸는 것 중 가장 좁은 블록을 고른다.

`CONTEXT_RADIUS = 4` 의 뜻이 「읽는 폭」에서 「창이 좁아도 반드시 읽어야 하는 최소 폭」으로
바뀌었다. 읽는 범위 = `창 ∪ 초점 ±4`.

### 20줄 접기 (`CodePlate`)

payload 는 창 전체(≤40줄)를 들고, 판이 20줄만 편다. 초점을 가운데 두고 남는 자리를 위아래로
반씩. 접힌 자리는 `<button class="unfold">… N줄</button>`.

- 짚을 토큰·빈칸은 절대 접히지 않는다 — 라디오 묶음에 없는 보기가 생기면 안 된다.
- 키보드 완결(05 §7): 진짜 `<button>` 이고 Enter·Space 를 단추에서 `stopPropagation()` 한다.
  `T0Plate` 가 `document` 에서 Enter=제출 · Space=다음 을 듣기 때문에 이것이 없으면 단추에
  포커스가 있어도 판이 넘어간다.

### `promptLines` 불변 (정본 §3-1 · D8)

`promptLines()` 는 창 인자를 **받지 않는다**. 시그니처가 증거고 `lines.test.ts` 가
「블록이 40줄이어도 프롬프트는 9줄」·「창이 어떻게 잡히든 같은 값」으로 못 박았다.

### 은퇴 마이그레이션 0004

창이 바뀌면 `content_hash` 가 전량 달라진다. `UPDATE` 한 문장으로 살아 있는 T0 카드를
은퇴시키고, `snapshot_json` 에 옛 코드 줄을 남기고, `content_hash` 에 `d141:` 접두어를 붙인다.

접두어가 없으면 조용히 망가진다: 블록을 못 찾은 사용처는 폴백이라 새 해시가 옛 것과 같은데
`card.insert` 가 `ON CONFLICT DO NOTHING` 이라 `card.by_hash` 가 은퇴한 행을 도로 집고,
그 개념은 홈의 `has_card`(`retired_at IS NULL`)에서 영영 「판 없음」이 된다.

표를 만들지도 지우지도 않고 행 수가 그대로다 — `migrate-seed.test.ts` 가 시드마다 행 수
보존을 단언하므로 DELETE 는 애초에 쓸 수 없다.

## 실측

`_blocks.scm` 네 패턴을 흉내 내 이 리포를 훑은 결과 — 감싸는 최소 블록 줄 수:

| 표본 | 중앙값 | p90 | 최대 | 20줄 접은 뒤 펴는 줄(중앙값) | 블록 밖(폴백) |
|---|---|---|---|---|---|
| `packages/**` | 15 | 72 | 199 | 15 | 58 % |
| `apps/desktop/src` | 40 | 205 | 373 | 20 | 47 % |

옛 창은 어디서나 5줄이었다. 폴백의 큰 덩어리는 `describe`/`it` 콜백과 최상위 선언 —
`_blocks.scm` 은 `lexical_declaration` 의 화살표만 잡고 인자로 넘어간 화살표는 안 잡는다.

## estMinFor 재측 (`#d-layout`) — 고치지 않고 보고만

`packages/scheduler` 는 이 세션 소유가 아니다. 펴는 줄이 5 → 15~20 이라 훑기 0.5~1.0 s/줄로
`t0_review` 0.5 → 0.58~0.67분, `t0_new` 2.0 → 2.08~2.17분. 비율로는 복습이 크게 흔들린다.

만기 20건인 날: `12.0 + 7 + 4 + 4.2 = 27.2` → `new:t0`·`new:t2` 를 빼도 19.0 > 17.25 라
`new:t1` 까지 빠져 「복습만 하는 날」이 될 수 있다. 「만기 복습은 안 뺀다」는 약속은 지켜진다.

완화는 이미 있다 — `estMinFor` 는 `card_state.est_min_ema` 가 있으면 그것이 이긴다.
다만 **이번 은퇴로 EMA 가 전부 NULL 로 돌아가므로** 며칠 동안은 상수가 실제로 예산을 정한다.
권고: `t0_review` 0.5 → 0.6, `t0_new` 2 → 2.1 (부모 판단).

## 검증

- `packages/cards` 314/315 통과. 실패 1건은 내 변경 **밖**이다 — 다른 세션이
  `dictionary/ts/nullish-coalescing.yaml` 의 `one_liner` 를 바꿨고 골든이 옛 문장을 본다
  (내가 파일을 열기 전부터 빨갰다).
- `apps/desktop` 컴포넌트·데이터 테스트 전부 통과(`CodePlate` 21건 · `data` 141건).
- `tsc --noEmit`: `packages/cards` 깨끗. `apps/desktop` 은 `data/graph.ts:37` 하나만 남는데
  다른 세션의 `arch/role`·`arch/entry` 작업이다.
- eslint 0 · stylelint 0 · `check-rust-budget.sh` 2331/2800 (Rust 0줄).
- 마이그레이션: 시드 v0001~v0004 를 손으로 최신까지 올려 `integrity_check ok` ·
  `foreign_key_check` 0 · 행 수 차이 0 확인. `pnpm catalog:build` 는 지시대로 돌리지 않았다 —
  부모가 돌려야 `0004` 가 `catalog.ts` 에 실린다.