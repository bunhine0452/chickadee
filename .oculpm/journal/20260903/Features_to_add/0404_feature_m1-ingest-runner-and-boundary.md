---
schema_version: 1
type: feature
slug: "m1-ingest-runner-and-boundary"
status: done
difficulty: superhigh
created_at: "2026-09-03T04:04:14+09:00"
session_id: "20260903-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src-tauri/src/jobs.rs"
    op: create
  - path: "apps/desktop/src-tauri/src/commands/repo.rs"
    op: create
  - path: "apps/desktop/src-tauri/src/commands/ingest.rs"
    op: create
  - path: "apps/desktop/src-tauri/tests/pipeline.rs"
    op: create
  - path: "apps/desktop/src-tauri/src/state.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/error.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/commands/store.rs"
    op: update
  - path: "packages/store-sql/statements/facts.sql"
    op: update
  - path: "packages/ipc-client/src/index.ts"
    op: update
  - path: "packages/ipc-client/src/types.ts"
    op: update
  - path: "scripts/check-rust-budget.sh"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/01-architecture.md"
    op: update
related: []
tags:
  - "m1"
  - "rust"
  - "ingest"
  - "rust-budget"
  - "d65"
  - "d68"
  - "mcp-tool"
---
[x] M1 · 인제스트 잡 러너 + Rust↔TS 경계 재조정(D64~D68) — 예산 실측 2028

## 추가 기능

`apps/desktop/src-tauri/src/jobs.rs` — 순회(`ignore::WalkBuilder`, 심링크 미추적) → 필터(생성물 마커·`linguist-generated`·바이너리·행 상한·크기 상한) → git blob oid 해시 → 워커 스레드 파싱 / 이 스레드 쓰기 → 히스토리 → 500행 tx. 취소 토큰은 파일·커밋·배치마다 본다.

명령 8개 추가: `repo_probe` · `file_read_lines` · `file_read_block` · `git_blame_lines` · `parse_langs` · `app_reveal` · `ingest_start/cancel/status`.

## 동작 흐름

- **파일 id 가 Rust 를 지나가지 않는다.** `facts.capture_insert` 가 `(SELECT id FROM file WHERE repo_id=:repoId AND path=:path)` 로 직접 찾고, `commit_file_insert` 도 sha 로 같은 일을 한다. 덕분에 「upsert → id 를 되읽기 → 캡처 쓰기」 3단계가 사라지고 배치 하나로 흐른다.
- **`store` 는 `Arc` 뒤로 갔다.** 이전 구조는 `Mutex<Option<Store>>` 를 인제스트 내내 잡고 있어 화면의 `store_query` 가 몇 초 동안 막혔다. 이제 핸들만 복제하고 바깥 잠금을 놓는다.
- **`Sink.emit` 은 `AppHandle` 이 아니라 클로저다.** `AppHandle<R>` 을 쓰면 런타임 타입이 `run`·`pass`·`scan_all`·`history` 시그니처를 전부 타고 다니고, 테스트는 `MockRuntime` 이라 타입이 안 맞는다. 클로저로 두니 통합 테스트가 이벤트를 모아서 검사할 수 있게 됐다 — 로그 금지 필드 검사가 그래서 가능하다.
- statement 는 **없는 키를 NULL 로 바인딩**한다(M0 `bind()` 의 성질). 그래서 Rust 는 자기가 아는 열만 적는다 — `lang`·`dict_version`·`query_hash`·사용처 수는 파생 층이 뒤에 채운다.

## 밟은 지뢰

**macOS 의 `/var` → `/private/var` 심링크.** `Repo::open` 이 루트를 `canonicalize` 하는데 순회는 호출자가 준 경로에서 시작했다. `strip_prefix` 가 전부 실패해 파일 0개가 나왔고, 오류가 아니라 「빈 리포」로 보였다. 순회도 `repo.root()` 에서 시작하게 고쳤다. `std::env::temp_dir()` 로 만든 테스트에서만 드러난다 — 홈 디렉터리 밑 리포에서는 증상이 없다.

## 문서와 달라진 것 (결정 등록부)

- **D64** 크레이트별 하위 예산 재배분 · `git_diff_text` → M4.
- **D65** `repo_register/list/relocate/remove/glob_read` 폐기 → `repo_probe` 하나. 장부는 TS. `IngestSpec` 에 `rootPath`·`sinceHead` 추가. Rust 필수 카탈로그 이름에서 `repo.*` 4개 제거(`facts.*` 10개만).
- **D66** 번들 사전은 Vite 가 JS 에 굽는다 → `dict_*` 4개 폐기, `bundle.resources` 제거. 사용자 오버라이드·디스크 캐시는 M5.
- **D67** `parse_snippet` → M3.
- **D68 (사용자 결정 대기)** 줄 예산 실측 `git 383 + parse 358 + store 343 + app 951 = 2,035`. 01 §1.1 의 1500 과 정본 §5 의 「500~1500줄」은 **고치지 않았다** — 정본 변경은 사용자 확인이 먼저다(§7-2). 게이트는 잠정 2100 이고 크레이트별 내역을 매번 출력한다. 실제 방벽(도메인 어휘·SQL 리터럴·git 바이너리·`forbid(unsafe_code)`·`clippy::pedantic`)은 전부 초록이다.

## 알려진 한계

- `IngestDone.peakRssMb` 는 0 이다. 크로스플랫폼 RSS 측정은 크레이트가 필요하고, 06 §1.6 의 300 MB 는 criterion 벤치가 잴 몫이라 명령에서는 재지 않는다.
- `git` 단계의 `total` 은 0(미상)이다. 커밋 수를 미리 세려면 revwalk 를 한 번 더 돌아야 해서, 시간 비례 표시는 TS 의 추정치에 맡긴다.

## 검증

- `cargo test --workspace` — 54건 통과(git 16 · parse 17 · store 12 · pipeline 9).
- pipeline 9건이 증명하는 것: 캡처가 sqlite 에 남음 · **인제스트 전후 트리 해시 동일** · 증분이 안 바뀐 바이트를 건너뜀 · 삭제 파일은 `is_alive=0` · 취소 후 이어하기 · 악성 입력 4종 스킵 + 사유 경고 · 트리 밖 심링크 미추적 · 커밋 0개 리포 · 4단계 이벤트와 **로그 금지 필드 0**.
- `cargo clippy --workspace --all-targets -- -D warnings` · `cargo fmt --check` · `pnpm lint` · `pnpm typecheck` · `pnpm test:unit`(210건) 전부 통과.