-- 0009_paths_schema_dead.sql — user_version = 9
-- 메서드 단위 요청 줄기 · 스키마 · 죽은 갈래 (D168 · D169).
--
-- 2단 추적이 묻는 「버튼을 누르면 어느 파일 어느 줄이 순서대로 도나」의 정답지가 원장에
-- 없었다 — `import_edge` 는 파일 대 파일이고 줄이 없다. 줄기는 인제스트가 캡처로 세워
-- 여기 쓴다. 칸 하나가 (파일, 줄 범위)라 챕터가 「이 파일의 이 줄들만」을 보여 줄 수 있다 —
-- `unit_file` 은 그대로 파일 단위이고, 범위는 이 표에서 읽는다.
--
-- 스키마는 `.sql` 의 DDL 과 매퍼 XML 의 `<resultMap>` 에서 온다. 표·열·외래키·열↔필드 대응이
-- 3단 `origin`(「이 값은 어디서 처음 정해지나」)의 정답지다.
--
-- 죽은 갈래는 **지우지 않고 표시만** 한다 — 앱이 답을 모르는 마지막 문항(졸업 과제)의 재료다.
--
-- 새 표만 더한다. 기존 표는 한 열도 안 바뀐다.

PRAGMA user_version = 9;

-- ───────── 요청 줄기 ─────────

CREATE TABLE request_path (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id       INTEGER NOT NULL REFERENCES repo(id),
  -- 이 줄기가 속한 기능. 진입 파일이 대지에 든 것으로 정한다. 없으면 NULL.
  unit_id       INTEGER REFERENCES unit(id) ON DELETE SET NULL,
  -- 프론트(또는 서버)가 HTTP 를 부른 자리. 호출 자리마다 줄기 하나다 (D162).
  entry_file_id INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  entry_line    INTEGER NOT NULL,
  label         TEXT    NOT NULL,             -- 'POST /api/auth/login'
  hop_count     INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  UNIQUE (repo_id, entry_file_id, entry_line)
);

CREATE TABLE request_hop (
  path_id     INTEGER NOT NULL REFERENCES request_path(id) ON DELETE CASCADE,
  ord         INTEGER NOT NULL,               -- 실행 순서 (깊이 우선)
  file_id     INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,               -- 함수·메서드·매퍼 문의 이름
  line_start  INTEGER NOT NULL,
  line_end    INTEGER NOT NULL,
  called_line INTEGER,                        -- 앞 칸에서 이 칸을 부른 줄. 맨 위 칸은 NULL
  depth       INTEGER NOT NULL,               -- 맨 위 0
  kind        TEXT    CHECK (kind IN ('call','http','mapper')),  -- 들어온 간선. 맨 위 칸은 NULL
  PRIMARY KEY (path_id, ord)
);
CREATE INDEX ix_hop_file ON request_hop(file_id);

-- ───────── 스키마 ─────────

CREATE TABLE db_table (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id INTEGER NOT NULL REFERENCES repo(id),
  name    TEXT    NOT NULL,
  file_id INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,  -- DDL 이 있는 파일
  line    INTEGER NOT NULL,
  UNIQUE (repo_id, name)
);

CREATE TABLE db_column (
  table_id      INTEGER NOT NULL REFERENCES db_table(id) ON DELETE CASCADE,
  ord           INTEGER NOT NULL,
  name          TEXT    NOT NULL,
  type          TEXT    NOT NULL,             -- DDL 에 적힌 그대로
  not_null      INTEGER NOT NULL CHECK (not_null IN (0,1)),
  default_value TEXT,
  line          INTEGER NOT NULL,
  PRIMARY KEY (table_id, name)
);

CREATE TABLE db_fk (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id    INTEGER NOT NULL REFERENCES db_table(id) ON DELETE CASCADE,
  column_name TEXT    NOT NULL,
  ref_table   TEXT    NOT NULL,
  ref_column  TEXT    NOT NULL,
  line        INTEGER NOT NULL,
  UNIQUE (table_id, column_name, ref_table, ref_column)
);

-- 매퍼의 `<result property="loginId" column="login_id"/>` 한 줄 — 열 ↔ 자바 필드.
CREATE TABLE db_binding (
  repo_id        INTEGER NOT NULL REFERENCES repo(id),
  file_id        INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,  -- 매퍼 XML
  line           INTEGER NOT NULL,
  column_name    TEXT    NOT NULL,
  property       TEXT    NOT NULL,
  entity         TEXT    NOT NULL,             -- `<resultMap type="…">` 의 FQCN
  entity_file_id INTEGER REFERENCES file(id) ON DELETE SET NULL,
  table_id       INTEGER REFERENCES db_table(id) ON DELETE SET NULL,  -- 열이 한 표에만 있을 때
  PRIMARY KEY (file_id, line, column_name)
);

-- ───────── 죽은 갈래 ─────────

CREATE TABLE dead_branch (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id INTEGER NOT NULL REFERENCES repo(id),
  kind    TEXT    NOT NULL CHECK (kind IN ('unreached-call','uncalled-route','uncalled-export','orphan-file')),
  file_id INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  line    INTEGER,                            -- 파일 단위면 NULL
  label   TEXT    NOT NULL                    -- 라우트 · 함수 이름 · 파일 이름
);
CREATE INDEX ix_dead_repo ON dead_branch(repo_id, kind);
