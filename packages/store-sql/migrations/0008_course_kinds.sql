-- 0008_course_kinds.sql — user_version = 8
-- 코스 문항 16유형 (D164 · `docs/program/exercises.md` §5).
--
-- 다섯 단의 문항이 앉을 자리가 원장에 없었다. `card.kind` 의 CHECK 가 열둘이라 새 다섯
-- (`twin`·`origin`·`cut`·`reorder`·`contract`)이 저장되지 않고, 챕터의 단을 적을 열이 없고,
-- `appeal.track` 이 `('t1','t2')` 라 4·5단(`t3`)의 이의가 저장되지 않았다.
--
-- 셋을 한 이행에서 한다. 표를 다시 만드는 길은 0005 그대로다 (D146) — SQLite 는 CHECK 를
-- ALTER 하지 못하고, 표를 다시 만들려면 러너가 루프 밖에서 외래키를 꺼야 한다. `card` 를
-- 참조하는 아홉 표와 `appeal` 을 참조하는 표(없다)의 행은 그대로 남는다.
--
-- `stage_no` 가 NULL 이면 예전 카드다 — 큐가 보던 판 그대로다. 코스 카드는 `track = 't3'`
-- 에 앉으므로 t0·t1·t2 큐의 SQL 은 한 줄도 바뀌지 않는다.

PRAGMA user_version = 8;

CREATE TABLE card_new (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id        INTEGER NOT NULL REFERENCES repo(id),
  unit_id        INTEGER REFERENCES unit(id),
  track          TEXT    NOT NULL CHECK (track IN ('t0','t1','t2','t3')),
  kind           TEXT    NOT NULL CHECK (kind IN ('meaning','blank','point','transcribe','placement','radius','flow','direction','entry','role','repair','reimpl','twin','origin','cut','reorder','contract')),
  concept_id     TEXT    NOT NULL REFERENCES concept(id),
  level          INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  site_id        INTEGER REFERENCES concept_site(id),
  file_id        INTEGER REFERENCES file(id),
  commit_id      INTEGER REFERENCES git_commit(id),
  payload_json   TEXT    NOT NULL,
  snapshot_json  TEXT,
  gen_version    INTEGER NOT NULL DEFAULT 1,
  content_hash   TEXT    NOT NULL,
  created_at     INTEGER NOT NULL,
  retired_at     INTEGER,
  -- 코스의 단 1~5. NULL 이면 코스 밖의 판이다. `card_state.stage`(T1 페이딩 1~3)와 다른 축이다.
  stage_no       INTEGER CHECK (stage_no BETWEEN 1 AND 5),
  UNIQUE (repo_id, content_hash)
);

INSERT INTO card_new (id, repo_id, unit_id, track, kind, concept_id, level, site_id, file_id,
                      commit_id, payload_json, snapshot_json, gen_version, content_hash,
                      created_at, retired_at)
SELECT id, repo_id, unit_id, track, kind, concept_id, level, site_id, file_id,
       commit_id, payload_json, snapshot_json, gen_version, content_hash,
       created_at, retired_at
FROM card;

DROP TABLE card;
ALTER TABLE card_new RENAME TO card;

CREATE INDEX ix_card_pick ON card(repo_id, concept_id, track, level, retired_at);
CREATE INDEX ix_card_stage ON card(unit_id, stage_no) WHERE stage_no IS NOT NULL;

-- 이의 — 4·5단은 t3 다.
CREATE TABLE appeal_new (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  review_log_id   INTEGER NOT NULL REFERENCES review_log(id),
  card_id         INTEGER NOT NULL REFERENCES card(id),
  track           TEXT    NOT NULL CHECK (track IN ('t1','t2','t3')),
  line_no         INTEGER,
  original_text   TEXT,
  user_text       TEXT,
  norm_original   TEXT,
  norm_user       TEXT,
  auto_verdict    TEXT    NOT NULL,
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

INSERT INTO appeal_new (id, review_log_id, card_id, track, line_no, original_text, user_text,
                        norm_original, norm_user, auto_verdict, auto_reason, reasons_json,
                        pattern_key, engine_version, dict_version, status, created_at,
                        resolved_at, note)
SELECT id, review_log_id, card_id, track, line_no, original_text, user_text,
       norm_original, norm_user, auto_verdict, auto_reason, reasons_json,
       pattern_key, engine_version, dict_version, status, created_at,
       resolved_at, note
FROM appeal;

DROP TABLE appeal;
ALTER TABLE appeal_new RENAME TO appeal;

CREATE INDEX ix_appeal_status ON appeal(status);
CREATE INDEX ix_appeal_pattern ON appeal(pattern_key, status);
