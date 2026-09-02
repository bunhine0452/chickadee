---
schema_version: 1
type: chore
slug: "github-repo-english-surface-and-tone-rule"
status: done
difficulty: medium
created_at: "2026-09-02T23:28:32+09:00"
session_id: "20260902-004"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "CLAUDE.md"
    op: create
  - path: "README.md"
    op: create
  - path: "LICENSE"
    op: create
  - path: "docs/00-overview.md"
    op: update
  - path: ".github/workflows/ci.yml"
    op: update
  - path: ".github/workflows/release.yml"
    op: update
  - path: "deny.toml"
    op: update
  - path: ".gitleaks.toml"
    op: update
  - path: "rustfmt.toml"
    op: update
  - path: "scripts/check-rust-budget.sh"
    op: update
related: []
tags:
  - "m0"
  - "ci"
  - "github"
  - "policy"
  - "d61"
  - "d62"
  - "mcp-tool"
---
[x] GitHub 리포 생성·푸시, 표면 언어를 영어로 못박고 AI 말투 금지 규칙 추가 (D59~D62)

## 작업

- `bunhine0452/chickadee` **비공개**로 생성하고 M0 커밋을 푸시했다. 문서는 MIT 오픈소스를 향하지만(정본 §5) 지금은 골격 첫날이고, 비공개→공개는 언제든 되지만 그 반대는 안 된다. 리포 description·topics 도 영어로.
- **D61 표면 언어** — GitHub 표면(커밋·PR·`.github/**`·README 류·코드 주석)은 영어, 앱 UI 문구·사전 YAML·`docs/**`·`.oculpm/**` 는 한국어. 루트 `CLAUDE.md` 를 새로 만들어 세션마다 읽히게 했다(이 대화에만 남으면 다른 세션이 모른다).
- **D62 AI 말투 금지** — README·커밋·PR·릴리스 노트에 금지 낱말/문형 목록을 `CLAUDE.md` 에 뒀다. 「잘 써라」가 아니라 목록이어야 지켜진다.
- **D59** `react/` 사전 네임스페이스 허용, **D60** 인제스트 파일 범위 확정(00 §6 의 3·5 를 닫았다).
- `.github/**`·`deny.toml`·`.gitleaks.toml`·`rustfmt.toml`·`check-rust-budget.sh` 를 영어로 옮겼다. `deny.toml` 의 기계 판독 만료 토큰 `만료:` → `expires:` 를 옮기면서 `ci.yml` 의 grep 도 같이 옮겼다.
- README·LICENSE 신규.

## 첫 CI 실행이 잡아낸 것 두 가지

1. **`lint-type-unit` 이 ubuntu 에서 clippy 로 죽었다.** 이 잡은 `cargo clippy --all-targets` 로 Tauri 앱 크레이트까지 컴파일하는데, `build-3os` 만 GTK3/WebKitGTK 헤더를 깔고 있었다 — `gdk-sys` 가 pkg-config 에서 죽는다. 같은 apt 단계를 이 잡에도 넣었다.
2. **`audit` 이 post 단계에서 죽었다.** `setup-node` 에 `cache: pnpm` 을 줬는데 이 잡은 `pnpm install` 을 돌리지 않아 store 가 없다 — 캐시 저장이 「경로 없음」으로 잡 전체를 실패시켰다. 실제 검사(gitleaks·pnpm audit·cargo audit·cargo deny·만료 확인·Rust 예산)는 전부 통과하고 있었다. 캐시 입력을 뺐다.

## 금칙어 게이트의 구멍

번역 하위 세션이 발견했다. `\b(card|concept|…)` 는 `_` 가 word 문자라 **`_card` 와 `card_probe` 를 그냥 통과시킨다.** 고치면서 두 번째 버그도 나왔다 — 두 grep 을 파이프로 묶었더니 `pipefail` 아래서 한쪽이 매치하고 다른 쪽이 안 하면 파이프라인 상태가 1 이 되어 `if hits=$(…) && [ -n ]` 이 **실제 히트를 통째로 버렸다**. 상태를 보지 말고 내용만 보게 바꿨다.

이제 식별자 구성요소로 잡는다 — snake_case(`(^|[^A-Za-z0-9])(word)([^A-Za-z0-9]|$)`)와 camelCase(`[a-z0-9](Word)`) 두 패턴. `discard`·`wildcard`·`link`·`upgrade`·`enqueue` 는 여전히 통과한다(앞 글자가 영숫자라서).

## 검증

- **CI 3-OS 빌드가 실제로 초록이다** — macos-14 · windows-2022 · ubuntu-22.04 전부 `tauri build --debug` 성공(run 33637656072). M0 「끝났다는 증거」 1번이 이제 실측이다.
- 두 번째 실행(run 33640902927)에서 `audit`·`lint · type · unit` 도 초록.
- 금칙어 우회 5종(`_card_x`·`probe_concept`·`myQueue`·`SESSION`·문자열 `"grade"`) 전부 잡히고, 정상 낱말 6종은 오탐 0.
- `deny.toml` 만료 확인: 정상 통과 · 날짜를 과거로 조작 시 실패 · 옛 한국어 토큰으로 되돌리면 「만료일 없음」으로 실패.
- 로컬 전체: eslint 0 · stylelint 0 · typecheck 7/7 · vitest 210 · 대비 46쌍 · `cargo fmt`·`clippy -D warnings` · 예산 558/1500.