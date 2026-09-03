---
schema_version: 1
type: feature
slug: "m5-gates-e2e-and-defects-they-found"
status: done
difficulty: high
created_at: "2026-09-03T20:52:07+09:00"
session_id: "20260903-009"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched: []
related: []
tags:
  - "m5"
  - "gates"
  - "e2e"
  - "playwright"
  - "a11y"
  - "decision"
  - "bugfix"
  - "mcp-tool"
---
[x] M5 통합 — 게이트·E2E 를 잇고 그것들이 잡은 결함을 고쳤다

## 추가 기능

하위 세션 다섯이 만든 것을 이어 붙이고, **그 게이트들이 잡은 화면 결함을 고쳤다**.
게이트를 세우는 것이 목적이 아니라 게이트가 무언가를 잡는 것이 목적이므로, 잡힌 것을
`test.fail()` 로 남겨 두지 않고 고친 뒤 그 표식을 지웠다.

### 이은 것
- `ci.yml` — `design-gates`·`e2e-linux` 잡을 **주석에서 꺼내 켰다**. `version:check` ·
  `licenses:check` · **모의 키 grep** 게이트를 더했다. `test:visual` 은 아직 안 켠다(기준선이
  리눅스 러너에서 처음 생성돼야 한다 — `tests/visual/README.md`).
- `facts.run_stamp` statement 와 `maintenance.currentBuild`/`stampRun` — **재인제스트 지문이
  아무도 안 쓰고 있었다**(Rust 는 `null` 로 두고 파생 층은 안 채웠다). 이제 인제스트 끝에
  적히고 홈이 그것으로 배너를 켠다(06 §6.3).
- `SessionScreen` 에 T2 네 종 배선(D107 의 마지막 한 걸음) · `accounts.ts` 로 순환 import 해소 ·
  `IPC_ERROR_CODES` 에 `SECRET_STORE` · `ipc.clip` · `IngestOptions.onJob`.
- `DEFAULTS.trim` 을 플랫폼별로(D12 · 05 §4.3 이 요구한 갈래가 코드에 없었다).

### 결정 (D110~D112)
- **D110** 인제스트 진행 4칸의 묶음을 **잡이 내보내는 순서**에 맞춘다.
- **D111** 클립보드는 Tauri 플러그인 · Esc ①은 포커스를 오버레이로 · `ingest_cancel` 을 실제로.
- **D112** 본문 행 길이의 정본은 **05 §9** — 06 §2 의 숫자를 그리로 맞춘다.

## 밟은 것 — 게이트가 잡은 결함 여섯

1. **클립보드가 Tauri 플러그인이 아니었다.** `navigator.clipboard.writeText` 는 패키징된
   WKWebView(**기준 엔진**)에서 조용히 거절하고, `void` 가 그것을 삼켰다 — 사용자에게는
   아무 일도 안 일어난다. `ipc.clip.write` 로 바꾸고 실패를 말하게 했다.
2. **`?` 로 사다리를 접으면 포커스가 `<body>` 로 떨어졌다.** `Escape` 갈래에는 있던 대칭이
   빠져 있었다. 게다가 그 뒤의 Esc 가 `closest('.reprint')` 를 못 찾아 **두 번에 홈**까지 갔다.
   — 고치고 나니 **WKWebView 에서만 여전히 실패**했다: macOS 의 「모든 항목에 Tab 이동」이
   꺼져 있으면 `<button>.focus()` 가 **조용히 아무 일도 안 한다**. `focus.ts` 가 옮겨졌는지
   확인하고 `tabindex="-1"` 문맥으로 물러선다.
3. **세션을 닫고 홈으로 오면 포커스가 `<body>`.** 05 §7 의 `returnFocusId` 는 코드에 없다 —
   홈 뿌리로 옮기는 것으로 대신했다.
4. **감축 모션에 `.ch`·`.press-btn` 이 남았다.** 06 §2 는 이 게이트에 예외가 없다.
5. **인제스트 진행 막대가 뒤로 갔다.** 두 겹이었다 — ① 칸 묶음이 `walk`+`git` 인데 잡은
   `walk → parse → git` 순으로 내보낸다(1 → 2 → **1**). ② 묶음을 고치고 나니 **칸 안에서**
   되돌았다: 앞 단계가 10/10 으로 칸을 채운 직후 뒤 단계가 0/10 으로 시작한다. 칸 안의
   자리를 `(단계 순번 + 진행) / 단계 수` 로 재서 막았다.
6. **아래층 점프 단추가 한 번도 뜬 적이 없다.** `PrereqRung` 이 `row.cardId !== undefined` 를
   요구하는데 **그 필드를 아무도 채우지 않았다**. `state === 'gap'` 이 이미 「내려갈 수 있다」를
   뜻하므로(`stateOf` 가 `hasCard && hasSite` 일 때만 준다) 죽은 가드를 지웠다.

그 밖에 밟은 것:
- **`import.meta` 가 Playwright 에서 안 돈다** — 시드를 굽는 쪽(vitest)과 여는 쪽을 갈랐다.
- **`vite preview` 는 `--host 127.0.0.1`** 이 없으면 ::1 로만 열려 붙지 못한다.
- **`AnimationPlayState` 에 `'pending'` 이 없다**(엔진에는 있다) — 타입만 보고 빼면 갓 시작한
  애니메이션을 「끝났다」로 읽는다.
- **`keyring` 의 `crypto-openssl`** 은 `openssl-src` 를 끌고 와 CI 마다 OpenSSL 을 빌드한다.

## 검증

- `npx vitest run` → **148파일 1,565건** 통과
- `pnpm test:gates` → **86 통과 · 8 건너뜀 · 0 실패**(chromium·webkit). 건너뛴 8은 `tiny` 시드에
  T1 블록·T2 커밋이 없어 그 판이 큐에 안 서는 것이고, 사유가 테스트 이름에 있다.
- `pnpm test:e2e-ui` → **20 통과 · 12 건너뜀 · 0 실패**(두 엔진)
- `pnpm typecheck` · `pnpm lint` · `cargo fmt --check` · `cargo clippy -D warnings` 전부 통과
- `cargo test --workspace` · `cargo test -p chickadee-app --test pipeline`(16건) 통과,
  `git diff --exit-code fixtures/ipc` 무변화
- `check-rust-budget` **2,300/2,300** · `check-contrast` 48쌍 · `check-motion` 위반 0 ·
  `design:check` 통과 · `sync-version --check` · `third-party --check` 통과