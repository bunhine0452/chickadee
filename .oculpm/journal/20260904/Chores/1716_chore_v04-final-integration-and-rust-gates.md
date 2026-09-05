---
schema_version: 1
type: chore
slug: "v04-final-integration-and-rust-gates"
status: done
difficulty: medium
created_at: "2026-09-04T17:16:04+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/store/src/migrate.rs"
    op: correct
  - path: "packages/store-sql/src/migrate-seed.test.ts"
    op: correct
  - path: "packages/scheduler/src/plan.ts"
    op: update
  - path: "packages/scheduler/src/plan.test.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/02-data-model-and-scheduling.md"
    op: update
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
related: []
tags:
  - "v04"
  - "integration"
  - "mcp-tool"
---
[x] 0.4 마무리 통합 — 그리고 내가 넣은 Rust 게이트 위반 둘

## 동기

병렬 세션 넷(코드 창 · 리포 지도 · 사전 채우기 · 채점/화면 배선)이 남긴 인계를 수거하고 게이트를 다시 초록으로 만드는 마지막 패스.

## 수거

- **등록부** D141(코드 창) · D142(리포 지도) · D146(이행 러너의 외래키) 세 행. 세션들은 초안만 냈고 `docs/00` 은 처음부터 부모 몫이었다 — 넷이 각자 고쳤으면 서로 덮어썼을 자리다.
- **정본 §2** — T2 를 네 종에서 여섯 종으로. 「지도의 축척이 둘」 산문 두 문단. `docs/00` §4.3 에 근거를 적고 discussion 로그에 한 줄.
- **`EST_MIN` 상향** — 코드 창이 넓어져 읽는 시간이 늘었는데(실측 `t0_review` 0.58~0.67 · `t0_new` 2.08~2.17) 옛 값 `0.5 · 2` 를 두면 만기 20건인 날 계획이 27.2분으로 부풀어 `DROP_ORDER` 가 **새 T1 까지** 잘라 낸다. 아침에 D140 이 고친 「구조 판이 먼저 잘리지 않는다」가 다른 트랙에서 되풀이되는 자리였다. 0.6 · 2.1 로 올리고 02 §5.1 에 근거를 적었다.
- **테스트가 숫자를 박아 두고 있던 것도 고쳤다** — `plan.test.ts` 세 자리가 `0.5`·`10`·`14` 를 하드코딩해 상수가 움직이자 빨개졌다. `EST_MIN` 에서 끌어오게 바꿨다. 그 테스트가 재는 것은 합계가 아니라 **빼는 순서**다.

## 내가 넣은 것 셋을 되돌렸다

1. **Rust 금칙어** — `migrate.rs` 주석에 `card` 를 적었다. 01 §1.1 이 Rust 에 도메인 어휘를 금지하고 `check-rust-budget.sh` 가 강제한다. 「부모 표」로 고쳐 썼다.
2. **Rust 안의 SQL** — 외래키 위반을 `query_row("SELECT COUNT(*) FROM pragma_foreign_key_check")` 로 셌다. 같은 규칙이 SQL 리터럴을 금지한다(SQL 은 `packages/store-sql/statements/**` 에만 산다). `conn.pragma_query` 로 바꿨다 — 세는 방식만 다르고 결과는 같다.
3. **`no-unsafe-finally`** — `migrate-seed.test.ts` 의 `finally` 안에서 던지고 있었다. 원래 오류를 가린다. 되살리는 것만 `finally` 에 두고 판정은 밖으로 뺐다.

셋 다 게이트가 잡았다. 게이트가 없었으면 셋 다 통과했을 것이다.

## 알아 둘 것 — 다른 세션과 같은 리포를 고쳤다

작업 중 다른 대화 세션이 **D147**(프로그래밍이 처음인 사용자를 대상에 넣는다)을 넣으며 정본 §1·§4 와 `README.md`, `packages/concepts/src/zero-chapter.ts` 를 고쳤다. 사용자 결정으로 등록부에 올라 있어 되돌리지 않았다.

**다만 문구가 서로 반대말을 하는 상태다**: README 는 초보를 받아들이게 바뀌었는데 `ko/core.ts` 의 `firstRun.scope`(오늘 D139 로 내가 넣은 것)와 `ko/home.ts` 의 `home.newcomerBody` 는 아직 「아직 교재가 없는 셈입니다」라고 말한다. **`ko` 가 정본이므로 이쪽이 더 무겁다.** `packages/i18n` 을 그 세션과 내 배선 세션이 동시에 잡고 있어 손대지 않고 사용자에게 물었다.

## 검증

- `pnpm test:unit` **1,975개 / 177 파일 통과** (오늘 시작 1,780 → +195).
- `pnpm typecheck` · `pnpm lint` · `pnpm -r build` 초록.
- `cargo test -p chickadee-store` 13개 통과. `check-rust-budget.sh` 다섯 검사 전부 초록, **2,352 / 2,800**.
- 아직 안 한 것: **앱을 한 번도 띄우지 않았다.** Playwright 게이트(`test:gates`·`test:visual`·`test:e2e-ui`)도 안 돌렸다 — Esc 사다리에 단이 늘었고(D143) 판 높이가 바뀌었으므로(D141) 시각·키보드 게이트가 볼 것이 생겼다.