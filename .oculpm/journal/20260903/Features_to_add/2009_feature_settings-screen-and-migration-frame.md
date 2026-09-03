---
schema_version: 1
type: feature
slug: "settings-screen-and-migration-frame"
status: done
difficulty: high
created_at: "2026-09-03T20:09:05+09:00"
session_id: "20260903-008"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/screens/settings/SettingsScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.css"
    op: create
  - path: "apps/desktop/src/screens/settings/SettingsScreen.test.tsx"
    op: create
  - path: "apps/desktop/src/screens/settings/PerfTable.tsx"
    op: create
  - path: "apps/desktop/src/data/maintenance.ts"
    op: create
  - path: "apps/desktop/src/data/maintenance.test.ts"
    op: create
  - path: "apps/desktop/src/data/settings.ts"
    op: update
  - path: "apps/desktop/src/components/home/Masthead.tsx"
    op: update
  - path: "apps/desktop/src/components/home/Masthead.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/HomeScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/HomeScreen.test.tsx"
    op: update
  - path: "packages/store-sql/src/migrate-seed.test.ts"
    op: create
  - path: "fixtures/db/v0001.db"
    op: create
related: []
tags:
  - "m5"
  - "q12"
  - "settings"
  - "migration"
  - "export"
  - "privacy"
  - "mcp-tool"
---
[x] 설정 화면 + 마이그레이션 프레임 (Q12) — 내보내기·전부 지우기·시드 DB·재인제스트 판별

## 추가 기능

- **설정 화면**(`screens/settings/SettingsScreen.tsx` · `.css` · `PerfTable.tsx`) — 리포·학습·모양·LLM 키(`<KeyPanel />` 자리)·성능·데이터·프라이버시 노트·정보 여덟 절. 05 §2.1 의 목록이고 목업이 없어 홈의 패널 규칙(2.5px 괘선·`--paper-2`·`--measure`)을 그대로 썼다.
- **테마·부속 저장** (E7) — `data/settings.ts` 에 `applyTheme`/`applyTrim`/`useAppearance` 를 두고 `<html data-theme|data-trim>` 을 만지는 자리를 한 곳으로 모았다. 마스트헤드가 들고 있던 `useState` 를 걷어내고 `settings` 테이블에 저장·복원한다. `theme:switch` 계측은 사용자가 스위치를 눌렀을 때만 재고 마운트·부팅 복원은 재지 않는다(전환이 아니라 첫 조판이라).
- **내보내기·전부 지우기·재인제스트 판별** (`data/maintenance.ts`) — `chickadee-export-<YYYY-MM-DD>.json`(스키마 번호·개념 숙련도·세션 요약·설정; 카드 발췌·필사 초안은 체크박스 기본 제외), `app_write_json('exports', …)` 로 쓰고 그 폴더를 연다(D109 — 경로 고르기 없음). 전부 지우기는 인라인 확인 단계를 거쳐 `app_wipe` → `secret_delete('llm')` → `forgetKeyStore()` 순. `ingestFingerprint`(sha256, NUL 구분자)와 `needsReingest` 는 순수 함수다.
- **시드 DB 프레임** (`packages/store-sql/src/migrate-seed.test.ts` + `fixtures/db/v0001.db`, 66 KB) — 마이그레이션마다 시드 하나를 요구하고, 올린 뒤 `integrity_check`·`foreign_key_check`·행 수 보존을 본다. 지금은 올릴 것이 0개라 가짜 2번을 한 번 태워 러너 절차가 실제로 도는 것과 실패 시 롤백까지 확인한다.

## 동작 흐름

마스트헤드 「설정」 → `ui.screen='settings'` → 화면이 스스로 `repo.list`·`perf.list`·`settings.get_all`·`app_version`·`app_paths` 를 읽는다. 값 하나를 바꾸면 그 자리에서 `settings.set` 으로 내려간다(「저장」 버튼 없음). 숫자 칸은 친 글자를 따로 들고 있다 — 저장값만 붙들면 「20」을 치는 중간의 「2」가 범위 밖이라 거부되고 두 자리를 못 넣는다.

## 결정과 근거

- **`DEFAULTS.trim` 을 `'on'` → `'off'`** 로 고쳤다. 마스트헤드는 늘 `'off'`(부속 보임 = 목업이 확정한 모양)로 떴는데 `loadSettings()` 는 `'on'` 을 돌려줬다 — 저장·복원을 붙이는 순간 첫 실행의 모양이 바뀐다. 05 §4.3 의 플랫폼 갈래(Linux `on` · macOS·Windows `off`)는 여전히 없고, 그것은 D12 를 다시 열 일이다.
- **프라이버시 노트는 06 §3.6 의 0.1.0 문구**를 쓴다(D106 — 이 판에는 네트워크 호출이 없다). 「업데이트 확인」 토글은 두지 않았다(06 §5.5).
- **시드 DB 는 커밋되는 바이너리**다. 오늘의 `0001_init.sql` 로 다시 만들어 내면 그 DDL 이 바뀌어도 시드가 같이 바뀌어 어긋남을 영원히 못 본다.
- **`crates/store/src/migrate.rs` 는 고칠 것이 없었다** — `KEEP = 3` 이고 `prune()` 이 새것 3개만 남긴다. `backups_are_taken_and_capped_at_three` 가 이미 그것을 본다. Rust 는 한 줄도 늘리지 않았다(2,300/2,300).

## 남긴 구멍

`ingest_run.fingerprint` 를 **읽을 statement 도 쓸 코드도 없다**. `home.last_run` 이 그 열을 돌려주지 않고 Rust `jobs.rs` 는 `fingerprint` 를 `null` 로 넣는다. 그래서 홈 배너는 `reingest` prop 뒤에 있고 `App.tsx` 는 그것을 넘기지 않는다 — 판정 함수와 화면은 서 있고 값의 출처만 비었다. 카탈로그와 `packages/concepts` 는 상위 세션 소유라 손대지 않았다.

## 검증

`npx vitest run` 148파일 1,560건 전부 통과(내가 시작할 때 기준선은 139파일 1,426건 + `SettingsScreen` 미존재로 `flow.test.tsx` 1건 실패). `tsc --noEmit` 0(desktop·store-sql), `eslint` 0, `stylelint` 0, `check-contrast` 48쌍 통과, `check-motion` 위반 0, `cargo test -p chickadee-store` 12 통과, `check-rust-budget.sh` 2,300/2,300, `pnpm --filter @chickadee/desktop build` 성공.