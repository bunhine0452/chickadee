---
schema_version: 1
type: bug
slug: "m1-incremental-and-memory-bugs"
status: done
difficulty: high
created_at: "2026-09-03T05:25:14+09:00"
session_id: "20260903-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src-tauri/src/jobs.rs"
    op: update
  - path: "apps/desktop/src-tauri/tests/pipeline.rs"
    op: update
  - path: "packages/concepts/src/ingest.ts"
    op: update
  - path: "packages/concepts/src/derive.ts"
    op: update
  - path: "apps/desktop/src/screens/ingest/IngestScreen.tsx"
    op: update
related: []
tags:
  - "m1"
  - "bug"
  - "ingest"
  - "incremental"
  - "memory"
  - "mcp-tool"
---
[x] M1 마무리 — 증분·메모리·단위 버그 넷을 잡았다

## 발생 원인 · 해결 방법

### 1. 증분 인제스트마다 히스토리 전체를 「사라진 커밋」으로 표시했다
`repo.dropped(old, to)` 는 `to` 를 숨기고 `old` 에서 여전히 닿는 것을 돌려준다 — 리베이스가 남긴 커밋이다. 잡 러너가 `to` 에 **빈 문자열**을 넘겨서 아무것도 숨기지 않았고, 그래서 직전 head 에서 닿는 **모든** 커밋이 사라진 것으로 돌아왔다. 평범한 fast-forward 에서도 그렇다 — 성능 픽스처에서 커밋 999개가 `commit_mark_unreachable` 로 들어갔다. M4 의 T2 정답지가 조용히 비어 있게 됐을 것이다.

고침: 현재 head 를 넘긴다. 회귀 테스트(`an_ordinary_fast_forward_drops_no_commits`)를 먼저 쓰고 옛 코드에서 빨개지는 것을 확인한 뒤 고쳤다.

**하위 세션이 벤치를 돌리다 발견했다** — 진짜 히스토리가 있는 리포에 증분을 처음 돌린 것이 그 벤치였다.

### 2. 순회가 모든 파일의 바이트를 파싱 때까지 들고 있었다
피크 메모리가 `파일 수 × 크기`. 상한(50,000파일 × 512 KiB)에서 기가바이트가 되고 03 §7 예산은 300 MB 다. 후보가 **경로와 크기**만 들고 워커가 파싱할 때 다시 읽게 했다 — 피크는 `레인 수 × 파일 크기` ≈ 2 MB.

### 3. 증분인데 리포 전체를 다시 파생했다
`deriveRepo` 가 매번 모든 파일의 캡처 페이지를 읽었다. 파일 5개 바뀐 증분이 캡처 50만 행을 읽는다. Rust 가 바뀐 파일만 `file_upsert` 하므로 `updated_at` 이 곧 「이번에 손댄 것」의 표시다 — `derive.files_changed_since` 로 좁혔다. 대지와 구멍의 분모는 여전히 리포 전체다.

### 4. 덮개 계산이 UTF-16 인덱스와 UTF-8 바이트를 섞었다
토크나이저의 `col` 은 문자열 인덱스, 캡처 스팬은 바이트다. ASCII 줄에서는 같아서 대부분의 코드에서 안 보이고, **한글이나 이모지가 든 줄에서만 틀린다** — 이 앱이 읽는 것이 바로 그런 코드다. `uncoveredRatio` 는 미지 개념 수로 이어지고 그것이 첫 노출을 고르므로, 조용한 편향이 잘못된 첫 카드를 고르게 된다.

## 그 밖

- **판 짜기 화면이 막다른 골목이었다.** 끝나면 취소 버튼이 사라지는데 그 자리가 비어 있었다. 성공하면 홈으로 넘어가고, 실패하면 이유와 「홈으로」를 준다.
- **트리 해시 검사에서 `.git` 을 빼고 있었다.** git 이 스스로 만지작거릴 것이라고 가정했는데 아니다 — libgit2 는 읽기만 한다. 넣고 돌려도 통과한다. 즉 인제스트 중 리포의 **단 한 바이트도** 바뀌지 않는다: 워크트리도, 객체 DB 도, 인덱스도.

## 검증

- `cargo test --workspace` 82건 · `pnpm test:unit` 453건 · `pnpm lint` · `pnpm typecheck` · `cargo fmt --check` · `cargo clippy --workspace --all-targets -- -D warnings` 전부 통과.
- `bash scripts/check-rust-budget.sh` 2043/2100(잠정, D68).
- 1·4번은 **회귀 테스트를 먼저 쓰고 옛 코드에서 실패하는 것을 확인**한 뒤 고쳤다.