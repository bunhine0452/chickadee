---
schema_version: 1
type: feature
slug: "four-parallel-tracks-merged"
status: done
difficulty: high
created_at: "2026-09-04T10:06:51+09:00"
session_id: "20260904-004"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/i18n/src/ko"
    op: create
  - path: "packages/i18n/src/en"
    op: create
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/handoff/v02.md"
    op: update
  - path: "apps/desktop/src/boot.ts"
    op: update
  - path: "apps/desktop/src/App.tsx"
    op: update
  - path: "apps/desktop/src/data/clone.ts"
    op: update
  - path: "packages/store-sql/statements/queue.sql"
    op: update
  - path: "fixtures/db/v0003.db"
    op: update
  - path: "eslint.config.js"
    op: update
related:
  - ref: "20260904/Chores/0828_chore_commit-i18n-and-refresh-handoff.md"
    kind: "followup"
tags:
  - "parallel"
  - "i18n"
  - "repo"
  - "clone"
  - "merge"
  - "mcp-tool"
---
[x] 0.2 네 갈래를 격리 워크트리에서 동시에 돌려 병합 — 서가·설정 완료, 코스·사전은 절반

## 추가 기능

네 플랜의 남은 부분을 네 갈래로 나눠 격리 워크트리에서 동시에 돌리고 순서대로 병합했다.

| 갈래 | 결과 | 커밋 |
|---|---|---|
| 사전 이중 언어 | zod 를 문자열마다 `{ ko, en }` 유니온(스칼라 = ko)으로, `0002 concept.name_en`, loader 폴백, `_glossary.en.yaml` 초안 55행 | `9d615e2` |
| 리포 서가 | 서가 화면 + 마스트헤드 스위처 + `repo.overview` 한 방 쿼리 | `c175ab3` |
| 클론 코스 | `0003 clone_run·clone_step`, 커밋 순/위상 폴백 순서 산출, 판 생성, 채점 | `b288717` |
| 문구 전수(굳은 영역) | 443키를 `t()` 로 — session 278 · cards 93 · grading 30 · ui 42 | `43fff42` |

상위가 한 것: Wave 0(카탈로그 영역 분리 · D119·D120 · §5 M7), 병합과 충돌 해소, `settings.lastRepoId`(마지막 리포 복귀), 설정 → 서가 문, D123·D124, 설정 왕복 테스트 둘.

플랜: `chickadee-settings-gaps` 15/15 · `chickadee-repo-shelf` 22/22 · `chickadee-clone-course` 17/29 · `chickadee-i18n` 40/49.

## 동작 흐름 — 병렬이 실제로 물린 자리

- **워크트리가 상위의 최신 커밋에서 갈라진다는 보장이 없다.** 넷 중 둘이 Wave 0 이전에서 갈라졌다. 한 갈래는 카탈로그 영역 분리를 못 보고 같은 문제를 `catalog.ts` 조립기로 다시 풀었고(문구만 살리고 배선은 상위 설계로 통일), 다른 갈래는 `docs/00-overview.md` 에서 자기 결정 행을 찾지 못해 메시지로 문안을 넘겨야 했다.
- **워크스페이스 의존이 늘면 병합 직후 `pnpm install` 이 필요하다.** 한 갈래가 `packages/{ui,cards,grading}` 에 `@chickadee/i18n` 을 더했고, 병합한 트리에서 81개 테스트 파일이 한꺼번에 깨졌다. 심링크가 없어서였고 install 한 번으로 초록으로 돌아왔다.
- **모듈 상수로 얼린 문장은 `setLocale()` 보다 먼저 굳는다.** 한 갈래가 `GENERIC_WHY_Q` 를 `genericWhyQ()` 로 바꿨고 다른 갈래는 옛 이름을 계속 import 했다. 병합은 깨끗했고 `tsc` 만 그것을 잡았다.
- **마이그레이션 시드는 「바로 앞 판 + 새 마이그레이션」이다.** `0002` 를 못 본 갈래가 `v0003.db` 를 `v0001 + 0003` 으로 구워 `name_en` 열이 없었다. `v0002 + 0003` 으로 다시 구웠다.
- **병합이 열려 있을 때 커밋하면 그 병합이 닫힌다** — 서가 병합이 lint 제목을 단 채 들어갔다. 푸시 전이라 `filter-branch --msg-filter` 로 **메시지만** 다시 썼다(트리 diff 0). 병합을 다시 수행하지 않아 손으로 푼 충돌도 그대로다.
- **`eslint .` 가 `.claude/worktrees/` 사본까지 훑는다.** 경로 기반 무시가 안 먹어 오류 100건이 났다. 무시 목록에 넣었다.

## 검증

`pnpm lint` 0 · `pnpm typecheck` 12/12 Done · `pnpm test:unit` **1715 통과(163 파일)** · `pnpm test:gates` **100 통과 · 8 건너뜀** · `pnpm test:e2e-ui` 20 통과 · 12 건너뜀 · `check:rust` **2300/2300(Rust 0줄 증가)** · `check:contrast` 48쌍 · `check:motion` 0 · `design:check` 바이트 일치 · `dict:lint` 11.

게이트를 처음 돌렸을 때 실패 3건이 났는데 한 시간 전 `dist` 를 재고 있었고, 다시 빌드해 돌리니 100 통과다. **브라우저 게이트는 `pnpm build` 없이 재면 옛 번들을 잰다** — `test:gates` 는 빌드를 하지 않는다.