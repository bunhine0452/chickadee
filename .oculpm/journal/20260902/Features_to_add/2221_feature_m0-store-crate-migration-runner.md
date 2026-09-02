---
schema_version: 1
type: feature
slug: "m0-store-crate-migration-runner"
status: done
difficulty: high
created_at: "2026-09-02T22:21:46+09:00"
session_id: "20260902-004"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/store/src/lib.rs"
    op: create
  - path: "crates/store/src/migrate.rs"
    op: create
  - path: "crates/store/Cargo.toml"
    op: create
  - path: "crates/store/tests/store.rs"
    op: create
related: []
tags:
  - "m0"
  - "rust"
  - "sqlite"
  - "migration"
  - "store"
  - "mcp-tool"
---
[x] M0 · store 크레이트 + 마이그레이션 러너 — 이름으로만 도는 SQL, user_version 전진 전용

## 추가 기능

`chickadee-store` — rusqlite 를 감싸는 껍데기. 도메인을 모른다.

- 공개 API 5개: `Store::open/query/exec/batch/info` + `sqlite_version()`. 01 §1.1 의 「1 크레이트 = 1 래핑, 공개 함수 ≤ 8개」.
- 연결 모델은 01 §1 그대로 — writer `Mutex<Connection>` 1개 + reader 4개(각자 `Mutex`, `try_lock` 으로 빈 것부터). 모든 연결에 `journal_mode=WAL`·`foreign_keys=ON`·`synchronous=NORMAL`·`busy_timeout=5000`.
- **카탈로그 밖 SQL 은 실행 경로가 없다.** `query`/`exec` 는 이름으로만 찾고 없으면 `CatalogMissing`. 파라미터는 statement 가 실제로 선언한 이름에만 바인딩하고(`parameter_count`/`parameter_name`), 배열·객체는 JSON 텍스트로 넣어 `json_each(:ids)` 가 성립한다.
- 마이그레이션 러너(`migrate.rs`) — `PRAGMA user_version` 오름차순, 파일 하나가 한 트랜잭션, 적용 뒤 `user_version` 을 러너가 직접 세운다. **DB 의 `user_version` 이 앱이 아는 최대치보다 크면 열지 않는다**(구버전이 신버전 DB 를 열어 무음 손상되는 것을 막는다). 적용 전 `VACUUM INTO backups/chickadee-v{n}-{ts}.db`, 최근 3개 보관.

## 동작 흐름

`Display` 는 사용자 데이터를 담지 않는다(01 §6 로그 원칙) — 분류되지 않은 rusqlite 오류는 **코드만** 찍고 원문 메시지를 버린다.

`VACUUM INTO` 의 경로는 문자열 보간이 아니라 바인딩 파라미터로 넘긴다. UTC 스탬프는 chrono 없이 `SystemTime` + `civil_from_days` 로 만든다 — 의존성 하나를 안 늘리려고.

`StoreError::AlreadyOpen` 은 이 크레이트가 만들지 않는다. 프로세스당 1회 규칙은 앱 크레이트의 `store_open` 이 `slot.is_some()` 으로 본다 — 크레이트 안에 전역 플래그를 두면 두 번째 `Store` 를 못 열어 테스트가 불가능해진다. 변형은 앱의 `From` 매치가 exhaustive 하도록 남겨 둔다.

## 검증

- `cargo test -p chickadee-store` → 12 passed. 순차 적용·재개봉 무동작·상위 버전 거부·백업 3개 상한·행→JSON 타입·모르는 이름·batch 전량 롤백·`json_each` 배열 바인딩·PRAGMA 전파·camelCase 와이어 모양.
- `cargo clippy -p chickadee-store --all-targets -- -D warnings` 통과, `cargo fmt --check` 통과.
- `crates/store/src` = 343 코드 줄 (01 §4 의 크레이트 예산 350 이내). 워크스페이스 합계 558/1500.
- 실제 앱에서: `store_open` 이 `0001_init.sql` 을 적용해 `user_version=1` · 테이블 31 · 인덱스 20 · `journal_mode=wal` 인 DB 를 만들었다.