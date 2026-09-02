---
schema_version: 1
type: feature
slug: "m0-workspace-scaffold-rust-budget-gate"
status: done
difficulty: medium
created_at: "2026-09-02T22:21:20+09:00"
session_id: "20260902-004"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "Cargo.toml"
    op: create
  - path: "pnpm-workspace.yaml"
    op: create
  - path: "package.json"
    op: create
  - path: "tsconfig.base.json"
    op: create
  - path: "scripts/check-rust-budget.sh"
    op: create
  - path: "apps/desktop/src-tauri/tauri.conf.json"
    op: create
  - path: "apps/desktop/src-tauri/capabilities/default.json"
    op: create
  - path: "apps/desktop/src-tauri/src/lib.rs"
    op: create
  - path: "apps/desktop/src-tauri/src/commands/store.rs"
    op: create
  - path: "apps/desktop/src-tauri/src/commands/app.rs"
    op: create
  - path: "apps/desktop/src-tauri/src/error.rs"
    op: create
  - path: "apps/desktop/src-tauri/src/state.rs"
    op: create
  - path: ".gitignore"
    op: update
  - path: "dictionary/README.md"
    op: create
related: []
tags:
  - "m0"
  - "workspace"
  - "tauri"
  - "rust-budget"
  - "ci-gate"
  - "mcp-tool"
---
[x] M0 · 워크스페이스 스캐폴드 — Cargo/pnpm 워크스페이스 · Tauri 2 창 1개 · 얇은 Rust 예산 게이트

## 추가 기능

`docs/01-architecture.md` §4 레이아웃 그대로 루트에 앱 코드를 깔았다.

- 루트 `Cargo.toml`(workspace `crates/*` + `apps/desktop/src-tauri`, `unsafe_code = "forbid"`, `clippy::pedantic` deny), `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`.
- `apps/desktop` — Vite 6 + React 19, `src-tauri`(창 1360×860 · 최소 1000×680 · `visible:false` · `backgroundColor #D9CDB4`), 앱 id `dev.chickadee.app`, 06 §4.3 CSP 그대로, capabilities 최소 6개.
- `scripts/check-rust-budget.sh` — 01 §1.1 의 장치 4개(줄 예산 1500 · 도메인 금칙어 · SQL 리터럴 · `Command::new("git")`)를 한 스크립트로. tokei 가 없으면 같은 규칙을 awk 로 센다.
- 앱 아이콘은 확정 로고의 파생물(`design/logo/png/square-1024.png` → `cargo tauri icon`). 데스크톱만 남기고 iOS·Android 산출물은 지웠다.

`git init -b main`. `.gitignore` 에 `/target/`·`node_modules/`·`dist/`·`/fixtures/repos/*/`·`__pycache__/`·`.DS_Store` 추가. `.env` 는 이미 막혀 있었고 스테이징에 시크릿 값이 없음을 확인했다(`.env.example` 의 빈 키 이름과 과거 일지 본문만 매치).

## 동작 흐름

`crates/git`·`crates/parse` 는 M1 항목이라 아직 없다. 빈 디렉터리가 남아 있으면 `members = ["crates/*"]` 글롭이 매니페스트를 못 읽어 **cargo 가 워크스페이스 전체를 못 연다** — 디렉터리를 지우고 `[workspace.dependencies]` 의 두 줄을 주석 처리해 M1 에서 켜도록 표시했다.

`clippy::pedantic` 은 Tauri 명령에서 `needless_pass_by_value` 로 12건 터진다 — `#[tauri::command]` 매크로가 `AppHandle`·`State` 를 값으로 받도록 시그니처를 정하기 때문이다. 껍데기 코드에서 소음만 내는 린트라 워크스페이스 수준에서 allow 했다(`module_name_repetitions`·`missing_errors_doc` 와 같은 취급).

Tauri 는 `bundle.resources` 경로가 빌드 시점에 존재해야 한다 — 사전 내용은 M1 이지만 `dictionary/` 폴더와 README 를 먼저 만들어 번들 리소스 경로가 성립하게 했다.

## 검증

- `bash scripts/check-rust-budget.sh` → `줄 예산 558/1500 · 금칙어 없음 · SQL 리터럴 없음 · git 바이너리 호출 없음`.
- `cargo fmt --check` 통과, `cargo clippy --workspace --all-targets -- -D warnings` 통과.
- `npx tauri build --debug` → `Chickadee.app` + `Chickadee_0.1.0_aarch64.dmg` 생성(macOS aarch64, 20.2s).