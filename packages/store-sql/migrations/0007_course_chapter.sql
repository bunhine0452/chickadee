-- 0007_course_chapter.sql — user_version = 7
-- 코스: 기능 하나가 챕터 하나, 그 안이 다섯 단 (D162 · `docs/program/mastery.md`).
--
-- 앱은 간격 반복 플래시카드였고 진도를 잉크 겹으로 쟀다. 사용자가 물은 것은 그 종류가
-- 아니었다 — 「로그인 기능은 **어떻게 이루어지며**」. 낱장 파지가 아니라 **한 기능을
-- 어디까지 이해했는가**를 재야 하고, 그 축이 `stage_reached` 다.
--
-- **겹과 FSRS 를 버리지 않는다.** `mastery`·`review_log` 는 한 열도 안 바뀐다 — 1·2단의
-- 어휘 판정기로 그대로 남는다. 여기 더하는 것은 그 위의 축 하나다.
--
-- `chapter` 를 `unit` 과 1:1 로 두는 이유: 챕터는 기능이고 기능은 이미 `unit` 이다
-- (D160 이 `entryUnits` 로 세운 것). 새 정체성을 만들면 `unit_file`·`unit_node` 가
-- 가리킬 곳이 둘이 된다. `unit.source` 의 CHECK 를 넓히는 대신 `origin` 을 여기 둔 것도
-- 같은 이유다 — 0005 가 겪은 「외래키 끄고 아홉 표 확인」(D146)을 다시 부르지 않는다.

PRAGMA user_version = 7;

-- 챕터 진도. `unit` 과 1:1.
CREATE TABLE chapter (
  unit_id        INTEGER PRIMARY KEY REFERENCES unit(id) ON DELETE CASCADE,
  -- 이 챕터가 어디서 나왔나 — 기능 폐포냐 디렉터리 규칙이냐 (D160 의 `planUnits`).
  origin         TEXT    NOT NULL CHECK (origin IN ('entry','dir')),
  -- 0 = 아직 · 1~5 = 읽기·추적·예측·수정·재구현. 통과 필수는 3 까지다.
  -- 5 를 게이트에 안 넣는 이유는 `t3_run` 이 `NOT_IMPLEMENTED` 라서다 — 실행 없이
  -- 재구현을 채점하면 이해가 아니라 필사를 재게 된다.
  stage_reached  INTEGER NOT NULL DEFAULT 0 CHECK (stage_reached BETWEEN 0 AND 5),
  passed_at      INTEGER,
  -- 재검 일정. `mastery` 와 **같은 열 이름**이라 `fsrs.ts` 를 그대로 부른다 (새 알고리즘 0).
  state          INTEGER NOT NULL DEFAULT 0 CHECK (state IN (0,1,2,3)),
  stability      REAL,
  difficulty     REAL,
  due_at         INTEGER,
  last_review_at INTEGER,
  reps           INTEGER NOT NULL DEFAULT 0,
  lapses         INTEGER NOT NULL DEFAULT 0,
  deferred_day   TEXT,                        -- 세 번 막혀 접은 날 (day_key)
  applied_log_id INTEGER NOT NULL DEFAULT 0,  -- 재생 커서
  updated_at     INTEGER NOT NULL
);
CREATE INDEX ix_chapter_due ON chapter(due_at) WHERE state <> 0;

-- 단 하나를 판정한 순간. `review_log` 의 챕터판이고 같은 원장 규약을 따른다.
CREATE TABLE stage_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id      INTEGER NOT NULL REFERENCES unit(id),
  session_id   INTEGER NOT NULL REFERENCES session(id),
  stage        INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 5),
  kind         TEXT    NOT NULL CHECK (kind IN ('first','recheck')),
  asked        INTEGER NOT NULL,
  correct      INTEGER NOT NULL,
  passed       INTEGER NOT NULL CHECK (passed IN (0,1)),
  grade        INTEGER CHECK (grade IN (1,2,3)),  -- 재검만. FSRS 로 간다
  elapsed_days REAL    NOT NULL DEFAULT 0,
  reviewed_at  INTEGER NOT NULL,
  day_key      TEXT    NOT NULL,               -- 쓰는 순간 박제 (`review_log` 와 같은 규약)
  duration_ms  INTEGER NOT NULL,
  detail_json  TEXT    NOT NULL
);
CREATE INDEX ix_stage_unit ON stage_log(unit_id, reviewed_at);
CREATE INDEX ix_stage_session ON stage_log(session_id);
