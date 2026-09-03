# 02 · 데이터 모델과 스케줄링

## 이 문서의 위치

Chickadee 의 **로컬 SQLite 스키마 · 숙련도(잉크 겹 0~4) ↔ FSRS 매핑 · 오늘의 인쇄 큐 생성 · 미지 개념 우선순위**를 정한다. 정본 결정(`.oculpm/discussion/vibe-code-study-app/discussion.md` §2·§3·§4)과 목업(`design/src/ink/*.js`, `design/ink-home.html`)의 동작을 데이터와 알고리즘으로 옮긴 것이며, 이 문서만 보고 `db/`·`scheduler/`·`mastery/` 모듈을 구현할 수 있어야 한다.

경계: 파싱·문법 사전·개념 사용처 추출은 **03-ingest-parsing-dictionary.md**, 채점 규칙(T1 동등 판정·T2 3티어)은 **04-grading-engines.md**, 화면은 **05-frontend.md**, Tauri IPC·크레이트 구성은 **01-architecture.md**, 백업·테스트·릴리스는 **06-quality-security-release.md**. 이 문서는 그 문서들이 읽고 쓰는 **테이블과 규칙**만 정의한다.

## 읽는 순서 / 전제

1. §0 한눈에 → §1 ERD → §3 겹↔FSRS → §4 이벤트 표 (여기까지가 제품 규칙)
2. §2 DDL → §8 TS 타입 (구현 계약)
3. §5 큐 → §6 미지 개념 → §7 쿼리 (알고리즘)

전제: rusqlite `bundled`(SQLite ≥ 3.45, 윈도 함수·`RETURNING` 사용 가능) · TS 쪽 FSRS 는 `ts-fsrs`(MIT, FSRS-5 19 파라미터) · 시각은 전부 **UTC unix ms INTEGER**, 날짜 키는 **로컬 `YYYY-MM-DD` TEXT**. 얇은 Rust 는 SQL 실행자일 뿐이고 규칙은 전부 TS 에 있다.

---

## 0. 한눈에 — 핵심 결정

| # | 결정 | 왜 (운영에서 본 실패 모드) |
|---|---|---|
| 1 | **숙련도는 개념(concept) 단위, 리포를 넘어 전역.** 카드는 개념의 「보기」일 뿐이다 | 파일 단위 덱은 리팩터링 한 번에 수백 장이 고아가 되고, 같은 문법이 파일마다 카드가 되어 덱 폭발 → Anki 이탈의 1번 원인 |
| 2 | **`review_log` 가 원장, `mastery` 는 리듀서 캐시.** 겹·FSRS 상태는 로그 재생으로 언제든 재계산 | 캐시가 원장이면 버그 한 번에 숙련도가 영구 손상. 재생 가능하면 규칙을 바꿔도 이력이 산다 |
| 3 | **겹은 FSRS 의 함수가 아니라 이벤트 리듀서.** 「하루 한 번, 만기 근처에서만 +1」「모르겠어요 −1은 같은 날 회복만」. FSRS 는 *언제* 다시 보여줄지만 정한다 | 안정도(S) 구간으로 겹을 매기면 임계 근처에서 겹이 깜빡이고, 「모르겠어요 = 정확히 한 겹」을 보장할 수 없다 |
| 4 | **첫 정답은 FSRS `Hard`, 이후 정답은 `Good`, 오답·모르겠어요는 `Again`. `Easy` 없음** | 객관식 첫 정답은 인식이지 회상이 아니다. 기본 파라미터에서 Hard→Good→Good→Good 궤적이 1.2 → 3.8 → 11 → 30일로 「내일·3일·9일·3주」 라벨과 맞물린다. Easy 버튼은 간격 폭주의 주범 |
| 5 | **새 판 하루 2장(설정 상한 4) · 복습 세션당 20장 · 예산 15분(10~25)** | 새 카드 폭주 → 3주 뒤 복습 부채 → 이탈. 부채는 R 낮은 순으로 잘라서 보여주고 나머지는 말하지 않는다 |
| 6 | **하루 경계는 로컬 04:00, `day_key` 는 쓰는 순간 박제** | 자정 직후 세션이 어제 큐에 붙거나 시간대 이동 시 만기가 하루 튀는 버그 |

---

## 1. 엔티티 관계 (텍스트 ERD)

```
settings ──── (key/value)                       scheduler_params (FSRS w[19], 활성 1행)
perf_sample (독립 — 06 §8 계측, 최근 500행 순환)
dictionary_version 1─n concept 1─n concept_prereq (concept → prereq)
                          concept n─0..1 concept (universal_id : 언어고유 → 보편)

repo 1─n ingest_run
repo 1─n git_commit 1─n commit_file
repo 1─n file ─────────────── file n─1 git_commit (first_commit)
                  file 1─n capture              ← Rust 파싱 사실 (concept_site 의 원재료)
                  file 1─n block                ← T1 필사 단위 + AstLite 캐시
                  file 1─n import_edge(from) / import_edge n─1 file(to)
repo 1─n unit 1─n unit_node (unit × concept × track = 홈의 「노드 스티커」)
                  unit 1─n unit_file n─1 file
repo 1─n concept_site n─1 concept        ← 내 코드 사용처 (file·line·span·unknown_count)
                  concept_site n─1 file

card n─1 repo · n─1 unit · n─1 concept(primary)
card 1─n card_concept (secondary 개념)     card 1─1 card_state (T1 단계·인쇄 횟수·예상 분 EMA)
card n─0..1 concept_site (T0) · n─0..1 file (T1) · n─0..1 git_commit (T2 정답지)

concept 1─0..1 mastery                    ← 개념 단위 숙련도 + FSRS 상태 (리포 무관, 전역)
concept 1─0..1 lifer                      ← 개념당 평생 1회
(repo, concept) 1─0..1 gap                ← 판이 없는 문법

session 1─n session_item n─1 card         ← 시간 비례 큐 항목 (est_min)
session_item 0..1─1 review_log            ← 판 하나를 마치면 로그 1행
session_item n─0..1 session_item (parent : 아래층·다시 찍기의 부모)
review_log n─1 concept · n─1 card · n─1 scheduler_params
review_log 1─0..1 dunno_event 1─n ladder_event
review_log 1─n appeal
review_log 1─n why_answer                 ← T1 왜 게이트 답 (채점·겹 효과 없음)
```

읽는 법: `A 1─n B` = A 하나에 B 여럿. 원장(append-only)은 `session · session_item · review_log · dunno_event · ladder_event · appeal · lifer`. 파생(재계산 가능)은 `mastery · gap · concept_site.unknown_count · card_state.est_min_ema`. 인제스트 산출(재인제스트로 재생성)은 `file · git_commit · commit_file · capture · import_edge · block · unit · unit_node · unit_file · concept_site`.

---

## 2. SQLite DDL

### 2.1 마이그레이션 원칙

- `PRAGMA user_version` 이 스키마 번호. 앱 시작 시 Rust 가 `migrations/0001_init.sql …` 을 번호 순으로 각각 한 트랜잭션에 적용한다. **DB 의 `user_version` 이 앱이 아는 최대 번호보다 크면 실행을 거부**한다(왜: 구버전이 신버전 DB 를 열면 무음 손상).
- 적용 직전 `VACUUM INTO 'backups/chickadee-<user_version>-<ts>.db'` 로 백업(06 문서가 보관 정책을 정한다).
- **원장 테이블은 추가만**: `ALTER TABLE … ADD COLUMN … DEFAULT …` 만 허용, 행 재작성·삭제·이름 변경 금지. 열을 없애고 싶으면 그냥 두고 TS 에서 읽지 않는다.
- **파생 테이블은 DROP + 재생성 + 재계산 잡**이 허용된다. `mastery` 는 `rebuild_mastery()` 가 `review_log` 를 재생해 만들고, 테스트가 「재생 결과 == 현재 캐시」를 매 릴리스 검증한다.
- 인제스트 테이블은 재인제스트로 채운다. 단 `card` 는 원장이 참조하므로 지우지 않고 `retired_at` 으로 은퇴시키며, 사용처가 사라져도 카드가 `snapshot_json` 에 코드 줄을 품고 있어 이력이 렌더된다.
- 연결 시 항상: `PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=5000;`

### 2.2 DDL (`migrations/0001_init.sql`, user_version = 1)

```sql
PRAGMA user_version = 1;

-- ───────── 설정 · 스케줄러 파라미터 · 사전 ─────────
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,           -- 'budget_min' | 'tz' | 'rollover_hour' | 'desired_retention' | 'new_per_day' | 'newcomer_flag' | 'motion' | 'identities' | 'exclude_globs' …
  value_json  TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE scheduler_params (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at    INTEGER NOT NULL,
  algo          TEXT    NOT NULL DEFAULT 'fsrs5',
  params_json   TEXT    NOT NULL,          -- number[19]
  source        TEXT    NOT NULL CHECK (source IN ('default','optimized','manual')),
  review_count  INTEGER NOT NULL DEFAULT 0, -- 최적화에 쓴 로그 수
  log_loss      REAL,
  is_active     INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1))
);
CREATE UNIQUE INDEX ux_scheduler_active ON scheduler_params(is_active) WHERE is_active = 1;

CREATE TABLE dictionary_version (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  lang          TEXT    NOT NULL,          -- 'common' | 'ts' | 'py' | 'rs' | 'swift' | 'dart' | 'sql' | 'go' | 'react' | 'arch'
  version       TEXT    NOT NULL,          -- YAML frontmatter version
  sha256        TEXT    NOT NULL,
  concept_count INTEGER NOT NULL,
  loaded_at     INTEGER NOT NULL,
  UNIQUE (lang, version)
);

-- 사전 개념의 물질화 사본 — 설명문은 YAML 에 두고 여기엔 조인에 필요한 것만
CREATE TABLE concept (
  id               TEXT PRIMARY KEY,       -- 'ts/optional-chaining' · 'common/loop' (보편 접두어는 03 문서의 `common/` 을 따른다)
  lang             TEXT NOT NULL,          -- 'common' | 'ts' | 'py' | 'rs' | 'swift' | 'dart' | 'sql' | 'go' | 'react' | 'arch'
  name_ko          TEXT NOT NULL,
  token            TEXT,                   -- '?.' · 'map' · NULL(패턴/구조 개념)
  kind             TEXT NOT NULL CHECK (kind IN ('universal','lang')),
  universal_id     TEXT REFERENCES concept(id),   -- lang 개념 → 보편 개념 (전이용)
  track_default    TEXT NOT NULL CHECK (track_default IN ('t0','t1','t2','t3')),
  dict_version_id  INTEGER NOT NULL REFERENCES dictionary_version(id),
  is_retired       INTEGER NOT NULL DEFAULT 0 CHECK (is_retired IN (0,1))
);
CREATE INDEX ix_concept_universal ON concept(universal_id);

CREATE TABLE concept_prereq (
  concept_id  TEXT NOT NULL REFERENCES concept(id),
  prereq_id   TEXT NOT NULL REFERENCES concept(id),
  PRIMARY KEY (concept_id, prereq_id),
  CHECK (concept_id <> prereq_id)
);
CREATE INDEX ix_prereq_rev ON concept_prereq(prereq_id);

-- ───────── 리포 · 인제스트 ─────────
CREATE TABLE repo (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  root_path        TEXT    NOT NULL UNIQUE,
  name             TEXT    NOT NULL,
  default_branch   TEXT,
  head_sha         TEXT,
  primary_lang     TEXT,
  fingerprint      TEXT    NOT NULL DEFAULT '',
  detached_at      INTEGER,
  added_at         INTEGER NOT NULL,
  last_ingest_at   INTEGER
);

CREATE TABLE ingest_run (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id      INTEGER NOT NULL REFERENCES repo(id),
  started_at   INTEGER NOT NULL,
  finished_at  INTEGER,
  head_sha     TEXT,
  status       TEXT NOT NULL CHECK (status IN ('running','done','failed','cancelled')),
  mode         TEXT NOT NULL DEFAULT 'full' CHECK (mode IN ('full','incremental')),
  files_n      INTEGER NOT NULL DEFAULT 0,
  sites_n      INTEGER NOT NULL DEFAULT 0,
  captures_n   INTEGER NOT NULL DEFAULT 0,
  commits_n    INTEGER NOT NULL DEFAULT 0,
  warnings_n   INTEGER NOT NULL DEFAULT 0,
  peak_rss_mb  INTEGER,
  escalated_to_full INTEGER NOT NULL DEFAULT 0,
  grammar_versions_json TEXT,
  query_hash   TEXT,
  dict_version TEXT,
  dict_schema  INTEGER,
  gen_version  INTEGER,
  app_version  TEXT,
  fingerprint  TEXT,
  error        TEXT
);

CREATE TABLE git_commit (                   -- 'commit' 은 SQL 키워드라 접두어
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id      INTEGER NOT NULL REFERENCES repo(id),
  sha          TEXT    NOT NULL,
  parent_sha   TEXT,
  parent_count INTEGER NOT NULL DEFAULT 1,
  authored_at  INTEGER NOT NULL,
  author_email TEXT,
  author_name  TEXT,
  message      TEXT    NOT NULL,           -- 제목 줄만
  truncated    INTEGER NOT NULL DEFAULT 0,
  files_n      INTEGER NOT NULL,
  insertions   INTEGER NOT NULL,
  deletions    INTEGER NOT NULL,
  is_reachable INTEGER NOT NULL DEFAULT 1 CHECK (is_reachable IN (0,1)),
  kind         TEXT    CHECK (kind IN ('normal','merge','revert','bot','bulk')),   -- TS 파생
  author_matched INTEGER CHECK (author_matched IN (0,1)),                          -- TS 파생
  UNIQUE (repo_id, sha)
);

CREATE TABLE commit_file (
  commit_id    INTEGER NOT NULL REFERENCES git_commit(id) ON DELETE CASCADE,
  path         TEXT    NOT NULL,
  old_path     TEXT,
  status       TEXT    NOT NULL CHECK (status IN ('A','M','D','R')),
  additions    INTEGER NOT NULL,            -- 공백 무시 diff 통계
  deletions    INTEGER NOT NULL,
  touched_json TEXT    NOT NULL,            -- [[from,to],…] 새 쪽 줄 범위
  PRIMARY KEY (commit_id, path)
);
CREATE INDEX ix_commit_file_path ON commit_file(path);

CREATE TABLE file (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id          INTEGER NOT NULL REFERENCES repo(id),
  path             TEXT    NOT NULL,
  lang             TEXT,                   -- TS 가 grammar 에서 파생
  grammar          TEXT,
  line_count       INTEGER NOT NULL DEFAULT 0,
  byte_size        INTEGER NOT NULL DEFAULT 0,
  content_hash     TEXT,                   -- git blob oid
  head_oid         TEXT,
  is_dirty         INTEGER NOT NULL DEFAULT 0 CHECK (is_dirty IN (0,1)),
  parse_quality    TEXT    CHECK (parse_quality IN ('ok','poor')),
  skip_reason      TEXT,             -- 'too-large' | 'long-line' | 'timeout' | 'no-grammar' | 'binary' | 'generated'
  first_commit_id  INTEGER REFERENCES git_commit(id),
  is_alive         INTEGER NOT NULL DEFAULT 1 CHECK (is_alive IN (0,1)),
  updated_at       INTEGER NOT NULL,
  UNIQUE (repo_id, path)
);

CREATE TABLE capture (                      -- Rust 사실. TS 는 파일 단위로 읽어 concept_site 를 파생
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id       INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  query_id      TEXT    NOT NULL,           -- 개념 id | '_imports' | '_blocks'
  match_id      INTEGER NOT NULL,
  pattern_index INTEGER NOT NULL,
  name          TEXT    NOT NULL,           -- site | pick.N | hole | ctx.<name> | import.source | block.function | block.name
  form          TEXT,
  node_kind     TEXT    NOT NULL,
  in_error      INTEGER NOT NULL DEFAULT 0 CHECK (in_error IN (0,1)),
  start_byte    INTEGER NOT NULL, end_byte INTEGER NOT NULL,
  start_line    INTEGER NOT NULL, end_line INTEGER NOT NULL,
  start_col     INTEGER NOT NULL, end_col  INTEGER NOT NULL,
  excerpt       TEXT    NOT NULL            -- ≤ 200자
);
CREATE INDEX ix_capture_file ON capture(file_id, query_id, match_id);
CREATE INDEX ix_capture_query ON capture(query_id, file_id);

-- 대지 = 내 리포의 기능 하나. 탐지 규칙은 03 §6.5. order_idx 는 개념 위상 정렬로 §6 이 채운다
CREATE TABLE unit (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id     INTEGER NOT NULL REFERENCES repo(id),
  name        TEXT    NOT NULL,
  root_path   TEXT,
  source      TEXT    NOT NULL CHECK (source IN ('dir','commit-cluster','manual')),
  order_idx   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (repo_id, name)
);
CREATE TABLE unit_file (
  unit_id  INTEGER NOT NULL REFERENCES unit(id) ON DELETE CASCADE,
  file_id  INTEGER NOT NULL REFERENCES file(id),
  PRIMARY KEY (unit_id, file_id)
);
CREATE TABLE unit_node (                    -- 홈의 스티커 하나 = (대지, 개념, 트랙)
  unit_id     INTEGER NOT NULL REFERENCES unit(id) ON DELETE CASCADE,
  concept_id  TEXT    NOT NULL REFERENCES concept(id),
  track       TEXT    NOT NULL CHECK (track IN ('t0','t1','t2','t3')),
  node_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (unit_id, concept_id, track)
);

-- 내 코드 사용처. `excerpt` ≤ 200자만 저장 — 은퇴한 카드만 snapshot 을 가진다
CREATE TABLE concept_site (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id        INTEGER NOT NULL REFERENCES repo(id),
  file_id        INTEGER NOT NULL REFERENCES file(id),
  concept_id     TEXT    NOT NULL REFERENCES concept(id),
  site_key       TEXT    NOT NULL,           -- fnv1a64(concept, path, shape, occurrence) (D70)
  line_start     INTEGER NOT NULL,
  line_end       INTEGER NOT NULL,
  col_start      INTEGER NOT NULL,
  col_end        INTEGER NOT NULL,
  ts_node_kind   TEXT,                       -- tree-sitter 노드 종류
  form           TEXT,
  shape          TEXT    NOT NULL,
  occurrence     INTEGER NOT NULL DEFAULT 0,
  excerpt        TEXT    NOT NULL,
  picks_json     TEXT    NOT NULL DEFAULT '{}',   -- Record<number,string> 이다 (D58)
  hole_json      TEXT,
  ctx_json       TEXT    NOT NULL DEFAULT '{}',
  line_concepts_json TEXT NOT NULL DEFAULT '[]',
  uncovered_ratio REAL   NOT NULL DEFAULT 0,
  confidence     TEXT    NOT NULL DEFAULT 'syntactic' CHECK (confidence IN ('syntactic','heuristic')),
  parse_quality  TEXT    NOT NULL DEFAULT 'ok',
  is_dirty       INTEGER NOT NULL DEFAULT 0,
  is_oversize    INTEGER NOT NULL DEFAULT 0,
  commit_id      INTEGER REFERENCES git_commit(id),  -- 처음 등장한 커밋 (「선택의 왜」 연결)
  unknown_count  INTEGER NOT NULL DEFAULT 0,          -- 파생: 같은 줄의 미지 개념 수 (§6)
  is_alive       INTEGER NOT NULL DEFAULT 1 CHECK (is_alive IN (0,1)),
  updated_at     INTEGER NOT NULL,
  CHECK (line_end >= line_start)
);
CREATE INDEX ix_site_repo_concept ON concept_site(repo_id, concept_id, is_alive, unknown_count);
CREATE INDEX ix_site_file_line    ON concept_site(file_id, line_start, line_end);
CREATE UNIQUE INDEX ux_site_key ON concept_site(repo_id, site_key);

CREATE TABLE import_edge (                  -- TS 파생 (04 §7.1)
  repo_id      INTEGER NOT NULL REFERENCES repo(id),
  from_file_id INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  to_file_id   INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  kind         TEXT    NOT NULL CHECK (kind IN ('static','type','dynamic','http')),
  confidence   TEXT    NOT NULL DEFAULT 'syntactic' CHECK (confidence IN ('syntactic','heuristic')),
  PRIMARY KEY (from_file_id, to_file_id, kind)
);
CREATE INDEX ix_edge_to ON import_edge(to_file_id);

CREATE TABLE block (                        -- T1 필사 단위 (04 §3.1), 원본 AST 캐시
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id     INTEGER NOT NULL REFERENCES repo(id),
  file_id     INTEGER NOT NULL REFERENCES file(id),
  rev         TEXT,                          -- NULL = 워크트리
  name        TEXT    NOT NULL,
  kind        TEXT    NOT NULL,              -- function | method | class | file | segment
  line_start  INTEGER NOT NULL, line_end INTEGER NOT NULL,
  text_hash   TEXT    NOT NULL,
  ast_json    TEXT,                          -- AstLite (parse_snippet 결과)
  is_alive    INTEGER NOT NULL DEFAULT 1 CHECK (is_alive IN (0,1)),
  updated_at  INTEGER NOT NULL,
  UNIQUE (file_id, line_start, text_hash)
);

-- ───────── 카드 ─────────
-- T1 의 `concept_id` = 블록 대표 개념(00 D27), T2 의 `concept_id` = `arch/placement|radius|flow|direction`
CREATE TABLE card (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id        INTEGER NOT NULL REFERENCES repo(id),
  unit_id        INTEGER REFERENCES unit(id),
  track          TEXT    NOT NULL CHECK (track IN ('t0','t1','t2','t3')),
  kind           TEXT    NOT NULL CHECK (kind IN ('meaning','blank','point','transcribe','placement','radius','flow','direction','repair','reimpl')),
  concept_id     TEXT    NOT NULL REFERENCES concept(id),   -- 숙련도가 붙는 개념
  level          INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),  -- 사용처 복잡도 밴드 (§6)
  site_id        INTEGER REFERENCES concept_site(id),       -- T0
  file_id        INTEGER REFERENCES file(id),               -- T1 필사 대상
  commit_id      INTEGER REFERENCES git_commit(id),         -- T2 정답지
  payload_json   TEXT    NOT NULL,           -- 문제 본문 (§8 CardPayload)
  snapshot_json  TEXT,                       -- 은퇴 시 채움: 코드 줄 스냅샷
  gen_version    INTEGER NOT NULL DEFAULT 1, -- 카드 생성기 버전
  content_hash   TEXT    NOT NULL,           -- 중복 생성 방지
  created_at     INTEGER NOT NULL,
  retired_at     INTEGER,
  UNIQUE (repo_id, content_hash)
);
CREATE INDEX ix_card_pick ON card(repo_id, concept_id, track, level, retired_at);

CREATE TABLE card_concept (                 -- T1/T2 가 스치는 부수 개념 (숙련도엔 영향 없음, 미지 계산용)
  card_id     INTEGER NOT NULL REFERENCES card(id) ON DELETE CASCADE,
  concept_id  TEXT    NOT NULL REFERENCES concept(id),
  role        TEXT    NOT NULL CHECK (role IN ('secondary')),
  PRIMARY KEY (card_id, concept_id)
);

CREATE TABLE card_state (                   -- 카드 인스턴스 상태 (개념 숙련도와 별개)
  card_id         INTEGER PRIMARY KEY REFERENCES card(id),
  prints          INTEGER NOT NULL DEFAULT 0,
  stage           INTEGER NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 3),  -- T1 페이딩 단계
  last_pct        REAL,
  est_min_ema     REAL,                     -- 실측 소요 시간 EMA (α=0.3)
  last_printed_at INTEGER,
  is_suspended    INTEGER NOT NULL DEFAULT 0 CHECK (is_suspended IN (0,1))
);

-- ───────── 숙련도 (파생 캐시 · review_log 재생으로 재구성) ─────────
CREATE TABLE mastery (
  concept_id        TEXT PRIMARY KEY REFERENCES concept(id),
  state             INTEGER NOT NULL DEFAULT 0 CHECK (state IN (0,1,2,3)),  -- FSRS: 0 New 1 Learning 2 Review 3 Relearning
  stability         REAL,                   -- 일 단위
  difficulty        REAL,                   -- 1~10
  due_at            INTEGER,
  last_review_at    INTEGER,
  reps              INTEGER NOT NULL DEFAULT 0,
  lapses            INTEGER NOT NULL DEFAULT 0,
  layer             INTEGER NOT NULL DEFAULT 0 CHECK (layer BETWEEN 0 AND 4),   -- 잉크 겹 (저장값, 흐려짐 적용 전)
  day_key           TEXT,                   -- 마지막으로 만진 로컬 날짜
  day_start_layer   INTEGER NOT NULL DEFAULT 0,
  day_ceiling       INTEGER NOT NULL DEFAULT 0,
  first_ok_at       INTEGER,                -- LIFER 시각
  last_ok_day       TEXT,
  dunno_total       INTEGER NOT NULL DEFAULT 0,
  transfer_from     TEXT REFERENCES concept(id),  -- 전이로 첫 겹을 받은 출처 개념 (§4·§6.3)
  applied_log_id    INTEGER NOT NULL DEFAULT 0,  -- 마지막으로 반영한 review_log.id (재생 커서)
  updated_at        INTEGER NOT NULL
);
CREATE INDEX ix_mastery_due ON mastery(due_at) WHERE state <> 0;

-- ───────── 세션 · 큐 ─────────
CREATE TABLE session (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id       INTEGER NOT NULL REFERENCES repo(id),
  day_key       TEXT    NOT NULL,
  seq_in_day    INTEGER NOT NULL DEFAULT 1,
  started_at    INTEGER NOT NULL,
  ended_at      INTEGER,
  budget_min    REAL    NOT NULL,
  planned_min   REAL    NOT NULL,
  elapsed_s     INTEGER NOT NULL DEFAULT 0,
  status        TEXT    NOT NULL CHECK (status IN ('active','paused','done','abandoned')),
  plan_json     TEXT    NOT NULL,           -- 최초 큐 스냅샷 (디버그·재현용)
  lifer_shown   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (repo_id, day_key, seq_in_day)
);
CREATE INDEX ix_session_repo_day ON session(repo_id, day_key);

CREATE TABLE session_item (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id        INTEGER NOT NULL REFERENCES session(id),
  pos               INTEGER NOT NULL,        -- 0부터, 삽입 시 뒤를 +1 밀어 재부여
  card_id           INTEGER NOT NULL REFERENCES card(id),
  concept_id        TEXT    NOT NULL REFERENCES concept(id),
  track             TEXT    NOT NULL,
  role              TEXT    NOT NULL CHECK (role IN ('review','new','retry','prereq','manual','gap')),
  est_min           REAL    NOT NULL,
  parent_item_id    INTEGER REFERENCES session_item(id),   -- retry·prereq 의 부모 판
  status            TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','done','skipped','removed')),
  elapsed_s         INTEGER NOT NULL DEFAULT 0,
  state_json        TEXT,                    -- 판 내부 진행 (T1 초안 · 선택 · 사다리 단 · returned)
  review_log_id     INTEGER REFERENCES review_log(id),
  created_at        INTEGER NOT NULL,
  UNIQUE (session_id, pos)
);
CREATE INDEX ix_item_session_status ON session_item(session_id, status);

-- ───────── 원장 ─────────
CREATE TABLE review_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id       INTEGER NOT NULL REFERENCES session(id),
  session_item_id  INTEGER NOT NULL REFERENCES session_item(id),
  card_id          INTEGER NOT NULL REFERENCES card(id),
  concept_id       TEXT    NOT NULL REFERENCES concept(id),
  track            TEXT    NOT NULL,
  role             TEXT    NOT NULL,          -- session_item.role 복사 (조인 없이 집계)
  reviewed_at      INTEGER NOT NULL,
  day_key          TEXT    NOT NULL,          -- 쓰는 순간 박제. 이후 시간대가 바뀌어도 불변
  grade            INTEGER NOT NULL CHECK (grade IN (1,2,3,4)),   -- FSRS Again/Hard/Good/Easy
  ok               INTEGER NOT NULL CHECK (ok IN (0,1)),          -- 트랙별 「맞음」 (T1·T2 는 85% 기준)
  dunno            INTEGER NOT NULL DEFAULT 0 CHECK (dunno IN (0,1)),
  early            INTEGER NOT NULL DEFAULT 0 CHECK (early IN (0,1)),  -- 만기 12h 전에 찍음 → 겹 미상승
  elapsed_days     REAL    NOT NULL,          -- 직전 복습부터 (첫 복습 0)
  scheduled_days   REAL    NOT NULL,
  r_at_review      REAL,                      -- 복습 시점 retrievability (첫 복습 NULL)
  layer_before     INTEGER NOT NULL,
  layer_after      INTEGER NOT NULL,
  s_before         REAL, d_before REAL, s_after REAL NOT NULL, d_after REAL NOT NULL,
  due_after        INTEGER NOT NULL,
  params_id        INTEGER NOT NULL REFERENCES scheduler_params(id),
  duration_ms      INTEGER NOT NULL,
  detail_json      TEXT    NOT NULL           -- 트랙별 상세 (§8 ReviewDetail)
);
CREATE INDEX ix_log_concept_time ON review_log(concept_id, reviewed_at);
CREATE INDEX ix_log_day          ON review_log(day_key);
CREATE INDEX ix_log_session      ON review_log(session_id);

CREATE TABLE dunno_event (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  session_item_id   INTEGER NOT NULL UNIQUE REFERENCES session_item(id),   -- 카드(판)당 1회
  review_log_id     INTEGER REFERENCES review_log(id),                     -- 판을 마치면 연결
  card_id           INTEGER NOT NULL REFERENCES card(id),
  concept_id        TEXT    NOT NULL REFERENCES concept(id),
  at                INTEGER NOT NULL,
  answered_before   INTEGER NOT NULL CHECK (answered_before IN (0,1)),     -- 맞힌 뒤 눌렀나
  was_correct       INTEGER,
  max_rung          INTEGER NOT NULL DEFAULT 1 CHECK (max_rung BETWEEN 1 AND 4),
  layer_before      INTEGER NOT NULL,
  layer_after       INTEGER NOT NULL
);

CREATE TABLE ladder_event (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  dunno_event_id   INTEGER NOT NULL REFERENCES dunno_event(id),
  rung             INTEGER NOT NULL CHECK (rung BETWEEN 1 AND 4),
  action           TEXT    NOT NULL CHECK (action IN ('open','jump','back','return','prompt_built','copied')),
  target_card_id   INTEGER REFERENCES card(id),         -- jump 대상 아래층 판
  at               INTEGER NOT NULL
);
CREATE INDEX ix_ladder_dunno ON ladder_event(dunno_event_id);

CREATE TABLE appeal (                        -- T1 「같은 뜻인데요」 · T2 「이것도 맞다」 — 점수 불변, 규칙 개선 큐
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  review_log_id   INTEGER NOT NULL REFERENCES review_log(id),
  card_id         INTEGER NOT NULL REFERENCES card(id),
  track           TEXT    NOT NULL CHECK (track IN ('t1','t2')),
  line_no         INTEGER,                   -- T1: 원본 줄 (1-based) · T2: NULL
  original_text   TEXT,
  user_text       TEXT,                      -- T2 「이것도 맞다」 = track='t2', auto_verdict='wrong-pick', user_text=파일 경로
  norm_original   TEXT,
  norm_user       TEXT,
  auto_verdict    TEXT    NOT NULL,          -- 'differ' | 'missing' | 'extra' | 'wrong-pick'
  auto_reason     TEXT,
  reasons_json    TEXT,
  pattern_key     TEXT,
  engine_version  TEXT,
  dict_version    TEXT,
  status          TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','rejected')),
  created_at      INTEGER NOT NULL,
  resolved_at     INTEGER,
  note            TEXT
);
CREATE INDEX ix_appeal_status ON appeal(status);
CREATE INDEX ix_appeal_pattern ON appeal(pattern_key, status);

CREATE TABLE why_answer (                   -- T1 왜 게이트 (04 §6). 채점·겹 효과 없음
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  review_log_id  INTEGER NOT NULL REFERENCES review_log(id),
  card_id        INTEGER NOT NULL REFERENCES card(id),
  block_id       INTEGER REFERENCES block(id),
  line_no        INTEGER,
  question_id    TEXT    NOT NULL,           -- 'why_gate:<concept>' | 'missing:<line>' | 'differ:<line>' | 'generic'
  text           TEXT    NOT NULL,
  pick           INTEGER,
  pick_ok        INTEGER CHECK (pick_ok IN (0,1)),
  created_at     INTEGER NOT NULL
);

CREATE TABLE perf_sample (                  -- 06 §8, 최근 500행 순환
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  kind  TEXT    NOT NULL,                    -- ingest.total | ingest.file_p95 | queue | t1.grade | frame_p95
  ms    REAL    NOT NULL,
  n     INTEGER NOT NULL DEFAULT 1,
  at    INTEGER NOT NULL
);

CREATE TABLE lifer (                         -- 개념당 평생 1회. id 가 곧 일련번호 (#047)
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  concept_id   TEXT    NOT NULL UNIQUE REFERENCES concept(id),
  card_id      INTEGER NOT NULL REFERENCES card(id),
  repo_id      INTEGER NOT NULL REFERENCES repo(id),
  file_path    TEXT    NOT NULL,             -- 채집지 (당시 경로를 박제)
  line_no      INTEGER,
  at           INTEGER NOT NULL,
  shown_at     INTEGER                       -- 의식(연출)을 보여준 시각. NULL 이면 요약에서 보여준다
);

CREATE TABLE gap (                           -- 판이 없는 문법 (파생 + 상태)
  repo_id        INTEGER NOT NULL REFERENCES repo(id),
  concept_id     TEXT    NOT NULL REFERENCES concept(id),
  site_count     INTEGER NOT NULL,
  min_unknown    INTEGER NOT NULL,
  best_site_id   INTEGER REFERENCES concept_site(id),   -- 가장 단순한 사용처
  reason         TEXT,                                  -- 04 `no-plate` 사유
  status         TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open','card_made','dismissed')),
  computed_at    INTEGER NOT NULL,
  PRIMARY KEY (repo_id, concept_id)
);
```

T3 는 `track='t3'`·`kind IN ('repair','reimpl')` 자리만 두고 테이블은 만들지 않는다.

### 2.3 데이터 크기 추정 — 리포 1개(TS 300 파일·3만 줄·커밋 300), 하루 1세션 × 90일

| 테이블 | 행 수 | 행 크기(인덱스 포함) | 합계 |
|---|---|---|---|
| concept · concept_prereq | 600 · 1,500 | 200 B · 60 B | 0.2 MB |
| file · git_commit | 400 · 300 | 150 B · 300 B | 0.15 MB |
| **concept_site** | 45,000 (≈1.5/줄) | 420 B(excerpt·json) | **≈ 19 MB** |
| **capture** | 180,000 (사이트당 ≈4) | 140 B | **25 MB** |
| card (payload 3 KB) | 500 | 3.2 KB | 1.6 MB |
| mastery · card_state | 250 · 500 | 180 B · 80 B | 0.1 MB |
| session · session_item | 110 · 2,600 | 1 KB · 250 B | 0.8 MB |
| review_log (detail 300 B) | 2,400 | 550 B | 1.3 MB |
| dunno · ladder · appeal · lifer · gap | 300 · 900 · 60 · 200 · 80 | ≤ 150 B | 0.2 MB |
| **합계** | | | **≈ 55 MB** (WAL 피크 ×2) |

`concept_site` 가 유일한 큰 테이블이다. `excerpt` 200자는 사다리 3단이 파일 읽기 없이 그려지는 값이라 감수한다(01 열린 질문 1 절충). 앞뒤 맥락 줄은 넣지 않는다.

---

## 3. 숙련도 = 잉크 겹 0~4 ↔ FSRS

### 3.1 역할 분담

- **FSRS(`ts-fsrs`, FSRS-5)** 가 정하는 것: `stability(S)·difficulty(D)·state·due_at`. 즉 **언제** 다시 인쇄할지.
- **겹 리듀서(§3.3)** 가 정하는 것: `layer 0~4`. 즉 **얼마나 익혔다고 보여줄지**. 규칙은 「시간을 두고 다시 맞힌 횟수」 하나.
- 둘의 접점은 (a) 등급 매핑(§3.2) (b) 겹 상승 자격에 쓰는 `due_at` (c) 흐려짐에 쓰는 R(§3.4).

왜 겹을 S 구간으로 도출하지 않나: S 는 오답 한 번에 11 → 2.1 로 떨어진다(§3.5). 구간 매핑이면 「한 번 어긋났다고 겹이 바닥까지 떨어지지 않는다」(§3 불변 규칙 2)를 지킬 수 없고, 임계값 근처에서 홈의 새가 깜빡인다. 반대로 겹만 두고 FSRS 를 빼면 개인차·난이도차가 사라져 SM-2 의 「쉬운 카드가 어려운 카드와 같은 간격」 문제로 돌아간다.

### 3.2 등급 매핑 (Easy 는 쓰지 않는다)

| 트랙·결과 | FSRS 등급 | `ok` |
|---|---|---|
| T0 첫 정답(개념 첫 성공) | **Hard(2)** — 객관식 첫 정답은 인식이지 회상이 아니다. 전이 개념(§6.3)이면 Good | 1 |
| T0 정답(복습) · 다시 찍기 판 정답 | Good(3) | 1 |
| T0 오답 | Again(1) | 0 |
| 모르겠어요(답 전·후 무관) | Again(1) — 「오늘 다시 보고 싶다」는 신호이지 벌이 아니다 | 원래 답의 ok |
| T1 의미 일치 ≥ 85 % | Good; 원본 잠깐 보기 ≥ 3회면 Hard | 1 |
| T1 65~85 % · 「한 단계 쉽게」 사용 | Hard | 0 |
| T1 < 65 % | Again | 0 |
| T2 핵심 ≥ 85 % | Good; 힌트 ≥ 2 면 Hard | 1 |
| T2 65~85 % (04 문서와 통일) | Hard | 0 |
| T2 < 65 % | Again | 0 |

### 3.3 겹 리듀서 (규칙 표 + 의사코드)

| 규칙 | 내용 |
|---|---|
| R1 하루 한 겹 | 한 개념은 로컬 하루(§5.6)에 최대 +1. 그날 첫 접촉 때 `day_ceiling` 을 정한다 |
| R2 만기 근처에서만 | +1 자격 = 개념 첫 성공이거나, `last_ok_day < 오늘` 이고 `now ≥ due_at − 12h`. 그 전에 찍으면 `early=1`, 겹 유지, 「아직 잉크가 마르지 않았어요 — 다음 인쇄 N일 뒤에 겹이 쌓입니다」 |
| R3 오답은 유지 | `layer` 불변, 대신 그날 천장을 현재 겹으로 내린다(다시 찍기 정답이 겹을 올리지 못하게) |
| R4 모르겠어요는 −1, 회복만 | `layer = max(day_start_layer − 1, layer − 1)`, 천장은 `day_start_layer` 로. 같은 날 다시 찍기 정답은 원래 겹까지만 돌아오고, **같은 날 두 번째 「모르겠어요」는 더 내리지 않는다**(D78 — R1 의 대칭) |
| R5 첫 성공은 무조건 1겹 | `first_ok_at` 이 NULL 이면 천장 하한 1. 오답·모르겠어요 뒤 다시 찍기에서 맞혀도 첫 겹은 찍힌다(LIFER) |
| R6 흐려짐 | 표시 겹 = `layer − fade(R)`; 그날 첫 접촉 때 표시 겹을 저장값으로 물질화한다(§3.4) |

```ts
// mastery/reducer.ts — 순수 함수. review_log 한 행 = 이 함수 한 번. rebuild_mastery() 도 같은 함수를 돈다.
type Outcome = 'ok' | 'wrong' | 'dunno';       // dunno 는 답의 정오와 무관하게 우선한다
const EARLY_GRACE_MS = 12 * 3600e3;

export function beginDay(m: Mastery, now: number, day: string): Mastery {
  if (m.day_key === day) return m;
  const layer = shownLayer(m, now);                         // R6 물질화
  const eligible = m.first_ok_at == null
    || (m.last_ok_day != null && m.last_ok_day < day && m.due_at != null && now >= m.due_at - EARLY_GRACE_MS);
  let ceiling = eligible ? Math.min(4, layer + 1) : layer;  // R1 · R2
  if (m.first_ok_at == null) ceiling = Math.max(ceiling, 1); // R5
  return { ...m, layer, day_key: day, day_start_layer: layer, day_ceiling: ceiling };
}

export function applyOutcome(m: Mastery, o: Outcome): Mastery {
  let { layer, day_ceiling: ceiling } = m;
  if (o === 'dunno')      { layer = Math.max(m.day_start_layer - 1, layer - 1); ceiling = Math.min(ceiling, m.day_start_layer); } // R4 (D78)
  else if (o === 'wrong') { ceiling = Math.min(ceiling, layer); }                                              // R3
  if (m.first_ok_at == null) ceiling = Math.max(ceiling, 1);                                                   // R5
  if (o === 'ok') layer = Math.min(layer + 1, ceiling);
  return { ...m, layer, day_ceiling: ceiling };
}
```

검산: 2겹·만기 → 정답 3겹 ✓ · 오답 2겹, 다시 찍기 정답 2겹 ✓ · 모르겠어요 1겹, 다시 찍기 정답 2겹(제자리) ✓ · 0겹 새 판 모르겠어요 0겹, 다시 찍기 정답 1겹 + LIFER ✓ · 3겹을 만기 5일 전에 수동 인쇄해 정답 → 3겹 유지, `early=1` ✓.

### 3.4 흐려짐 (fade)

`R = (1 + 19/81 · t/S)^−0.5`, t = 마지막 복습 후 일수. `fade = R ≥ 0.8 ? 0 : R ≥ 0.6 ? 1 : 2`. 만기 시점 R 이 0.9 이므로 만기의 약 2.4배가 지나면 한 겹, 7.6배면 두 겹 흐려진다(4겹 S=30 → 72일·228일 방치 시). 표시 전용이며 원장에는 그날 첫 접촉 때 `layer_before` 로 기록된다. 왜: 「4겹 = 완성」이 영구 배지가 되면 홈이 거짓말한다. 새가 흐려져야 다시 찍을 이유가 보인다.

### 3.5 다음 인쇄 간격 표와 FSRS 의 관계

| 겹 | 이름 | 라벨(`NEXT_AT`) | FSRS 기본 파라미터 궤적(§3.2 매핑, R=0.9) | 전형적 S |
|---|---|---|---|---|
| 0 | 미인쇄 | 오늘 안에 | 새 판·다시 찍기(같은 세션 +3) | — |
| 1 | 애벌 | 내일 | 첫 정답 Hard → S₀=1.18 → **1.2일** | 0.4~2 |
| 2 | 먹판 | 3일 뒤 | Good → **3.4일** | 2~6 |
| 3 | +청판 | 9일 뒤 | Good → **9.4일** | 6~15 |
| 4 | +진홍 | 4주 뒤 | Good → **25일** | ≥ 15 |

궤적 열은 `ts-fsrs@5.4.2` 실측이다(D73) — **만기 당일에 찍었을 때**이며, 늦게 찍으면 R 이 낮아 더 크게 오른다.

**표는 라벨 근사이고 결정은 FSRS 가 한다.** 사다리 범례(홈)는 라벨을 쓰고, 판·요약의 「다음 인쇄」는 실제 `due_at` 을 `labelFor(due)` 로 바꿔 쓴다(`오늘 안에` < 다음 경계 · `내일` · `N일 뒤` < 14 · `N주 뒤`). 오답 뒤 S 는 11 → 2.1 로 떨어지고 같은 날 다시 찍기 정답이 ×1.41 을 곱해 약 3일 — 이때 3겹 개념이 「3일 뒤」로 표시되는 것이 정상이다.

FSRS-5 식(검증용, 구현은 `ts-fsrs`): `S′_recall = S·(e^{w8}(11−D)S^{−w9}(e^{w10(1−R)}−1)·w15^{[Hard]} + 1)` · `S′_forget = min(S, w11·D^{−w12}((S+1)^{w13}−1)e^{w14(1−R)})` · 같은 날 `S′ = S·e^{w17(G−3+w18)}` · `D′ = D − w6(G−3)(10−D)/9`, 평균 회귀 `w7·D₀(4) + (1−w7)D′`.

### 3.6 파라미터 초기값과 개인화

- 초기: FSRS-5 기본 `[0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621]`, `desired_retention = 0.90`. `scheduler_params` 에 `source='default', is_active=1` 로 1행.
- 개인화는 **MVP 이후**. `review_log` 가 **1,000행 이상**(≈ 6주)일 때, TS `ts-fsrs` 의 옵티마이저 가용성을 확인한 뒤 TS 에서 주 1회 최적화(Rust `fsrs` 크레이트는 쓰지 않는다 — 01 §1.1) → 새 행 `source='optimized'` 를 활성화. 이전 로그의 `params_id` 는 그대로(재생 시 그 시점 파라미터로 계산). 왜: 로그 몇 백 개로 최적화하면 과적합으로 간격이 튄다 — 실사용에서 본 「갑자기 전부 내일」 사고.
- 모든 로그 행이 `params_id` 를 가지므로 파라미터를 바꿔도 `rebuild_mastery()` 는 결정적이다.

---

## 4. 이벤트 → 효과 표

한 판(session_item)을 **마칠 때** `review_log` 1행. 모르겠어요는 그 판의 결과를 `dunno` 로 덮어쓴다(답을 맞혔어도 `grade=Again`, `ok` 는 원래 값).

| 이벤트 | 겹 (§3.3) | FSRS | 큐 삽입 (§5.5) | 기록 · 비고 |
|---|---|---|---|---|
| 전이 첫 노출 | `mastery{layer:1, state:0, transfer_from}` 행 생성 | 없음 | 없음 | 로그 없음. 같은 `universal_id` 의 어떤 언어 개념이 **3겹 이상**일 때만. 카드 payload `transferFrom` |
| T0 정답 · 개념 첫 성공 | 0→1 | Hard (전이면 Good) | 없음 | `lifer` 행 + 의식(세션 3회 상한; 넘거나 아래층·다시 찍기 판이면 `shown_at=NULL` → 요약에서) |
| T0 정답 · 복습, 자격 있음 | +1 (천장까지) | Good | 없음 | |
| T0 정답 · 조기(만기 12h 전) | 유지 | Good | 없음 | `early=1`, 안내 문구 |
| T0 오답 | 유지, 천장=현재 | Again | **다시 찍기**: 현재 +3 뒤(끝 넘으면 끝), 0.5분, `role='retry'`, 같은 카드 retry 가 이미 뒤에 있으면 생략 | 진단은 카드 payload `why[sel]` |
| 모르겠어요 (판당 1회, 답 전후 무관) | −1 (하한 0), 천장=그날 시작 겹 | Again | 다시 찍기 +3 (아래층 판에서는 삽입 안 함) | `dunno_event` UNIQUE(item). 사다리 1~3단은 LLM 불필요 |
| 다시 찍기 판 정답 | **회복만** (천장까지) | Good, 같은 날 ×1.41 | 없음 | `role='retry'` 판은 다시 찍기를 또 만들지 않는다(판당 최대 1회) |
| 다시 찍기 판 오답 | 유지 | Again, 같은 날 ×0.5 | 없음 | 내일 첫 순서로 자연 복귀(due) |
| 아래층(선행) 판으로 점프 | 부모 판: 변화 없음, `status` 유지 · 큐 **현재 앞**에 `role='prereq'` 0.7분 삽입 | — | `ladder_event(rung=2, action='jump')`, 부모 `state_json.jumped=true` |
| 아래층 판 결과 | **선행 개념의 mastery** 에 위 규칙 그대로(첫 성공이면 lifer 행, 의식은 요약) | 위와 같음 | 아래층은 2단(중첩 점프)·다시 찍기 삽입 없음 — 깊이 1 | 마치면 부모 판 자동 복귀, `state_json.returned=true` 로 「이어보기」 문단이 열린다. 부모 겹·천장은 건드리지 않는다 |
| 아래층에서 `B` 로 올라감 | 아래층 item `status='removed'`, 로그 없음 | — | — | `ladder_event(action='back')` |
| T1 결과 | ≥85 % 이고 「한 단계 쉽게」 안 썼으면 +1(자격 규칙 동일), 아니면 유지. **4겹은 3단계(백지) 통과에서만** — `applyOutcome` 전에 `ceiling = min(ceiling, stage === 3 ? 4 : 3)` (04 규칙 채택) | §3.2 | **없음** (7~16분 판을 같은 날 두 번 걸지 않는다) | `card_state.stage` 는 ≥85 % 면 +1(최대 3), 「한 단계 쉽게」면 −1. `detail_json` 에 meaning/total/exact/equiv/peeks/downgraded/why_text |
| T2 결과 | 핵심 ≥85 % 면 +1, 아니면 유지 | §3.2 | 없음 (정답지를 이미 다 봤다) | `detail_json` 에 pct/found/missed/wrong/bonus/hints |
| 이의 (T1 「같은 뜻인데요」 · T2 「이것도 맞다」) | **불변** | 불변 | 없음 | `appeal` 행. 나중에 accepted 되어도 점수·겹은 소급하지 않는다 — 규칙(04 문서 회귀 테스트)만 고친다 |
| 원본 잠깐 보기(T1) · 힌트(T2) | 불변 | 횟수가 임계 넘으면 Good→Hard | 없음 | 「감점이 아니라 더 자주 보여줄 신호」의 구현이 곧 Hard 등급 |
| 시간 경과 | 표시 −1/−2 (§3.4) | — | — | 그날 첫 접촉 때 물질화 |

---

## 5. 오늘의 인쇄 큐

### 5.1 상수 (settings 로 덮어쓸 수 있음)

```ts
export const EST_MIN = { t0_review: 0.5, t0_new: 2, t0_retry: 0.5, t0_prereq: 0.7, t2_review: 3, t2_new: 4 };
export const t1Est = (lines: number, stage: 1|2|3) => clamp(7, 16, Math.round(lines * [0.35, 0.5, 0.65][stage - 1]));
export const LIMIT = { budget_min: 15, min_budget: 10, hard_cap_min: 25, reviews_per_session: 20,
                       new_per_day: 2, t1_per_week: 2, t1_min_gap_days: 2, t2_gap_days: 2, retry_offset: 3 };
```
카드에 `card_state.est_min_ema` 가 있으면 그 값을 쓴다(실측 EMA, α=0.3). 왜: T1 예상 9분이 실제 19분이면 진행바가 거짓이 되고 예산이 무너진다.

### 5.2 입력

`repo_id · now · budget_min` · 만기 복습(`mastery.due_at ≤ 오늘 끝`, 이 리포에 살아 있는 카드가 있는 개념만) · 새 개념 후보(§6) · T1 리듬(최근 7일 T1 완료 < 2 이고 마지막 T1 ≥ 2일 전) · T2(만기 T2 복습, 없으면 마지막 T2 ≥ 2일 전일 때 새 T2 1장) · 오늘 이미 찍은 새 판 수(`review_log WHERE day_key=오늘 AND role='new'`).

### 5.3 알고리즘

```ts
export function planSession(repo: number, now: number): PlannedItem[] {
  const day = dayKey(now), eod = endOfDay(day);
  const paused = db.pausedSession(repo, day);
  if (paused) return resume(paused);                                   // 5.6 중단/복구
  const budget = clamp(LIMIT.min_budget, LIMIT.hard_cap_min, settings.budget_min);
  const known = loadKnownSet();                                        // §6.1
  const items: PlannedItem[] = [];

  // 1) 만기 복습 — R 낮은 순, 오늘 이미 맞힌 개념 제외, 상한 20 (부채는 여기서 잘린다)
  const due = db.dueConcepts(repo, eod, day)                           // §7.2
    .map(m => ({ ...m, r: retrievability(m) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, LIMIT.reviews_per_session);
  for (const m of due) {
    const card = pickCard(repo, m.concept_id, m.layer);               // level = clamp(1,3,layer), 최근 덜 본 kind
    if (!card) continue;
    items.push(item(card, 'review', card.track === 't2' ? EST_MIN.t2_review : EST_MIN.t0_review));
  }
  const t1Due = items.filter(i => i.track === 't1');                   // T1 복습이 만기면 그것이 오늘의 T1
  // 2) T1 슬롯 — 주 2회 리듬, 만기 T1 이 없을 때만 새/진행 중 T1
  if (!t1Due.length && t1CadenceSays(repo, day)) {
    const c = db.nextT1Card(repo);                                     // 단계 미완 카드 우선, 없으면 새 함수
    if (c) items.push(item(c, c.state.prints ? 'review' : 'new', c.state.est_min_ema ?? t1Est(c.lines, c.state.stage)));
  }
  // 3) T2 — 만기 T2 가 없고 간격이 찼으면 새 T2 1장
  if (!items.some(i => i.track === 't2') && t2CadenceSays(repo, day)) {
    const c = db.nextT2Card(repo); if (c) items.push(item(c, 'new', EST_MIN.t2_new));
  }
  // 4) 새 T0 — 하루 상한(세션 합산), §6 순위
  let newLeft = LIMIT.new_per_day - db.newCountToday(repo, day);
  for (const cand of rankNewConcepts(repo, known)) {                   // §6.2
    if (newLeft <= 0) break;
    const c = getOrGenerateCard(repo, cand.concept_id, cand.best_site_id, 1);
    if (c) { items.push(item(c, 'new', EST_MIN.t0_new)); newLeft--; }
  }
  // 5) 예산 맞추기 — 초과분은 새 T0 → 새 T2 → T1 순으로 뺀다. 만기 복습은 빼지 않는다(부채를 미루면 커진다)
  fitBudget(items, budget * 1.15, ['new:t0', 'new:t2', 'new:t1']);
  // 6) 순서 — T0 복습 → T0 새 판 → T1 → T2 (짧은 것 먼저: 중간에 나가도 복습은 남는다. T2 3분은 마무리)
  return order(items, ['review:t0', 'new:t0', 'review:t1', 'new:t1', 'review:t2', 'new:t2']);
}
```

빈 상태: 만기도 새 후보도 없으면 세션을 만들지 않고 홈에 「오늘은 인쇄할 판이 없습니다 — 리포를 더 파거나 내일」을 보인다(강제로 채우지 않는다).

### 5.4 시간 비례와 상한

`planned_min = Σ est_min`. 진행바 칸 너비 = `est_min`(목업 `--w`). 세션 중 삽입이 생기면 `planned_min` 을 늘리고 홈에는 알리지 않는다. 하드캡 25분은 **계획** 상한이며 삽입으로는 넘을 수 있다(다시 찍기 0.5분 × 최대 20 = 10분이 이론상 최악; 판당 retry 1회·dunno 1회 규칙이 상한).

### 5.5 세션 중 삽입

```ts
function insertRetry(sess, curPos, card) {                  // 오답·모르겠어요
  if (db.hasPendingRetry(sess.id, card.id, curPos)) return;  // 같은 판 중복 금지 (session.js:76)
  const at = Math.min(db.itemCount(sess.id), curPos + LIMIT.retry_offset);
  db.tx(() => { db.shiftPos(sess.id, at, +1); db.insertItem(sess.id, at, card, 'retry', EST_MIN.t0_retry, parent); });
}
function insertPrereq(sess, curPos, prereqCard, parentItem) { // 아래층: 현재 자리 앞. 부모는 그대로 뒤로 밀린다
  db.tx(() => { db.shiftPos(sess.id, curPos, +1); db.insertItem(sess.id, curPos, prereqCard, 'prereq', EST_MIN.t0_prereq, parentItem.id); });
}
```
`shiftPos` 는 `UPDATE session_item SET pos = pos + 1 WHERE session_id=? AND pos >= ? ORDER BY pos DESC`(UNIQUE 충돌 회피용 역순). 홈의 「이 판 찍기」·「판 만들기」는 오늘 세션(활성/일시정지)이 있으면 **현재 뒤 pos+1** 에 `role='manual'|'gap'`, 없으면 새 세션의 0번.

### 5.6 중단 · 복구 · 하루 여러 세션 · 자정 경계

- **Esc**: `session.status='paused'`, 현재 item `state_json`(T1 초안·선택·사다리 단·`elapsed_s`) 저장. 5초마다 `elapsed_s` 도 저장한다(목업의 persist 주기).
- **복귀**: 같은 `day_key` 면 그 세션을 그대로 이어 찍는다. `day_key` 가 바뀌었으면 `status='abandoned'`(완료 판의 로그는 이미 원장에 있음), 미완 항목은 버린다 — 그 카드들은 만기라서 새 세션이 다시 집는다. 왜: 어제 큐 + 오늘 만기를 합치면 25분을 넘긴다.
- **하루 여러 세션**: 허용. `seq_in_day` 증가, `new_per_day` 는 하루 합산, 완료 세션의 retry 는 이월하지 않는다.
- **하루 경계**: `dayKey(now)` = `settings.tz` 기준 `now` 의 로컬 날짜에서, 로컬 시각이 `rollover_hour` 보다 이르면 하루 뺀 값(**벽시계 규칙** — 고정 4시간 빼기가 아니다. DST 전이가 그 창에 들어오면 뺄셈식이 `endOfDay` 와 어긋난다, D54), 기본 `rollover_hour=4`, `tz` 는 첫 실행 때 OS 값을 저장하고 이후 바뀌어도 사용자가 설정에서 바꾸기 전엔 유지. 만기 판정은 `due_at ≤ endOfDay(day)`(다음 경계 시각). 모든 원장 행의 `day_key` 는 쓰는 순간 박제되어 절대 재계산하지 않는다.

---

## 6. 미지 개념 우선순위

### 6.1 「아직 모르는 개념 개수」

```ts
// known = 1겹 이상 ∪ 전이로 아는 개념
function loadKnownSet(): Set<string> {
  const rows = db.all(`SELECT c.id, c.universal_id, COALESCE(m.layer,0) AS layer FROM concept c LEFT JOIN mastery m ON m.concept_id=c.id`);
  const known = new Set(rows.filter(r => r.layer >= 1).map(r => r.id));
  const masteredUniversal = new Set(rows.filter(r => r.layer >= 3 && r.universal_id).map(r => r.universal_id));
  for (const r of rows) if (r.layer === 0 && r.universal_id && masteredUniversal.has(r.universal_id)) known.add(r.id); // 전이
  return known;
}
```
`unknownCount` 는 03 §3.6 의 함수를 `@chickadee/concepts` 에서 import 해 쓴다(입력 `ConceptSite.lineConcepts`·`uncoveredRatio`, 사전 선행 2단). 결과를 `concept_site.unknown_count` 에 캐시한다.

예시와 숫자는 03 §3.6 을 따른다(`const MAX = 10` → 0~1, `useState` 줄 → 3~4). `unknown_count` 는 세션이 끝날 때마다 **그 세션에서 겹이 바뀐 개념의 사용처와 같은 줄에 있는 사용처만** 재계산한다(전체 4.5만 행을 매번 돌지 않는다).

### 6.2 새 개념 순위와 첫 노출 사용처

```ts
function rankNewConcepts(repo: number, known: Set<string>): Candidate[] {
  // 후보: 이 리포에 살아 있는 사용처가 있고, mastery 가 없거나 state=0 이며, 직접 선행이 모두 known 이거나 이 리포에 사용처가 없는 개념
  const cands = db.all(NEW_CANDIDATES_SQL, [repo]);                   // §7.2
  const order = topoOrder(cands.map(c => c.id), db.prereqEdges());    // Kahn. 사이클이면 사전 오류로 로그하고 id 순
  return cands
    .map(c => ({ ...c, best: bestSite(repo, c.id, known) }))
    .filter(c => c.best && c.best.unknown <= 3)                       // 4 이상이면 오늘은 보류 (선행이 먼저 찍히면 내려온다)
    .sort((a, b) => order.get(a.id)! - order.get(b.id)!               // 1) 위상(뿌리부터)
                  || a.best.unknown - b.best.unknown                   // 2) 미지 적은 것
                  || b.site_count - a.site_count                       // 3) 내 코드에 많이 나오는 것
                  || a.id.localeCompare(b.id));
}
function bestSite(repo, conceptId, known) {  // 미지 최소 → 줄 짧은 것 → 현재 대지 안의 것
  return db.get(`SELECT s.id, s.unknown_count AS unknown FROM concept_site s WHERE s.repo_id=? AND s.concept_id=? AND s.is_alive=1
                 ORDER BY s.unknown_count, (s.line_end - s.line_start), s.id LIMIT 1`, [repo, conceptId]);
}
```
카드 `level` 은 첫 노출 1(미지 ≤ 2 인 사용처), 2겹부터 2(미지 ≤ 3), 3겹부터 3(제한 없음). 복습 때 `pickCard` 가 `level=clamp(1,3,layer)` 카드를 고르고 없으면 그 자리에서 생성한다 — 같은 개념이 점점 복잡한 자기 코드로 나온다.

**진짜 바닥(E-4)**: 후보 개념의 모든 사용처가 미지 ≥ 4 인데 선행이 하나도 남지 않았으면 합성 예제 카드(`site_id=NULL`, payload 에 `preview_site_id = bestSite`)를 만들고 본문에 「곧 `useCart.ts:27` 에서 이걸 봅니다」를 반드시 넣는다.

### 6.3 개념 전이

`concept.universal_id` 가 같은 다른 언어 개념이 **3겹 이상**이면 첫 노출 때 `mastery` 행을 `layer=1, transfer_from=<그 개념>` 으로 만들고(§4 표) §6.1 에서 known 취급, 새 카드 payload 에 `transfer_from: 'py/for-in'` 이 실리고 본문 첫 줄이 「반복문은 이미 아시네요 — 표기만 다릅니다」가 된다. 첫 정답은 Hard 대신 Good(→ 3.8일). 숙련도는 여전히 언어고유 개념에 붙는다(전역 mastery 는 언어고유 id 로 저장).

### 6.4 프로그래밍 완전 초보 감지와 정직한 안내

측정 대상은 **뿌리 개념**(`concept_prereq` 에 자식으로 안 나오는 T0 개념: 변수·함수 호출·문자열 리터럴·조건문). 조건이 **한 세션 안에서** 모두 참이면 `settings.newcomer_flag='suspect'`, 다음 세션에서도 참이면 `'confirmed'`:

1. 뿌리 개념 새 판 ≥ 4장을 찍었고
2. 그중 오답+모르겠어요 ≥ 3장이며
3. 모르겠어요 사다리 2단(아래층 진단)이 매번 「비어 있는 층 0」을 보고했다(내려갈 곳이 없었다).

`confirmed` 면 홈 상단에 「이 앱은 내 코드를 교재로 씁니다. 「변수」「함수」 자체가 처음이면 교재가 없습니다 — 먼저 (외부 입문 자료 2개) 를 권합니다」를 보이고 **아무것도 잠그지 않는다**. 뿌리 개념 4장 중 3장을 맞히는 세션이 나오면 플래그를 지운다. 왜: 배치고사 없이 첫 세션의 행동만으로 판단하되(E-5), 억지로 커버하는 척하면 둘 다 못 한다는 결론(§4)을 데이터로 구현.

---

## 7. 대표 쿼리

### 7.1 홈

```sql
-- 대지 · 노드 · 겹 (fade 와 평균은 TS 에서: layerShown 을 구한 뒤 대지별 floor(avg))
SELECT u.id AS unit_id, u.name, u.order_idx, n.concept_id, n.track, n.node_order, c.name_ko, c.token,
       COALESCE(m.layer,0) AS layer, m.stability, m.last_review_at, m.state, m.due_at
FROM unit u JOIN unit_node n ON n.unit_id = u.id JOIN concept c ON c.id = n.concept_id
LEFT JOIN mastery m ON m.concept_id = n.concept_id
WHERE u.repo_id = :repo ORDER BY u.order_idx, n.node_order;

-- 잉크 겹 사다리 : 겹별 개념 수 (이 리포에 노드가 있는 개념만)
SELECT COALESCE(m.layer,0) AS layer, COUNT(*) AS n
FROM (SELECT DISTINCT n.concept_id FROM unit_node n JOIN unit u ON u.id = n.unit_id WHERE u.repo_id = :repo) x
LEFT JOIN mastery m ON m.concept_id = x.concept_id GROUP BY 1;

-- 다시 찍을 개념 : 만기 가까운 순 6개
SELECT m.concept_id, c.name_ko, c.token, c.track_default, m.layer, m.due_at, m.stability, m.last_review_at, s.excerpt
FROM mastery m JOIN concept c ON c.id = m.concept_id
LEFT JOIN concept_site s ON s.id = (SELECT s2.id FROM concept_site s2
       WHERE s2.repo_id = :repo AND s2.concept_id = m.concept_id AND s2.is_alive = 1
       ORDER BY s2.unknown_count, (s2.line_end - s2.line_start), s2.id LIMIT 1)
WHERE m.state <> 0 AND EXISTS (SELECT 1 FROM card k WHERE k.repo_id = :repo AND k.concept_id = m.concept_id AND k.retired_at IS NULL)
ORDER BY m.due_at LIMIT 6;

-- 판이 없는 문법 : 등장 횟수 순
SELECT g.concept_id, c.name_ko, c.token, g.site_count, g.min_unknown, g.best_site_id
FROM gap g JOIN concept c ON c.id = g.concept_id
WHERE g.repo_id = :repo AND g.status = 'open' ORDER BY g.site_count DESC LIMIT 5;

-- 14일 컬러 바 : 하루 합산 분
SELECT day_key, SUM(elapsed_s) / 60.0 AS mins FROM session
WHERE repo_id = :repo AND day_key >= :from_day AND status IN ('done','paused','abandoned') GROUP BY day_key;
```

노드 상태(TS): `done` = 표시 겹 ≥ 1 · `locked` = 직접 선행 중 이 리포에 카드가 있는데 표시 겹 0 인 것이 있음 · `current` = 잠기지 않은 첫 미인쇄 노드(위상 순). 대지 잠금은 그 대지 노드가 전부 locked 일 때.

### 7.2 세션 큐

```sql
-- 만기 복습 후보 (TS 가 R 로 정렬·20개 컷)
SELECT m.concept_id, m.layer, m.stability, m.difficulty, m.due_at, m.last_review_at, c.track_default
FROM mastery m JOIN concept c ON c.id = m.concept_id
WHERE m.state <> 0 AND m.due_at <= :eod
  AND EXISTS (SELECT 1 FROM card k WHERE k.repo_id = :repo AND k.concept_id = m.concept_id AND k.retired_at IS NULL)
  AND NOT EXISTS (SELECT 1 FROM review_log r WHERE r.concept_id = m.concept_id AND r.day_key = :day AND r.ok = 1)
ORDER BY m.due_at LIMIT 60;

-- 새 개념 후보 (NEW_CANDIDATES_SQL)
SELECT c.id, COUNT(s.id) AS site_count
FROM concept c JOIN concept_site s ON s.concept_id = c.id AND s.repo_id = :repo AND s.is_alive = 1
LEFT JOIN mastery m ON m.concept_id = c.id
WHERE c.kind = 'lang' AND c.is_retired = 0 AND c.track_default = 't0' AND COALESCE(m.state,0) = 0
  AND NOT EXISTS (
    SELECT 1 FROM concept_prereq p LEFT JOIN mastery pm ON pm.concept_id = p.prereq_id
    WHERE p.concept_id = c.id AND COALESCE(pm.layer,0) = 0
      AND EXISTS (SELECT 1 FROM concept_site ps WHERE ps.repo_id = :repo AND ps.concept_id = p.prereq_id AND ps.is_alive = 1))
GROUP BY c.id;

-- 복습에 쓸 카드 고르기 : 겹에 맞는 level, 가장 오래 안 본 kind
SELECT k.* FROM card k
LEFT JOIN (SELECT card_id, MAX(reviewed_at) AS last FROM review_log GROUP BY card_id) l ON l.card_id = k.id
WHERE k.repo_id = :repo AND k.concept_id = :concept AND k.retired_at IS NULL AND k.level = :level
ORDER BY l.last ASC NULLS FIRST, k.id LIMIT 1;
```

### 7.3 사다리 3단 — 같은 개념, 다른 사용처

```sql
SELECT s.id, f.path, s.line_start, s.line_end, s.unknown_count, s.excerpt
FROM concept_site s JOIN file f ON f.id = s.file_id
WHERE s.repo_id = :repo AND s.concept_id = :concept AND s.is_alive = 1 AND s.id <> :current_site
ORDER BY s.unknown_count, (s.line_end - s.line_start), f.path LIMIT 3;
```
한 줄은 `excerpt` 로 그리고, 앞뒤 맥락이 필요할 때만 `file_read_lines(rev)` 를 부른다.

### 7.4 요약 — 오늘 움직인 잉크

```sql
SELECT a.concept_id, c.name_ko, c.token, a.track,
       f.layer_before AS layer_from, l.layer_after AS layer_to, l.due_after, l.role AS last_role,
       l.detail_json
FROM (SELECT concept_id, track, MIN(id) AS first_id, MAX(id) AS last_id FROM review_log WHERE session_id = :session GROUP BY concept_id) a
JOIN review_log f ON f.id = a.first_id JOIN review_log l ON l.id = a.last_id JOIN concept c ON c.id = a.concept_id
ORDER BY a.first_id;
-- 정합 수 · 판 수 · LIFER
SELECT COUNT(*) AS n, SUM(ok) AS ok FROM review_log WHERE session_id = :session;
SELECT l.id, l.concept_id, l.file_path, l.line_no FROM lifer l WHERE l.at >= :session_started AND l.repo_id = :repo;
```

---

## 8. TS 타입과 직렬화 규약

### 8.1 규약

- **행 ↔ 객체 1:1.** Rust 는 `Vec<serde_json::Value>`(열 이름 키) 를 돌려주고, TS 는 테이블마다 `fromRow()` 하나로 변환한다. ORM 없음. SQL 문자열은 `packages/store-sql/statements/*.sql` 에 이름 붙여 둔다(IPC 형태는 01 문서). **`SELECT` 에 열 별칭을 붙이지 않는다** — 행이 열 이름으로 와야 변환기가 테이블당 하나로 성립한다(D57).
- 시각 `INTEGER` unix ms(UTC) → `number`. 날짜 키 `TEXT 'YYYY-MM-DD'` → `string` 브랜드 타입 `DayKey`. 불리언 `INTEGER 0/1` → `boolean` (경계에서 변환). `*_json` 열은 **zod 스키마로 파싱**하고 실패하면 그 행을 버리지 말고 오류로 올린다(무음 손상 금지).
- 정수 id 는 `number`(2^53 미만), 개념 id 는 `string` 브랜드 `ConceptId`. 실수(`stability` 등)는 `REAL` 그대로.
- 쓰기는 항상 트랜잭션 한 개: 「판 완료」= `review_log INSERT → mastery UPSERT → session_item UPDATE → (lifer INSERT) → (dunno_event UPDATE review_log_id)`.

### 8.2 타입 (스키마와 1:1, 발췌)

```ts
export type ConceptId = string & { readonly __brand: 'ConceptId' };
export type DayKey = string & { readonly __brand: 'DayKey' };     // 'YYYY-MM-DD'
export type Track = 't0' | 't1' | 't2' | 't3';
export type Grade = 1 | 2 | 3 | 4;                                 // Again Hard Good Easy
export type Layer = 0 | 1 | 2 | 3 | 4;

export interface Concept { id: ConceptId; lang: string; nameKo: string; token: string | null;
  kind: 'universal' | 'lang'; universalId: ConceptId | null; trackDefault: Track; dictVersionId: number; isRetired: boolean; }

export interface ConceptSite { id: number; repoId: number; fileId: number; conceptId: ConceptId; siteKey: string;
  lineStart: number; lineEnd: number; colStart: number; colEnd: number; tsNodeKind: string | null;
  form: string | null; shape: string; occurrence: number; excerpt: string;
  picks: Record<number, string>; hole: string | null; ctx: Record<string, string>;   // `@pick.N`·`@hole`·`@ctx.<name>` 원문
  lineConcepts: ConceptId[]; uncoveredRatio: number;
  confidence: 'syntactic' | 'heuristic'; parseQuality: 'ok' | 'poor'; isDirty: boolean; isOversize: boolean;
  commitId: number | null; unknownCount: number; isAlive: boolean; updatedAt: number; }

export interface Mastery { conceptId: ConceptId; state: 0 | 1 | 2 | 3; stability: number | null; difficulty: number | null;
  dueAt: number | null; lastReviewAt: number | null; reps: number; lapses: number;
  layer: Layer; dayKey: DayKey | null; dayStartLayer: Layer; dayCeiling: Layer;
  firstOkAt: number | null; lastOkDay: DayKey | null; dunnoTotal: number; transferFrom: ConceptId | null;
  appliedLogId: number; updatedAt: number; }

export interface Card { id: number; repoId: number; unitId: number | null; track: Track; kind: CardKind; conceptId: ConceptId;
  level: 1 | 2 | 3; siteId: number | null; fileId: number | null; commitId: number | null;
  payload: CardPayload; snapshot: CodeLine[] | null; genVersion: number; contentHash: string; createdAt: number; retiredAt: number | null; }

export type CodeLine = { n: number; t: string; target?: true } | { n: number; seg: Seg[]; target?: true };
export type Seg = { t: string; pick?: number } | { hole: true };
export type CardPayload =
  | { track: 't0'; kind: 'meaning' | 'blank' | 'point'; file: string; focus: number; lines: CodeLine[]; q: string; hint: string;
      options?: { t: string; mono?: boolean }[]; answer: number; why: (null | { t: string; edge?: { h: string; code: string[] } })[];
      ok: string; rule: string; result?: { label: string; value: string; note: string };
      dict?: DictLayer[]; prereq: { conceptId: ConceptId; n: string }[]; uses: { siteId: number; f: string; l: number }[];
      promptLines: string[];                                    // focus±4, 사다리 4단(프롬프트)용
      payoff?: string; bridge?: string; transferFrom?: ConceptId; previewSiteId?: number }   // 합성 예제일 때 「곧 여기서 본다」
  | { track: 't1'; kind: 'transcribe'; blockId: number; file: string; fn: string; original: string[]; show2: number[];
      why: { line: number; q: string; help: string; choices: { t: string; ok: boolean; fb: string }[] } }
      // `blockId` = `block.id` (D92). `why_answer.block_id` 와 `block.ast_json` 캐시를 되찾는 열쇠다.
      // `why.choices` 는 **3개 아니면 0개**다 — 3개면 사전 `why_gate`(04 §6 ①), 0개면 일반 템플릿(④).
  | { track: 't2'; kind: 'placement' | 'radius' | 'flow' | 'direction'; q: string; hint: string;
      bands: { l: string; s: string }[]; files: { p: string; r: number; isNew?: boolean }[]; edges: [string, string][];
      commit: { h: string; d: string; m: string; n: string }; core: Record<string, [string, string]>;
      sec: Record<string, [string, string]>; trap: Record<string, string>; hints: string[] };

export interface Session { id: number; repoId: number; dayKey: DayKey; seqInDay: number; startedAt: number; endedAt: number | null;
  budgetMin: number; plannedMin: number; elapsedS: number; status: 'active' | 'paused' | 'done' | 'abandoned'; plan: PlannedItem[]; liferShown: number; }

export interface SessionItem { id: number; sessionId: number; pos: number; cardId: number; conceptId: ConceptId; track: Track;
  role: 'review' | 'new' | 'retry' | 'prereq' | 'manual' | 'gap'; estMin: number; parentItemId: number | null;
  status: 'pending' | 'active' | 'done' | 'skipped' | 'removed'; elapsedS: number; state: ItemState | null; reviewLogId: number | null; createdAt: number; }
export type ItemState = { sel?: number; answered?: boolean; dunno?: boolean; rung?: 1 | 2 | 3 | 4; jumped?: boolean; returned?: boolean;
  prereqDone?: ConceptId[]; t1Draft?: string; t1Stage?: 1 | 2 | 3; peeks?: number; t2Sel?: string[]; hints?: number };

export interface ReviewLog { id: number; sessionId: number; sessionItemId: number; cardId: number; conceptId: ConceptId; track: Track;
  role: SessionItem['role']; reviewedAt: number; dayKey: DayKey; grade: Grade; ok: boolean; dunno: boolean; early: boolean;
  elapsedDays: number; scheduledDays: number; rAtReview: number | null; layerBefore: Layer; layerAfter: Layer;
  sBefore: number | null; dBefore: number | null; sAfter: number; dAfter: number; dueAfter: number; paramsId: number; durationMs: number;
  detail: ReviewDetail; }
export type ReviewDetail =
  | { track: 't0'; sel: number; answer: number; kind: 'meaning' | 'blank' | 'point' }
  | { track: 't1'; meaning: number; total: number; exact: number; equiv: number; differ: number; missing: number; extra: number;
      peeks: number; downgraded: boolean; stageBefore: 1|2|3; stageAfter: 1|2|3; appealedLines: number[]; whyText: string; whyPick: number | null }
      // `stageBefore` 는 **채점한 단계**다 — 「한 단계 쉽게」를 누른 뒤면 내려간 쪽이다 (D85).
      // `appealedLines` 는 1-based 원본 줄 (`appeal.line_no` 와 같은 단위).
  | { track: 't2'; pct: number; found: string[]; missed: string[]; wrong: string[]; bonus: string[]; hints: number; more: boolean };

export interface DunnoEvent { id: number; sessionItemId: number; reviewLogId: number | null; cardId: number; conceptId: ConceptId; at: number;
  answeredBefore: boolean; wasCorrect: boolean | null; maxRung: 1 | 2 | 3 | 4; layerBefore: Layer; layerAfter: Layer; }
export interface LadderEvent { id: number; dunnoEventId: number; rung: 1 | 2 | 3 | 4; action: 'open' | 'jump' | 'back' | 'return' | 'prompt_built' | 'copied'; targetCardId: number | null; at: number; }
export interface Appeal { id: number; reviewLogId: number; cardId: number; track: 't1' | 't2'; lineNo: number | null; originalText: string | null;
  userText: string | null; normOriginal: string | null; normUser: string | null;
  autoVerdict: 'differ' | 'missing' | 'extra' | 'wrong-pick'; autoReason: string | null; reasons: string[] | null;
  patternKey: string | null; engineVersion: string | null; dictVersion: string | null;
  status: 'open' | 'accepted' | 'rejected'; createdAt: number; resolvedAt: number | null; note: string | null; }
export interface Lifer { id: number; conceptId: ConceptId; cardId: number; repoId: number; filePath: string; lineNo: number | null; at: number; shownAt: number | null; }
export interface Gap { repoId: number; conceptId: ConceptId; siteCount: number; minUnknown: number; bestSiteId: number | null;
  reason: string | null; status: 'open' | 'card_made' | 'dismissed'; computedAt: number; }

// 인제스트 산출 · 원장 보강 (열과 1:1). `Capture`·`AstLite` 는 01 §3.1 에서 import 한다
export interface CommitFile { commitId: number; path: string; oldPath: string | null; status: 'A' | 'M' | 'D' | 'R';
  additions: number; deletions: number; touched: [number, number][]; }
export interface ImportEdge { repoId: number; fromFileId: number; toFileId: number;
  kind: 'static' | 'type' | 'dynamic' | 'http'; confidence: 'syntactic' | 'heuristic'; }
export interface Block { id: number; repoId: number; fileId: number; rev: string | null; name: string; kind: string;
  lineStart: number; lineEnd: number; textHash: string; ast: AstLite | null; isAlive: boolean; updatedAt: number; }
export interface WhyAnswer { id: number; reviewLogId: number; cardId: number; blockId: number | null; lineNo: number | null;
  questionId: string; text: string; pick: number | null; pickOk: boolean | null; createdAt: number; }
export interface PerfSample { id: number; kind: string; ms: number; n: number; at: number; }

export interface Settings { budgetMin: number; tz: string; rolloverHour: number; desiredRetention: number; newPerDay: number;
  t1PerWeek: number; newcomerFlag: 'none' | 'suspect' | 'confirmed'; theme: 'light' | 'dark'; trim: 'on' | 'off';
  motion: 'system' | 'reduce'; identities: { email: string; name: string }[]; excludeGlobs: string[]; }
// 기본값: newPerDay = 2, budgetMin = 15 (§5.1 LIMIT)
```

`ItemState`·`CardPayload`·`ReviewDetail`·`Settings` 는 각각 zod 스키마를 갖고, `Card.payload` 의 필드명은 목업 `data.js` 의 `CARDS`·`T1`·`T2` 키를 그대로 따라 05 문서가 그대로 렌더할 수 있게 한다.

---

## 대안과 버린 이유

| 결정 | 검토한 대안 | 버린 이유 |
|---|---|---|
| FSRS-5 | SM-2 (Anki 기본) | 카드별 난이도가 없어 쉬운 카드와 어려운 카드가 같은 간격. 오답 시 간격 초기화가 곧 「벌」이라 모르겠어요 철학과 충돌. 기본 파라미터만으로도 FSRS 가 20~30 % 적은 복습으로 같은 기억률(공개 벤치마크) |
| 개념 단위 mastery, 전역 | 파일·카드 단위 · 리포별 mastery | 리팩터링 한 번에 카드 수백 장 고아 · 같은 문법 중복 출제로 덱 폭발 · 리포를 바꾸면 자산이 0 |
| 겹 = 이벤트 리듀서 | S 구간 매핑(S<2 → 1겹 …) · 정답 횟수 누적 | 구간은 임계 깜빡임 + 「정확히 한 겹」 불가 · 횟수 누적은 같은 날 연타로 4겹(「시간을 두고」 위반) |
| 첫 정답 Hard | Good · Anki 식 학습 단계(10분·1일) | Good 은 첫 간격 3.2일이라 「내일」 라벨과 어긋남 · 분 단위 학습 단계는 세션 안 재노출(다시 찍기)이 이미 하고 있어 중복 |
| 한 개념당 카드 여러 장(level·kind) 중 하루 1장 | 카드마다 독립 스케줄 | 카드 3종 × 개념 = 하루 3번 같은 문법 — 덱 폭발의 다른 얼굴 |
| 다시 찍기 정답 = 회복만 | 목업 `t0.js` 처럼 +1 | 오답 뒤 3판 만에 맞힌 건 진단 인식이지 회상이 아님. S 는 2일인데 3겹 「9일 뒤」 표시가 거짓이 됨 |
| 원장 + 파생 캐시 | mastery 만 저장 | 리듀서 버그·파라미터 변경·사전 버전 변경 때 재계산 불가 |
| 정수 rowid | ULID/UUID TEXT | 로컬 단일 사용자에 전역 유일성이 필요 없고 인덱스가 4배 작다. `lifer.id` 가 일련번호 역할 |
| 사용처 텍스트 미저장 | 스니펫 저장 | 크기 2배 + HEAD 와 어긋남. 은퇴 카드만 스냅샷 |
| 하루 경계 04:00 | 자정 | 밤 12시 넘겨 찍은 세션이 「내일 것」이 되어 오늘 스트릭·큐가 둘로 갈라지는 지원 티켓의 단골 |
| `unknown_count` 캐시 | 매번 계산 | 홈·큐가 4.5만 행 범위 조인을 매번 돌면 100ms 를 넘긴다(WebKit 에서 체감) |

---

## 위험과 완화

| 위험 | 신호 | 완화 |
|---|---|---|
| 복습 부채 — 2주 쉬고 돌아오니 만기 300 | `due ≤ eod` 개수 > 20 | 세션당 20장·R 낮은 순, 홈은 「오늘 20장」만 말한다. 3세션 연속 부채면 `desired_retention` 을 0.85 로 내리는 「부채 모드」 제안(설정) |
| 새 카드 폭주 | `new_per_day` 를 사용자가 10 으로 올림 | 상한 4 하드코딩 + 2 초과 시 「3주 뒤 복습이 하루 N장이 됩니다」 예측 표시 |
| 겹 인플레이션(조기 인쇄 연타) | `early=1` 비율 > 30 % | R2 가 막는다. 홈 「이 판 찍기」 문구가 「겹은 만기 뒤에만」을 명시 |
| 사전 버전 업으로 개념 id 변경 | `concept.is_retired` 증가 | id 는 불변 계약(03). 이름 변경은 새 id + `universal_id` 로 잇고 mastery 는 `migrations/` 의 alias 표로 복사 |
| 리포 리팩터링으로 사용처 소멸 | `is_alive=0` 급증 | 카드 은퇴 + 스냅샷, mastery 는 그대로. 같은 개념의 살아 있는 사용처가 있으면 카드 재생성 |
| FSRS 과적합 | 최적화 후 평균 간격 급변 | 1,000행 미만 최적화 금지, 최적화 결과가 기본 대비 log-loss 개선 < 2 % 면 채택 안 함, 이전 행은 비활성으로 보존해 롤백 |
| 리듀서와 캐시 불일치 | `rebuild_mastery()` ≠ `mastery` | 릴리스 테스트 + 앱 시작 시 최근 50개 개념 표본 검증, 불일치면 전체 재생 |
| T1 예상 시간 오차 → 예산 붕괴 | `elapsed_s / est_min` > 1.6 | `est_min_ema` 실측 반영, T1 은 예산 남을 때만 |
| 시간대 이동 | `tz` ≠ OS tz | 원장 `day_key` 박제, 설정에서 바꾸기 전엔 유지, 바꾸면 그 순간부터만 적용 |
| DB 손상 | `PRAGMA integrity_check` 실패 | WAL + 시작 시 일 1회 `VACUUM INTO` 백업(06), 원장만 있으면 전부 재생 가능 |
| LIFER 의식 누락 | `shown_at IS NULL` 누적 | 요약 화면이 미표시 lifer 를 모아 보여준다 |

---

## 열린 질문 / 결정 요청

1. **다시 찍기 정답의 겹** — → 결정 D3: 회복만(문서안 채택), 목업 수정은 05. — 목업 `t0.js` 는 `lyFrom+1`, 본 문서는 회복만(R3·R4). 「시간을 두고」 규칙을 따르면 회복만이 맞다. 결정 요청: 문서안 채택 시 목업 수정(05).
2. **모르겠어요 → FSRS Again** — → 결정 D3: Again. — 맞힌 뒤 눌러도 Again 으로 S 를 깎는다. 대안은 Hard. 「인쇄가 오늘로 당겨지는 것이 이득」 문구와 일치하므로 Again 을 제안.
3. **T1·T2 의 숙련도 개념 키** — → 결정 D27. — T1 「LoginForm 필사」·T2 「cart/ 폴더 책임」이 붙을 패턴·구조 개념(`react/form-submit-handler`, `arch/feature-folder-responsibility`)이 문법 사전에 있어야 한다(03). 없으면 카드별 임시 개념이 되어 전역 mastery 원칙이 깨진다.
4. **부수 개념 암묵 복습** — → 결정 D27: 반영 안 함. — T1 필사가 스치는 T0 개념에 FSRS 를 반영할지. 본 문서는 반영 안 함(홈 거짓말 방지). 반영한다면 등급 없이 `due_at` 만 +1일 미루는 약한 형태 제안.
5. **하루 경계 04:00 vs 00:00**, **예산 기본 13분**, **새 판 4장** — 설정 기본값 확인 요청. → 결정 D12: 04:00 · 15분 · 2장.
6. **개인화 임계 1,000행** — → 결정 D9: 개인화는 MVP 밖. — 첫 최적화가 6주 뒤. 더 이르게 원하면 500행 + 보수적 블렌딩(기본 0.5 : 최적 0.5).
7. **선행이 이 리포에 없는 개념** — → 결정: 02 안 채택 + E-4 합성 예제는 04 §1.4 `no-plate` 와 §6.2 대로 MVP 포함. — 본 문서는 「막지 않음 + 사다리에 판 없음 표시」. E-4 합성 예제를 MVP 에 넣을지(카드 생성기 범위, 03·04).
8. **SQLite 수학 함수** — → 결정: TS 계산(Rust 함수 등록 안 함). — R 계산을 SQL 에서 하려면 `SQLITE_ENABLE_MATH_FUNCTIONS` 필요. 본 문서는 TS 계산으로 회피. Rust 에 `fsrs_r(S, elapsed)` 스칼라 함수를 등록할지(01).
9. **테이블 이름과 스니펫 저장 (01 과 불일치)** — → 결정 D2: 단수형, `excerpt` 채택, `capture`·`commit_file` 추가. — 01 은 `files·captures·imports·commits·commit_files·sessions`(복수형) 와 `captures.excerpt ≤ 200자` 저장을 전제한다. 본 문서는 단수형 `file·concept_site·git_commit·session` 이고 사용처 텍스트를 저장하지 않는다(§2.3 크기 이유). 이름은 한쪽으로 통일해야 하고, `excerpt` 는 사다리 3단이 파일 읽기 없이 그려지는 이점이 있으므로 **`concept_site.excerpt TEXT`(≤ 200자, 선택)** 를 추가하는 절충을 제안한다(+9 MB 허용 여부 결정). `imports`·`commit_files` 는 03/04 가 필요로 하면 같은 원칙(인제스트 산출, 재생성 가능)으로 추가한다.
10. **`appeal`(02) vs `disputes`(04)** — → 결정 D4: `appeal` 로 통일. — 같은 테이블이다. 이름 하나로 통일 요청(본 문서는 T1·T2 를 한 테이블에 두므로 `appeal` 을 제안).
11. **`unknown_count` 산출 시점** — → 결정 D24. — 03 은 Rust 가 `lineConcepts` 를 Site 에 실어 주고 `uncoveredRatio > 0.5` 면 +1 을 더한다. 본 문서의 SQL 겹침 조회(§6.1)와 결과는 같아야 하며, 재계산 시점은 「세션 종료 후 증분」(02) 으로 확정 요청. `uncoveredRatio` 는 `concept_site` 에 열 추가가 필요하다.

---

## 구현 체크리스트

- [ ] 마이그레이션 러너 — Rust `user_version` 순차 적용·백업·상위 버전 거부, `0001_init.sql` 적용 (선행: 01 IPC 형태)
- [ ] `db/sql` + `fromRow` 계층 — 테이블별 변환기·zod 스키마·트랜잭션 헬퍼, 왕복 테스트 (선행: 마이그레이션 러너)
- [ ] 하루 경계·시각 유틸 — `dayKey`·`endOfDay`·`labelFor(due)`, 시간대·04:00 경계 테스트 (선행: 없음)
- [ ] FSRS 어댑터 — `ts-fsrs` 래핑, 등급 매핑 §3.2, `scheduler_params` 활성 행 로드, 궤적 검산 테스트(1.2→3.8→11→30) (선행: 시각 유틸)
- [ ] 겹 리듀서 — `beginDay`·`applyOutcome`·`shownLayer`, §3.3 검산 6건을 테스트로 (선행: FSRS 어댑터)
- [ ] 판 완료 트랜잭션 — `review_log`→`mastery`→`session_item`→`lifer`→`dunno_event` 연결, 트랙별 `detail_json` (선행: 리듀서, 04 채점 결과 형태)
- [ ] `rebuild_mastery()` — 원장 재생 = 캐시 검증, 시작 시 표본 검증 (선행: 판 완료 트랜잭션)
- [ ] 미지 개념 계산 — known 집합·전이(3겹)·증분 재계산·`gap` 갱신 (`unknownCount` 함수 자체는 03 항목) (선행: 03 concept_site 채움)
- [ ] 새 개념 순위 — 위상 정렬·후보 SQL·`bestSite`·level 규칙·초보 감지 플래그 (선행: 미지 개념 계산)
- [ ] 큐 플래너 — §5.3 전체, 예산 맞추기, 순서, 빈 상태, 하루 여러 세션 (선행: 새 개념 순위, FSRS 어댑터)
- [ ] 세션 중 삽입·복구 — `insertRetry`·`insertPrereq`·`shiftPos`·Esc 저장·다음 날 폐기 (선행: 큐 플래너)
- [ ] 홈·요약·사다리 쿼리 — §7 SQL 을 이름 붙여 노출, fade 적용, 노드 상태 계산 (선행: db/sql 계층)
- [ ] 이의·LIFER 처리 — `appeal` 기록·내보내기(04 회귀 입력), `lifer.shown_at` 요약 표시 (선행: 판 완료 트랜잭션)
- [ ] FSRS 개인화 잡 — **MVP 이후 · TS 우선**: `ts-fsrs` 옵티마이저 가용성 확인 뒤 주 1회 최적화, 채택 기준·롤백 (선행: 원장 1,000행 이상)
