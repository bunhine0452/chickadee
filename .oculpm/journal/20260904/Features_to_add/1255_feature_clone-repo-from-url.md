---
schema_version: 1
type: feature
slug: "clone-repo-from-url"
status: done
difficulty: medium
created_at: "2026-09-04T12:55:17+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/git/Cargo.toml"
    op: update
  - path: "crates/git/src/lib.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/commands/repo.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/error.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/lib.rs"
    op: update
  - path: "packages/ipc-client/src/errors.ts"
    op: update
  - path: "packages/ipc-client/src/index.ts"
    op: update
  - path: "packages/ui/src/error-copy.ts"
    op: update
  - path: "packages/concepts/src/repos.ts"
    op: update
  - path: "packages/concepts/src/index.ts"
    op: update
  - path: "packages/concepts/src/repos.test.ts"
    op: update
  - path: "packages/i18n/src/ko/repos.ts"
    op: update
  - path: "packages/i18n/src/en/repos.ts"
    op: update
  - path: "packages/i18n/src/ko/ui.ts"
    op: update
  - path: "packages/i18n/src/en/ui.ts"
    op: update
  - path: "apps/desktop/src/screens/repos/CloneField.tsx"
    op: create
  - path: "apps/desktop/src/screens/repos/CloneField.css"
    op: create
  - path: "apps/desktop/src/screens/repos/data.ts"
    op: update
  - path: "apps/desktop/src/screens/repos/ReposScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/repos/ReposScreen.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/empty.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/empty.test.tsx"
    op: update
  - path: "docs/01-architecture.md"
    op: update
  - path: "docs/05-frontend.md"
    op: update
  - path: "docs/06-quality-security-release.md"
    op: update
  - path: "CONTRIBUTING.md"
    op: update
related: []
tags:
  - "repo"
  - "rust"
  - "git2"
  - "i18n"
  - "d129"
  - "mcp-tool"
---
[x] git 주소로 리포 받기 (D129) — 첫 실행·서가의 두 번째 문, Rust +31줄

사용자 요청 1 — 「실행 시 레포를 등록하는 곳에서 git clone 링크 추가할수있는 기능」. 예산은 사용자가 D129 로 2,800 을 결정했고 받는 자리도 사용자가 골랐다(폴더를 고르게 한다).

## 추가 기능

**Rust (+31줄, 합계 2,331/2,800)**

- `crates/git` — `Repo::clone_into(url, into)`. `https://` 만 받고 `into` 가 이미 있으면 거절한다. 오류 변종 둘(`BadUrl`·`Occupied`)이 IPC 코드 `GIT_URL_UNSUPPORTED`·`GIT_DEST_OCCUPIED` 로 나간다. `git2` 의 `https` 기능을 켰다 — macOS 는 SecureTransport 라 openssl 의존이 늘지 않는다(`cargo check` 7.9s, 새 시스템 라이브러리 0).
- `repo_clone { url, into } → RepoProbe` — `async` 명령이고 실제 일은 `spawn_blocking` 에 있다. libgit2 에 async 형태가 없고 이 한 번이 분 단위로 걸릴 수 있어 UI 스레드에 두지 않는다.

**TypeScript**

- `cloneTargetName(url)` — 받을 수 있는 주소인가 + 폴더 이름은 무엇인가. `..`·구분자가 섞인 이름을 거른다(그 이름이 곧 우리가 만들 폴더다). **화면은 폴더 대화상자를 열기 전에 이것부터 본다** — 고르고 나서 거절하면 두 걸음이 헛것이 된다.
- `cloneRepo(url, parentDir)` — 받아서 그 자리만 돌려준다. 장부에는 쓰지 않는다: 등록은 폴더를 고른 길과 같은 `registerRepo` 로 모인다. 구분자는 부모 경로가 쓰던 것을 따른다(`C:\a\b` 에 `/` 를 섞지 않는다).
- `CloneField` — 주소 한 줄 + 단추. **첫 실행 화면과 서가가 같은 것을 쓴다.** 받는 동안 잠기고, 끝나면 칸이 비며 인제스트 화면이 열린다.

## 동작 흐름

주소를 붙여넣고 「주소로 받기」 → (주소 검사) → 받을 **부모 폴더** 고르기 → `<부모>/<리포이름>` 으로 받기 → `addRepo` 가 등록하고 인제스트 시작 → 시간 비례 큐가 진행을 그린다. 받지 못하면 오류 코드가 문구 표(01 §6)를 거쳐 토스트로 나온다 — 「https 주소만 받을 수 있습니다」·「받을 자리에 이미 무언가 있습니다」.

진행률은 없다. libgit2 의 진행을 화면까지 나르려면 이벤트 통로가 하나 더 필요하고, 그것은 이 문이 나르는 정보(끝났나·실패했나)보다 크다.

## 검증

```
cargo clippy --workspace --all-targets   → 초록
bash scripts/check-rust-budget.sh        → 2331/2800 (git 472/560 · app 1152/1460), 방벽 넷 초록
pnpm lint · pnpm test:unit               → 1753 passed
```

새 테스트 — 장부 넷(받을 자리 경로·Windows 구분자·장부에 안 쓴다·못 쓸 주소 거절), 서가 하나(주소를 치면 그 주소로 받고 칸이 비워진다), 첫 실행 둘(문이 둘이다·주소가 비면 잠겨 있다).

**실제 네트워크로 받아 보는 것은 아직 안 했다** — 이 세션의 마지막 확인(창을 띄우는 자리)에서 함께 본다.

## 메모

- 01 §4 트리가 `crates/git/src/clone.rs` 를 적고 있었으나 함수는 12줄이라 `open` 옆(`lib.rs`)에 뒀고, 트리를 그렇게 고쳤다.
- ssh 주소(`git@…`)는 받지 않는다. 열쇠·`known_hosts` 를 어디서 가져올지가 별도 결정이고, 그 결정 없이 열면 실패가 조용해진다.