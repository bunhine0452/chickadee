---
schema_version: 1
type: feature
slug: "method-paths-schema-dead-branches"
status: done
difficulty: high
created_at: "2026-09-05T10:36:13+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/java/_imports.scm"
    op: update
  - path: "dictionary/ts/_imports.scm"
    op: update
  - path: "dictionary/py/_imports.scm"
    op: update
  - path: "dictionary/mybatis/_imports.scm"
    op: update
  - path: "dictionary/sql/_imports.scm"
    op: update
  - path: "packages/concepts/src/calls.ts"
    op: create
  - path: "packages/concepts/src/calls.test.ts"
    op: create
  - path: "packages/concepts/src/schema.ts"
    op: create
  - path: "packages/concepts/src/schema.test.ts"
    op: create
  - path: "packages/concepts/src/dead.ts"
    op: create
  - path: "packages/concepts/src/dead.test.ts"
    op: create
  - path: "packages/concepts/src/path.ts"
    op: update
  - path: "packages/concepts/src/path.test.ts"
    op: update
  - path: "packages/concepts/src/units.ts"
    op: update
  - path: "packages/concepts/src/units.test.ts"
    op: update
  - path: "packages/concepts/src/derive.ts"
    op: update
  - path: "packages/concepts/src/resolve-imports.ts"
    op: update
  - path: "packages/concepts/src/resolve-imports.test.ts"
    op: update
  - path: "packages/concepts/src/ingest.ts"
    op: update
  - path: "packages/concepts/src/ingest.test.ts"
    op: update
  - path: "packages/store-sql/migrations/0009_paths_schema_dead.sql"
    op: create
  - path: "packages/store-sql/statements/path.sql"
    op: create
  - path: "packages/store-sql/statements/schema.sql"
    op: create
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "fixtures/db/v0009.db"
    op: create
  - path: "fixtures/golden/ts/_imports/neg-path-shaped-string.ts"
    op: update
  - path: "crates/parse/src/sfc.rs"
    op: update
  - path: "crates/parse/src/lib.rs"
    op: update
  - path: "crates/parse/tests/snapshots/insta__ts-import.snap"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/curriculum/feature-paths.md"
    op: update
related:
  - ref: "20260905/Features_to_add/0858_feature_request-paths-for-tracing.md"
    kind: "followup"
tags:
  - "D168"
  - "D169"
  - "호출-그래프"
  - "스키마"
  - "죽은-갈래"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 요청 줄기를 메서드 단위로 · DB 스키마 · 죽은 갈래 (D168 · D169)

## 추가 기능

앞 판(`0858_feature_request-paths-for-tracing`)이 적어 둔 한계 — 「첫 칸만 요청별이고 꼬리는 기능별, 줄 번호는 import 줄」 — 을 풀었다. 그리고 사용자 물음 「이 데이터베이스의 스키마는 어떻게 설계되어 있는가」의 재료를 처음 세웠다.

**① 캡처를 한 층 더 내렸다 — Rust 0줄(파서 크레이트 8줄은 별도, 아래).** `_imports.scm` 에 `form` 을 더했다: 자바 `field`/`local`(이름 → 타입, `@ctx.type`) · `call`(`@ctx.recv` + 이름) · `call-self` · `entry-scheduled` · `http-any`(`.uri("…")`) · `extends`/`implements` 를 `same-package` 로; JS/py `call`·`call-self`; 파이썬 `route-*`(`@app.post`); MyBatis `column-of`(`<resultMap>` 의 `column` ↔ `property` ↔ `type`); SQL `ddl-table`·`ddl-column`(`@ctx.table`·`type`·`notnull`·`default`)·`ddl-fk`·`reads-table`. `RawImport` 가 `ctx` 를 싣는다 — `derive.ts` 의 `group()` 이 이미 `ctx.*` 를 모으고 있었고 `_imports` 만 버리고 있었다. `RawBlock` 은 `form` 을 싣는다.

**② `calls.ts` — 블록 단위 호출 그래프.** 자바는 수신자의 타입 → 파일 이름(`AuthService.java`), JS/py 는 import 한 파일의 같은 이름 블록, 둘이면 수신자 ↔ 파일 이름으로 가르고 그래도 둘이면 잇지 않는다. DAO 메서드 → 매퍼 `id` 는 이름 일치. 블록 밖의 호출은 **모듈 블록**(`(module)`)이 부른다 — Vue 의 `<script setup>` 이 그것이다.

**③ `methodPaths` / `trunk`** — HTTP 호출 자리에서 위로(다른 파일의 호출자가 하나일 때만) 오르고 라우트 메서드에서 아래로 소스 순서 깊이 우선. 등뼈는 맨 위에서 첫 매퍼 문까지.

**④ 진입점** — `@Scheduled` 파일이 기능이 된다(`coin`). **다른 진입점에서 닿는 후보는 진입점이 아니다** — FastAPI 를 부르는 `FortuneService.java` 가 자기 대지를 세우지 않는다. 이름은 층 접미(`Service`·`Scheduler`…)를 벗기고 소문자로.

**⑤ `schema.ts`** — 표·열·외래키·열↔필드. 같은 표가 덤프 사본에도 있으면 `example`·`dataset`·`test` 를 안 낀 짧은 경로가 정본. 열이 한 표에만 있거나 매퍼가 표 하나만 읽을 때 표를 붙인다.

**⑥ `dead.ts`** — 라우트 없는 호출 · 부르는 곳 없는 라우트 · 호출 0 인 함수(후보) · 고아 파일. 지우지 않고 표시만.

**⑦ 저장** — 마이그레이션 0009: `request_path`·`request_hop`·`db_table`·`db_column`·`db_fk`·`db_binding`·`dead_branch`. statement `path.*`(`ranges_by_unit` 가 챕터의 「이 파일의 이 줄들만」) · `schema.*`. `unit_file` 은 안 건드렸다 — 바이트 범위는 줄기의 칸(`request_hop.line_start~line_end`)이다.

**⑧ 해석기** — 파이썬은 스크립트 디렉터리도 루트(`AI_API/main.py` 의 `from services.x`) · 동사 미상 `ANY` · 접미 후보가 둘이면 접두가 포개질 때만 짧은 쪽(`/api` vs `/api/v1`) · `httpMisses`·`routeDecls`.

**⑨ Rust 8줄** — `sfc.rs` 가 `<script>` 본문을 첫 `</` 가 아니라 `</script` 에서 끊는다(`'<svg><path></path>'` 문자열에서 끊겨 `LandingView.vue` 의 로그인 핸들러 467~515 가 아예 안 읽혔다). `scan_ranges` 가 구간마다 매치 번호를 이어 센다(매퍼 40문이 전부 m1 이던 것). 예산 2,524/2,800.

## 동작 흐름

`deriveRepo` → 파일마다 `deriveFile`(imports 에 ctx · blocks 에 form) → `writeEdges` → `writeUnits`(seeds = `entry-scheduled` 파일) → `buildCallGraph` → `writeRequestPaths`(줄기의 대지 = 진입 파일의 기능, 없으면 그 파일을 품은 가장 작은 기능) → `writeSchema` → `writeDead`. 셋 다 리포 단위로 지우고 다시 쓴다.

## 실측 — `MonggleMonggle` (캡처 덤프 → 순수 파이프라인)

- 파일 187 · 간선 342(HTTP 39) · 블록 802 · 호출 그래프 간선 630(호출 549 · HTTP 39 · 매퍼 42) · 진입점 44 · 줄기 39
- **로그인 등뼈 7칸**: `LandingView.vue#handleSubmit → authStore.js#login → authService.js#login → AuthController.java#login → AuthService.java#login → UserDao.java#findByLoginId → UserMapper.xml#findByLoginId`. 회원가입은 첫 칸부터 `#signup` 으로 갈린다. 줄기 안에 `resetDailyCoinIfNeeded → resetDailyCoin → 매퍼` · `findById → 매퍼` · `JwtUtil#generateToken` 이 실행 순서대로 들여쓰여 있다 — `docs/program/chapter-login.md` 2-1 의 21지점 중 코드에 있는 것이 전부 나온다(`api.js` 인터셉터·`vite.config` 프록시·필터는 코드 간선이 아니라 빠진다)
- 기능 9(`coin` 신설 · fortune 18 → 31 파이썬 서비스 포함) · FastAPI 줄기 `FortuneController → FortuneService → main.py#get_comprehensive_fortune → comprehensive_service.py#…`
- 스키마 표 9 · 외래키 10 · 열↔필드 74(표까지 66, 엔티티 파일 74) · 정본 `BACK/dream_DB.sql` 하나
- 죽은 갈래: 라우트 없는 호출 2(`GET /emotions/stats` · `PUT /notices/comments/${id}`) · 부르는 곳 없는 라우트 4 · 호출 0 함수 31 · 고아 1. `useUserStorage.js` 9함수 중 6 미호출

## 검증

`pnpm vitest run packages/concepts packages/store-sql packages/dictionary` 전량 통과(concepts 334 · 새 시험 calls 10 · path 4 · units 3 · schema 5 · dead 4 · resolve 5 · ingest 4) · `typecheck`(concepts) 0 · `lint` 0 · `dict:lint` 15/15 · `cargo test -p chickadee-parse` 골든·insta 재생성(ts `_imports` 에 `call` 행이 늘어난 것뿐) · 예산 2,524/2,800 · `v0009.db` integrity ok.

## 메모

- 남의 범위의 빨강(내 것 아님): `crates/parse/tests/dictionary.rs` 가 `java/annotation` 의 `@` 를 잡음 · `golden.rs` 의 `fixtures/golden/java/_traps/broken-parse.java`(A3) · `packages/cards/src/t0-proto.test.ts` typecheck 2건(A1/A4).
- 한계: 값으로 넘긴 함수·템플릿 핸들러는 호출로 안 보인다 → `uncalled-export` 는 후보. 자바 오버로드는 첫 정의. 증분 인제스트에서는 바뀐 파일의 캡처만 있어 그래프가 부분이다(기존 `writeEdges` 도 같다).
- 한 파일에 문법이 여럿이면 문법 간 매치 번호가 겹친다 — `group()` 키에 패턴 번호를 넣어 막았고, 구간 겹침은 Rust 가 이어 센다.
- `units.test.ts` 의 `edge()` 헬퍼에 `line: 1` 을 넣어 HEAD 의 typecheck 40건을 초록으로(코디네이터 요청).