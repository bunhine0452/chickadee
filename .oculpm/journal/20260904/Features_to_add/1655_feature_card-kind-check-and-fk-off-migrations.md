---
schema_version: 1
type: feature
slug: "card-kind-check-and-fk-off-migrations"
status: done
difficulty: superhigh
created_at: "2026-09-04T16:55:26+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/store/src/migrate.rs"
    op: update
  - path: "crates/store/src/lib.rs"
    op: update
  - path: "crates/store/tests/store.rs"
    op: update
  - path: "packages/store-sql/migrations/0005_card_kind_entry_role.sql"
    op: create
  - path: "packages/store-sql/src/migrate-seed.test.ts"
    op: update
  - path: "packages/store-sql/src/types.ts"
    op: update
  - path: "packages/store-sql/src/schemas.ts"
    op: update
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "packages/cards/src/t2-types.ts"
    op: update
  - path: "fixtures/db/v0005.db"
    op: create
  - path: "docs/00-overview.md"
    op: update
related: []
tags:
  - "v04"
  - "d146"
  - "migration"
  - "mcp-tool"
---
[x] 이행 러너가 외래키를 끄고 돈다 — 그게 없어서 새 문제 두 종이 원장에 못 들어갔다

## 발생 원인

리포 지도 세션이 새 문제 두 종(`entry`·`role`, D142)을 만들어 놨는데 **원장에 저장되지 않았다.** `card.kind` 의 CHECK 가 여섯 값만 허용한다. 생성기는 카드를 만들고 저장이 거부되는 상태였다.

SQLite 는 CHECK 를 ALTER 하지 못한다. 표를 다시 만들어야 하는데, **`DROP TABLE` 을 「모든 행을 지운다」로 다루기 때문에** 외래키를 켜 둔 채 `card` 를 재생성하면 그것을 참조하는 아홉 표의 행이 `ON DELETE CASCADE` 로 함께 사라진다. 그리고 `PRAGMA foreign_keys` 는 **트랜잭션 안에서 무시되는데** 러너가 이행마다 트랜잭션을 연다 — 이행 파일이 스스로 끌 수가 없다.

## 권고받은 두 길을 먼저 재 보고 버렸다

인계 보고서가 `PRAGMA writable_schema` 를 권했고 대안으로 표 재생성을 적었다. 둘 다 better-sqlite3 위에서 직접 재 봤다.

- **`writable_schema`** — `UPDATE sqlite_schema` 가 「table sqlite_master may not be modified」로 막힌다. CHECK 는 그대로 남았다.
- **`legacy_alter_table` + 이름 바꾸기** — 자식 표의 REFERENCES 가 `"card_old"` 로 다시 쓰이고, **자식 행 1 → 0.** 그대로 냈으면 원장이 날아갔다.

그냥 재생성(`defer_foreign_keys` 포함)도 자식 행 1 → 0 이었다. `defer_foreign_keys` 는 **검사**를 미룰 뿐 CASCADE **동작**을 막지 않는다.

## 해결 방법 (D146)

**러너가 루프 밖에서 외래키를 끈다.** `crates/store/src/migrate.rs` 의 `run()` 이 `PRAGMA foreign_keys = OFF` → 이행마다 트랜잭션(`apply()`) → `ON` → `foreign_key_check` 순으로 돌고, 위반이 있으면 `StoreError::Migration` 이다. 끄기만 하고 검사를 안 하면 조용히 깨지므로 검사가 짝이다.

**TS 하네스도 같은 순서로 고쳤다** — `migrate-seed.test.ts` 의 `runPending`. 러너의 대역이 러너와 다르게 돌면 그 시드 검사는 아무것도 안 지킨다.

그 위에서 마이그레이션 `0005` 가 `card` 를 재생성해 `entry`·`role` 을 CHECK 에 더한다. `store-sql` 의 타입·zod 도 넓혔고, 카드 생성기가 임시로 넓혀 두었던 타입(`t2-types.ts` 의 `Stored`/`Omit` 블록)은 한 줄로 되돌렸다.

Rust **+18줄** (2,331 → 2,349 / 2,800).

## 검증

- `crates/store/tests/store.rs` 에 **`rebuilding_a_parent_table_keeps_child_rows`** 를 새로 뒀다. 부모 표를 재생성하는 이행 뒤에 자식 행이 살아 있고, 넓힌 CHECK 는 실제로 넓어졌으며 밖의 값은 여전히 막히고, 끝나면 외래키가 다시 켜져 있는 것을 잰다. **러너를 되돌리면 자식 행 0 으로 실패한다.**
- `cargo test -p chickadee-store` 13개 통과.
- `fixtures/db/v0005.db` 를 v0004 에서 만들었다 — 시드 v0001~v0005 전부 `integrity_check ok` · `foreign_key_check` 0건 · **행 수 불변**.
- `pnpm test:unit` **1,938개 / 176 파일 통과**.
- 아직 안 한 것: 실제 앱에서 v0004 파일을 열어 이행이 도는 것을 보지 않았다. 러너의 백업(`back_up`)이 앞서 돌므로 되돌릴 길은 있다.