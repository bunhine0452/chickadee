---
schema_version: 1
type: feature
slug: "m0-ci-workflows-and-security-config"
status: done
difficulty: high
created_at: "2026-09-02T22:31:58+09:00"
session_id: "20260902-004"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: ".github/workflows/ci.yml"
    op: create
  - path: ".github/workflows/release.yml"
    op: create
  - path: "eslint.config.js"
    op: create
  - path: "deny.toml"
    op: create
  - path: "rustfmt.toml"
    op: create
  - path: "package.json"
    op: update
  - path: "apps/desktop/src-tauri/Cargo.toml"
    op: update
  - path: "crates/store/Cargo.toml"
    op: update
related: []
tags:
  - "m0"
  - "ci"
  - "security"
  - "eslint"
  - "cargo-deny"
  - "supply-chain"
  - "mcp-tool"
---
[x] M0 · CI·릴리스 워크플로와 보안 설정 — 게이트를 실제로 도는 것만 초록으로 둔다

## 추가 기능

- `ci.yml` — `lint-type-unit` · `audit` · `build-3os`(macos-14 · windows-2022 · ubuntu-22.04 에서 `tauri build --debug`, D53). 액션 8개 전부 실제 커밋 SHA 로 고정(06 §4.4). 잡마다 `timeout-minutes`.
- `release.yml` — tauri-action 4매트릭스 드래프트 + `SHA256SUMS.txt`.
- `eslint.config.js` — `@tauri-apps/api` 는 `packages/ipc-client` 안에서만 · 01 §2 의존 방향 · `Math.random` 금지 · `no-console` · `dangerouslySetInnerHTML` 은 D42 의 두 파일만.
- `deny.toml` · `rustfmt.toml` · `.gitleaks.toml`.

## 동작 흐름

**M1·M2 잡은 주석으로 남겼다.** `if: false` 는 *Skipped* 잡을 만드는데 GitHub 의 브랜치 보호는 skipped 를 **성공으로 센다** — 하지 않은 일에 초록 체크가 붙는다. 주석 블록은 체크 목록에 아예 나타나지 않는다. 각 블록은 06 §5.1 의 단계를 그대로 두고 첫 줄에 「무엇이 생기면 켜는지」를 적었다.

**막고 있던 것 세 가지를 이 세션에서 고쳤다.**
1. `pnpm audit` 이 critical 1 · high 1 로 빨갰다 — `vitest` GHSA-5xrq-8626-4rwp(패치 ≥3.2.6)와 그것이 끌던 `vite` GHSA-fx2h-pf6j-xcff. `vitest` 를 `^3.2.6` 으로 올렸다. 210개 테스트 전부 그대로 통과.
2. `cargo deny` 가 `chickadee-app`·`chickadee-store` 를 `unlicensed`·`wildcard` 로 잡았다 — `[licenses.private] ignore` 가 크레이트를 private 로 알아보려면 `publish = false` 가 필요하다. 두 매니페스트에 넣었다.
3. `crates/git`·`crates/parse` 의 빈 `src/` 디렉터리가 되살아나 `members = ["crates/*"]` 글롭이 다시 깨졌다(`cargo metadata` 가 실패하면 cargo-deny 도 못 돈다). 지웠다.

**`git2` 는 M1 에서 `>= 0.21.0` 이어야 한다.** 그 아래는 open unsound 권고 3건(RUSTSEC-2026-0008 · -0183 · -0184)이 붙는다. `crates/git` 이 신뢰할 수 없는 리포를 파싱하므로(06 §4.1 위협 모델) 무시 목록에 넣지 않았다 — M1 에서 0.21 이상으로 고정해야 CI 가 초록이 된다.

`advisories.ignore` 16건은 전부 `unmaintained`(취약점·unsound 0건)이고 Tauri/wry 가 Linux 에서 강제하는 GTK3 바인딩 10개 등이다. cargo-deny 에 만료 필드가 없어 사유 문자열의 `만료: YYYY-MM-DD` 를 기계로 읽어 지났거나 없으면 실패시키는 CI 단계를 따로 뒀다(06 §2 의 「만료일 필수」를 cargo 쪽에도 적용).

문서의 `macos-13` 은 GitHub 이 은퇴시켰다 — `macos-15-intel` 로 바꿨다(actionlint 가 잡아냈다).

## 검증

- `actionlint 1.7.12 .github/workflows/*.yml` → exit 0. 파이썬 `yaml.safe_load` 로도 파싱 확인.
- ESLint 규칙이 실제로 터지는지 `/tmp` 의 시험 파일로 확인 — `@tauri-apps/api` 위반 · 계층 위반 · `Math.random`(계산 접근 `Math['random']` 포함) · `no-console` · `dangerouslySetInnerHTML` 5종 전부 잡히고, 허용된 두 파일은 깨끗.
- `cargo-deny check` **실제 워크스페이스에서** → `advisories ok, bans ok, licenses ok, sources ok`.
- `pnpm audit --audit-level=high` → `No known vulnerabilities found`.
- `cargo fmt --all --check` · `cargo clippy --locked --all-targets -- -D warnings` · `cargo test --workspace`(12 passed) · `check-rust-budget.sh` 전부 통과.
- **CI 자체는 아직 돌지 않았다** — 리포에 remote 가 없어 GitHub Actions 를 실행할 수 없다.