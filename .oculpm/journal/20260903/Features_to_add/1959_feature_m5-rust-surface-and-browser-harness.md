---
schema_version: 1
type: feature
slug: "m5-rust-surface-and-browser-harness"
status: done
difficulty: high
created_at: "2026-09-03T19:59:26+09:00"
session_id: "20260903-008"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched: []
related: []
tags:
  - "m5"
  - "rust"
  - "keyring"
  - "playwright"
  - "harness"
  - "decision"
  - "mcp-tool"
---
[x] M5 바탕 — Rust 표면 다섯·패닉 훅, 브라우저 게이트의 다리

## 추가 기능

### 결정 (사용자 확인 셋 + 구현에서 나온 하나)
- **D106** LLM 4단은 MVP 에서 **전송하지 않는다**(사용자). 01 §7 이 이미 「MVP 는 생성·복사만」
  이라고 적었고 06 Q9 만 전송을 요구했다 — 문서끼리 어긋난 자리였다. 예산으로도 갈렸다.
  Q9 의 범위는 골든 + 키체인 저장·삭제·존재 확인 + 그 세 상태의 화면까지.
- **D107** 흐름 추적·의존성 방향 판을 M5 에서 **화면까지** 잇는다(사용자). M4 가 생성기·채점기·
  골든을 다 만들고도 `T2Plate` 이 두 종만 받아 릴리스에 담기는 T2 가 절반이었다.
- **D108** Playwright 하네스는 IPC 를 **Node 로 넘긴다**. 브라우저에 SQLite 를 넣는 두 길이 다
  나쁘다 — `sql.js` 는 CSP 에 `wasm-unsafe-eval` 을 열어야 하고(게이트가 재는 CSP 가 실물과
  달라진다), 응답 녹화는 파라미터가 하나만 어긋나도 죽는다.
- **D109** M5 의 Rust 표면은 다섯 명령 + 패닉 훅이고 **파일 쓰기는 경로를 인자로 받지 않는다**.
  서명·공증은 기본값(유보 + README 우회 안내) 그대로(사용자).

### Rust (`apps/desktop/src-tauri/src/`)
- `commands/maint.rs` — `secret_set` · `secret_delete`(멱등) · `secret_has`(**값을 꺼내는 문이
  없다**) · `app_write_json{box,name,json}` · `app_wipe`. `box` 는 `exports`·`logs/crash`
  둘뿐이고 `name` 은 `[A-Za-z0-9._-]` 만 통과한다 — `..` 도 `/` 도 못 지나간다.
- `panic.rs` — `panic::set_hook` 이 `<app_data>/logs/crash/<ts>.json` 을 남긴다. 앱 버전·OS·
  아키텍처·앱 소스의 자리·메시지 200자. 사용자 코드도 리포 경로도 없다.
- `keyring 3`(`apple-native`·`windows-native`·`sync-secret-service`·**`crypto-rust`**).
  `crypto-openssl` 은 `openssl-src` 를 끌고 와 CI 마다 OpenSSL 을 원본에서 빌드한다.

### 브라우저 하네스 (`tests/`)
- `support/internals.ts` — 페이지에 `window.__TAURI_INTERNALS__` 를 심는 초기화 스크립트.
  `invoke`·`transformCallback`·`metadata` 와 이벤트 플러그인(listen/emit/unlisten)까지.
- `support/build-seed.ts` + `.test.ts` — **vitest 에서** `.seed/ui.sqlite` 를 굽는다.
- `support/app-db.ts` — 구운 시드를 **바이트로** 열어 테스트마다 새 사본으로 답한다.
- `support/fixture.ts` — `page.exposeFunction` 다리 + `waitForHome`.
- `playwright.config.ts` — `chromium`·`webkit`, `retries: 0`, 스냅샷 임계 0.2%.
- `tests` 가 워크스페이스 패키지가 됐다(`@chickadee/tests`).

## 밟은 것

- **Rust 줄 예산이 정확히 찼다.** 처음 쓴 대로면 2,314/2,300 이었다. `data_dir` 을 `app.rs`·
  `store.rs`·`panic.rs` 가 나눠 쓰게 하고(같은 네 줄이 세 벌 있었다) `app_wipe` 의 오류 갈래를
  `match` 로 접어 **2,300/2,300 — 여유 0**. D68 이 남은 것으로 잡았던 `dict_*` ~65 는 M5
  플랜 항목에 아예 없어 쓰지도 않았는데 딱 찼다. M6 의 `repo_glob_read`(~30)는 안 들어간다.
- **`PanicHookInfo` 는 1.81 부터다.** 워크스페이스 `rust-version` 이 1.80 이라 clippy 의
  `incompatible_msrv` 가 잡았다. 1.81 로 올렸다(D109).
- **`import.meta` 가 Playwright 에서 안 돈다.** Playwright 는 TS 를 CJS 로 옮겨 돌린다.
  `createRequire(import.meta.url)` 도, **`packages/dictionary` 의 `import.meta.glob`(Vite)** 도
  열리지 않는다. 그래서 시드를 굽는 것과 여는 것을 갈랐다 — 굽기는 vitest, 열기는 Playwright.
  상수만 `build-seed-const.ts` 로 빼서 둘이 나눠 갖는다.
- **`vite preview` 는 `--host 127.0.0.1` 이 있어야 한다.** 기본값 `localhost` 는 이 기계에서
  ::1 로만 열려 `baseURL` 의 127.0.0.1 이 붙지 못한다 — 연결 자체가 안 되고 `webServer` 가
  120초를 기다리다 죽는다.
- **`tests/` 는 워크스페이스 패키지여야 한다.** 아니면 `@chickadee/*` 가 루트
  `node_modules` 에 없어 해석이 안 된다.
- **이슈 폼은 `body=` 를 무시한다.** `t1-appeal.ts` 의 `issueUrl` 이 `template: 't1-rule.yml'`
  (파일 이름이 다르다)에 모든 것을 `body` 하나로 담고 있었다 — 열리기는 하는데 **빈 칸으로**
  열린다. 필드 id 로 바꾸고, 폼 파일을 읽어 id 를 대조하는 테스트를 붙였다.

## 검증

- `cargo clippy --workspace --all-targets --locked -- -D warnings` 0 · `cargo fmt --check` 무출력
- `bash scripts/check-rust-budget.sh` → **2,300/2,300**, 금지 낱말·SQL·raw 출력·git 바이너리 0
- `npx vitest run tests/support/build-seed.test.ts` 통과
- `npx playwright test tests/gates/smoke.spec.ts` — **chromium·webkit 둘 다 통과**
- `npx tsc --noEmit -p tests/tsconfig.json` 0
- `npx vitest run packages/grading/src/t1.test.ts` 46건 통과(이슈 폼 id 대조 1건 추가)
- `node scripts/sync-version.mjs --check` · `node scripts/third-party.mjs --check` 통과