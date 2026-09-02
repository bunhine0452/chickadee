---
schema_version: 1
type: feature
slug: "m0-store-sql-catalog-ipc-client"
status: done
difficulty: high
created_at: "2026-09-02T22:22:13+09:00"
session_id: "20260902-004"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/store-sql/migrations/0001_init.sql"
    op: create
  - path: "packages/store-sql/statements/facts.sql"
    op: create
  - path: "packages/store-sql/statements/repo.sql"
    op: create
  - path: "packages/store-sql/statements/settings.sql"
    op: create
  - path: "packages/store-sql/statements/store.sql"
    op: create
  - path: "packages/store-sql/src/index.ts"
    op: create
  - path: "packages/store-sql/src/catalog.test.ts"
    op: create
  - path: "scripts/build-catalog.ts"
    op: create
  - path: "packages/ipc-client/src/types.ts"
    op: create
  - path: "packages/ipc-client/src/errors.ts"
    op: create
  - path: "packages/ipc-client/src/statements.ts"
    op: create
  - path: "packages/ipc-client/src/events.ts"
    op: create
  - path: "packages/ipc-client/src/devpanel.ts"
    op: create
  - path: "packages/ipc-client/src/index.ts"
    op: create
  - path: "packages/grading/src/t3-adapter.ts"
    op: create
related: []
tags:
  - "m0"
  - "store-sql"
  - "ipc-client"
  - "ddl"
  - "typescript"
  - "mcp-tool"
---
[x] M0 · store-sql 카탈로그와 ipc-client — Rust↔TS 경계를 타입으로 잠갔다

## 추가 기능

- `packages/store-sql/migrations/0001_init.sql` — 02 §2.2 DDL 을 **문서에서 그대로 추출**했다(손으로 옮기면 조용히 어긋난다). 31 테이블 · 20 인덱스 · `user_version = 1`.
- `statements/*.sql` — 명명 statement 15개. Rust 가 기동 시 요구하는 12개(01 §3.3 `facts.*`·`repo.*`)를 전부 포함한다.
- `scripts/build-catalog.ts` — statement 머리 주석에서 `src/catalog.ts` 를 생성. 이름 중복·마이그레이션 번호 연속·**Rust 필수 이름 존재**를 빌드 때 검사해 실패시킨다.
- `packages/ipc-client` — 01 §3.1 공통 타입 전량, `IpcError`(코드 30종), 이벤트 리스너, `STORE_BUSY` 자동 재시도(3회·50ms 백오프), `?dev=1` 왕복 타이머(명령별 p95).
- `packages/grading/src/t3-adapter.ts` — `RunnerAdapter` 인터페이스와 빈 `runners`. Rust `t3_run` 은 언제나 `NOT_IMPLEMENTED`.

## 동작 흐름

**`StatementMap` 순환을 선언 병합으로 풀었다(D49).** 01 §2 의 의존 방향은 `store-sql → ipc-client` 인데 §3.5 코드는 ipc-client 가 store-sql 을 import 한다 — 순환이다. `ipc-client` 가 **빈** `interface StatementMap` 을 선언하고 생성된 `catalog.ts` 가 `declare module` 로 채운다. 병합은 대상 모듈이 프로그램 안에 있어야 성립하므로 생성 파일 머리에 `import type {} from '@chickadee/ipc-client'` 를 넣는다(런타임엔 지워진다).

`invoke` 의 `InvokeArgs` 는 `Record<string, unknown>` 이라 interface 가 그대로 안 붙는다(인터페이스엔 암묵 인덱스 시그니처가 없다). §3.1 이 정한 타입들을 `type` 으로 바꾸는 대신 `call()` 안에서 한 번만 좁혔다 — 경계 캐스트 하나가 doc 타입 15개를 흔드는 것보다 낫다.

`boot.ts` 가 처음에 `@tauri-apps/api/window` 를 직접 import 했다가 rollup 이 못 풀었다. 그게 곧 01 §2 위반이었다 — 창 표시를 `ipc.win.show()` 로 옮겼다. `@tauri-apps/api` 를 import 하는 파일은 여전히 `packages/ipc-client` 뿐이다.

## 검증

- `sqlite3` 로 `0001_init.sql` 직접 실행 → 테이블 31 · 인덱스 20 · `user_version=1` · `foreign_key_check` 위반 0.
- `npx tsx scripts/build-catalog.ts` → statement 15개 · 마이그레이션 1개.
- `npx vitest run packages/store-sql packages/grading` → 7 passed(Rust 필수 이름 전량 존재 · 번호 연속 · 이름 규약 · `catalog()` 방어 복사 · `track` 열거형에 `t3` 예약).
- `pnpm typecheck` → 7개 프로젝트 전부 통과.