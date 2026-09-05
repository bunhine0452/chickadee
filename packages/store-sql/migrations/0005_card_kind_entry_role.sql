-- 0005_card_kind_entry_role.sql — user_version = 5
-- 리포 지도 문제 두 종 (D142). `card.kind` 의 CHECK 가 여섯 값만 허용해서 `entry`·`role`
-- 카드가 원장에 들어가지 못했다 — 생성기는 만드는데 저장이 거부되는 상태였다.
--
-- SQLite 는 CHECK 를 ALTER 하지 못한다. 표를 다시 만드는 수밖에 없고, 그러려면
-- **외래키를 꺼야 한다** — `DROP TABLE` 을 「모든 행을 지운다」로 다루므로 켜 둔 채
-- 지우면 `card` 를 참조하는 아홉 표의 행이 ON DELETE CASCADE 로 함께 사라진다.
-- `PRAGMA foreign_keys` 는 트랜잭션 안에서 무시되므로 이행 파일이 스스로 끌 수 없다.
-- 러너가 루프 밖에서 끄고 켜고, 끝나고 `foreign_key_check` 로 확인한다 (D146).
--
-- 두 가지를 먼저 재 보고 버렸다. `PRAGMA writable_schema` 로 `sqlite_schema` 를 고치는
-- 길은 「table sqlite_master may not be modified」로 막히고, `legacy_alter_table` 로
-- 이름만 바꾸는 길은 자식 표의 REFERENCES 가 옛 이름으로 다시 쓰이면서 행도 함께 날아간다.

PRAGMA user_version = 5;

CREATE TABLE card_new (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id        INTEGER NOT NULL REFERENCES repo(id),
  unit_id        INTEGER REFERENCES unit(id),
  track          TEXT    NOT NULL CHECK (track IN ('t0','t1','t2','t3')),
  kind           TEXT    NOT NULL CHECK (kind IN ('meaning','blank','point','transcribe','placement','radius','flow','direction','entry','role','repair','reimpl')),
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
