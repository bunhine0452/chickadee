---
schema_version: 1
type: bug
slug: "identities-never-reached-classify-commits"
status: done
difficulty: medium
created_at: "2026-09-04T08:43:02+09:00"
session_id: "20260904-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/flow.ts"
    op: update
  - path: "apps/desktop/src/flow.test.tsx"
    op: update
  - path: "packages/concepts/src/identities.ts"
    op: create
  - path: "packages/concepts/src/identities.test.ts"
    op: create
  - path: "packages/concepts/src/batch.ts"
    op: create
  - path: "packages/concepts/src/ingest.ts"
    op: update
  - path: "packages/concepts/src/blame.ts"
    op: update
  - path: "packages/concepts/src/index.ts"
    op: update
  - path: "apps/desktop/src/screens/settings/IdentityPanel.tsx"
    op: create
  - path: "apps/desktop/src/screens/settings/IdentityPanel.test.tsx"
    op: create
  - path: "apps/desktop/src/screens/settings/SettingsScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.css"
    op: update
  - path: "packages/i18n/src/ko.ts"
    op: update
  - path: "packages/i18n/src/en.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/05-frontend.md"
    op: update
related:
  - ref: "20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md"
    kind: "followup"
tags:
  - "identity"
  - "ingest"
  - "settings"
  - "t2"
  - "d121"
  - "mcp-tool"
---
[x] 모든 커밋이 「내 것 아님」이었다 — flow.ts 가 identities 를 빈 배열로 못 박고 있었다

## 발생 원인

`apps/desktop/src/flow.ts` 가 `runIngest` 에 **`identities: []` 를 상수로** 넘겼다.
`classifyCommits` 는 그 값을 `isMine()` 에 그대로 주는데 `isMine` 은 목록이 비면 즉시
거짓이라, `git_commit.author_matched` 가 **모든 행에서 0** 이었다.

값이 큰 이유는 그 열을 읽는 쪽이다 — `isAnswerKey(kind, mine)` 가 「내 것 + normal」을
요구하므로 **T2 정답지가 한 장도 서지 않는다**(04 §8.1). 화면에는 오류가 아니라
「구조 문제를 만들 커밋이 없습니다」로 보인다.

빠진 것은 줄 하나였다. `Settings.identities` 타입 · `isMine()` · `SETTINGS_KEYS.identities` ·
`suggestIdentities()` 는 전부 있었고 서로 이어지지 않았다.

## 해결 방법

**배선** — `ingest()` 가 `loadSettings()` 로 목록을 읽어 넘긴다. 읽기에 실패하면 빈 목록으로
물러서되 `log.warn` 을 남긴다. 조용히 물러서면 같은 증상이 원인 없이 재현된다.

**재분류를 인제스트 밖으로** — `packages/concepts/src/identities.ts` 를 새로 만들고
`ingest.ts` 의 사설 `classifyCommits` 를 `reclassifyCommits(repoId, identities)` 로 옮겨
내보냈다. 설정에서 목록을 고치면 이것만 다시 돈다 — 바뀌는 것은 `git_commit` 두 열뿐인데
재인제스트는 수천 파일을 다시 파싱한다. 돌려주는 값은 `{ mine, all }` 이라 화면이
「몇 건 중 몇 건이 내 것이 되었나」를 그 자리에서 말한다.

`ingest.ts` 와 `identities.ts` 가 서로를 import 하는 고리를 피하려고 `inBatches` 를
`batch.ts` 로 뺐다(`blame.ts` 의 import 도 그리로). `ingest.ts` 는 531 → 496줄.

**화면** — 설정 「학습」 절에 `IdentityPanel`. 목록·손입력·제안 고르기·지우기이고 IPC 는
모른다(부모가 저장과 재분류를 한다). identity 가 **비어 있을 때만** 화면을 열며 제안을
한 번 자동으로 부른다 — 이미 정해 둔 사람이 있으면 커밋 전부를 읽는 쿼리를 돌리지 않는다.
새 문구 13개는 전부 `t()` 를 거치고 `ko` 카탈로그에 먼저 썼다(D117).

**제안은 커밋 author 에서만** — 05 §2.1 은 `git config` 도 읽으라고 적었지만 그러려면 Rust
명령이 하나 더 필요하고 줄 예산이 2,300/2,300 이다(D68). 문서를 D121 로 고쳤다.

## 밟은 것

`isMine` 의 GitHub noreply 경로는 로그인 이름을 **정규화 없이** 완전 일치로 본다 —
`99+kimhyunbin@…` 는 이름 `Kim Hyunbin` 과 안 걸린다(공백을 지우는 `normalizeName` 은
이름 경로에만 쓰인다). 03 §1.2 가 「완전 일치만」을 요구하는 자리라 **넓히지 않고**
그 경계를 픽스처의 `b2` 커밋으로 박아 두었다.

요청 범위 밖이라 **고치지 않은 것**: `flow.ts` 의 `dependencies: []` 도 같은 모양으로 비어
있다(D59 프레임워크 사전 게이트). 별도 항목이 필요하다.

## 검증

- `apps/desktop/src/flow.test.tsx` — `addRepo` 한 바퀴를 **진짜 `runIngest`** 로 돌린다.
  `settings.identities` 를 심으면 author 가 맞는 커밋만 `author_matched = 1` 이 되고,
  안 심으면 0건이다. **배선을 `identities: []` 로 되돌리면 이 테스트가 빨개지는 것을
  확인했다** — 가드가 실제로 그 줄을 지킨다.
- `packages/concepts/src/identities.test.ts` 6건 — 원장까지의 왕복. 빈 목록 0/5 ·
  하나 넣으면 3/5(메일 대소문자 · noreply 로그인 포함) · 다시 비우면 0/5 · `kind` 도 같이
  다시 매김 · 제안 빈도순 · 커밋 0개면 빈 목록.
- `apps/desktop/src/screens/settings/IdentityPanel.test.tsx` 9건 — 손입력 · 잘못된 메일
  거부 · 중복 거부(대소문자 무시) · 지우기 · 제안 걸러 보이기 · en 문구.
- 게이트 전부: `pnpm lint` 통과 · `typecheck` 오류 0 · `test:unit` **1602 passed (153
  files)** · `test:gates` **86 passed · 8 skipped** · `test:e2e-ui` **20 passed · 12
  skipped** · `check:rust` **2300/2300**(Rust 0줄) · `check:contrast` 48쌍 ·
  `check:motion` 0건 · `design:check` 바이트 일치 · `catalog:build` statement 147(변화 없음).