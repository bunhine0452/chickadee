---
schema_version: 1
type: feature
slug: "m0-row-converters-zod-tx-helper"
status: done
difficulty: high
created_at: "2026-09-02T22:37:58+09:00"
session_id: "20260902-004"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/store-sql/src/types.ts"
    op: create
  - path: "packages/store-sql/src/schemas.ts"
    op: create
  - path: "packages/store-sql/src/rows.ts"
    op: create
  - path: "packages/store-sql/src/tx.ts"
    op: create
  - path: "packages/store-sql/src/errors.ts"
    op: create
  - path: "packages/store-sql/src/rows.test.ts"
    op: create
  - path: "packages/store-sql/src/tx.test.ts"
    op: create
  - path: "packages/store-sql/statements/repo.sql"
    op: update
  - path: "packages/store-sql/statements/settings.sql"
    op: update
  - path: "packages/store-sql/migrations/0001_init.sql"
    op: update
related: []
tags:
  - "m0"
  - "store-sql"
  - "zod"
  - "schema"
  - "round-trip"
  - "mcp-tool"
---
[x] M0 · fromRow 계층·zod 스키마·트랜잭션 헬퍼 — DDL 과 02 §8.2 를 왕복 테스트로 맞물렸다

## 추가 기능

- `types.ts` — 02 §8.2 를 그대로 옮겼다. `Capture`·`AstLite` 는 `@chickadee/ipc-client` 에서 가져온다.
- `schemas.ts` — zod 15벌. `*_json` 이 스키마와 다르면 **행을 버리지 않고 오류를 올린다**(§8.1 무음 손상 금지). 오류 메시지에는 열 내용이 절대 안 들어가고 zod 이슈 **경로만** 들어간다(01 §6).
- `rows.ts` — 테이블당 `fromXxxRow()` 19개 + 쓰기용 `toXxxParams()` 8개.
- `tx.ts` — `store_batch` 위의 빌더. 200개 상한을 **보내기 전에** 막는다(넘긴 뒤 Rust 가 되던지면 「어떻게 나눌지」 아는 문맥이 이미 사라진다). 「판 완료」는 M2 의 statement 를 기다리므로 **모양만** 두고 이름을 지어내지 않았다.

## 동작 흐름

**DDL 과 02 §8.2 가 어긋난 자리를 전부 찾았고, 둘이 정면으로 충돌하는 하나를 고쳤다.**

- `concept_site.picks_json` 의 DEFAULT 가 `'[]'`(배열)인데 타입은 `picks: Record<number, string>`(객체)다. DDL 을 `'{}'` 로 고쳤다(→ D58).
- statement 별칭이 §8.1 과 싸운다. §8.1 은 「행이 **열 이름** 키로 오고 테이블마다 `fromRow()` 하나」인데 `repo.list`·`settings.get_all` 이 camelCase 별칭을 붙이고 있었다 — 별칭을 걷어냈다(→ D57).
- 나머지는 기록만 했다: §8.2 에 타입이 없는 테이블 12개(쓰기 입력 타입만 `rows.ts` 에 DDL 유래로 표시해 두고 `types.ts` 는 §8.2 순수 전사로 남겼다), §8.2 가 쓰지만 정의 안 한 `PlannedItem`·`DictLayer`, `card.kind` 가 `CardPayload` 보다 넓은 것(T3 자리), CHECK 이 없어 DB 는 받지만 TS 타입이 막는 열 7개.

`settings` 는 행↔객체 1:1 이 아니다(KV 테이블 ↔ 평평한 12필드 객체). `fromSettingsRows` 는 여러 행 → `Partial<Settings>` 다. **`Partial` 인 것이 의도다** — `tz` 는 정적 기본값이 없고(§5.6 첫 실행 때 OS 값) 이 층이 기본값을 지어내면 안 된다.

## 검증

- `npx vitest run packages/store-sql` → 44 passed. 왕복 테스트는 **진짜 SQLite**(better-sqlite3 인메모리)에 `0001_init.sql` 을 적용하고 **실제 카탈로그 statement** 로 넣은 뒤 되읽어 원본과 deep equal 을 본다 — `PRAGMA foreign_keys = ON`, 부모 사슬 전부, `review_log ↔ session_item` 순환도 실제 「판 완료」 순서로 푼다.
- 변환기가 읽는 열이 DDL 열을 빠짐없이 덮는지 기계로 확인했다(19개 테이블).
- 오염된 `*_json` 에 표식(`PRIVATE_CODE_…`)을 심어 메시지·이슈 경로 어디에도 안 나오는 것을 단언한다.
- 뮤테이션 점검: 열 하나를 camelCase 로 읽게 바꾸면 3개 테스트가 정확한 `ColumnTypeError` 로 깨진다.
- 별칭 제거·기본값 변경 뒤 `sqlite3` 재실행(31테이블, FK 위반 0) · `pnpm typecheck` · 전체 210 테스트 재통과.