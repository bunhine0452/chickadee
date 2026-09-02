-- 0001_init.sql — user_version = 1
-- 정본: docs/02-data-model-and-scheduling.md §2.2. 이 파일이 스키마의 유일한 출처다.
-- 러너(crates/store)가 파일 하나를 한 트랜잭션으로 적용하고 user_version 을 직접 세운다.
-- 원장 테이블은 추가만(ALTER … ADD COLUMN). 파생 테이블은 DROP + 재생성이 허용된다.

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
