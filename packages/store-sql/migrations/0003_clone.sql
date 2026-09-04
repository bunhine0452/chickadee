-- 0003_clone.sql — user_version = 3
-- 클론 코스 (D120). 코스는 일일 큐 **밖**의 별도 모드다 — 예산(D12)도 하루 새 판 상한도
-- 건드리지 않고 결과만 원장을 거쳐 개념 겹에 반영한다.
--
-- 새 표 둘뿐이고 기존 열은 하나도 손대지 않는다. 02 §2.2 의 「원장은 추가만
-- (ALTER … ADD COLUMN)」을 어기지 않는 대신 원장의 모양을 그대로 받는다:
--
--   * `review_log.session_id`·`session_item_id` 가 NOT NULL 이다. 그래서 큐 밖 모드라도
--     **코스 실행마다 `session` 한 행 + 조각마다 `session_item` 한 행**을 만든다.
--   * `session_item.role` 은 CHECK 목록(review·new·retry·prereq·manual·gap)에 갇혀 있고
--     SQLite 는 CHECK 를 ALTER 로 못 고친다. 새 값을 만들지 않고 목록 안의 `manual` 을 쓴다.
--   * 그러면 원장에서 코스를 가려낼 열이 없어지므로 **코스 소속은 `clone_step.review_log_id`**
--     로 가른다 — 어떤 원장 행을 코스가 썼는지는 이 열이 유일한 답이다.

PRAGMA user_version = 3;

CREATE TABLE clone_run (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id      INTEGER NOT NULL REFERENCES repo(id),
  -- 원장 제약이 강제하는 열이다. 코스 실행 하나 = `session` 한 행이고, 그 세션은 처음부터
  -- `done` 으로 태어난다 — `session.open_today`·`open_any` 가 코스 세션을 「이어 찍을
  -- 세션」으로 집으면 일일 큐가 코스 판을 찍는다.
  session_id   INTEGER NOT NULL REFERENCES session(id),
  mode         TEXT    NOT NULL CHECK (mode IN ('commit','dep')),
  scope        TEXT    NOT NULL CHECK (scope IN ('repo','unit')),
  unit_id      INTEGER REFERENCES unit(id),
  status       TEXT    NOT NULL CHECK (status IN ('active','paused','done','abandoned')),
  order_json   TEXT    NOT NULL,           -- 목차 = 파일 순서. 조각은 파일을 열 때 잘린다
  started_at   INTEGER NOT NULL,
  finished_at  INTEGER,
  CHECK ((scope = 'unit') = (unit_id IS NOT NULL))
);
CREATE INDEX ix_clone_run_repo ON clone_run(repo_id, started_at);

CREATE TABLE clone_step (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id          INTEGER NOT NULL REFERENCES clone_run(id) ON DELETE CASCADE,
  -- `seq` 는 목차에서 그 **파일**의 자리(0부터), `part` 는 파일 안 조각의 자리(0부터)다.
  -- 조각 수는 원문을 읽어 봐야 알므로 목차를 계산하는 시점에는 전역 번호를 매길 수 없다
  -- (지연 생성). 정렬은 언제나 `ORDER BY seq, part` 다.
  seq             INTEGER NOT NULL,
  part            INTEGER NOT NULL DEFAULT 0,
  file_id         INTEGER NOT NULL REFERENCES file(id),
  -- 조각을 잘라 낸 원본 블록 (D92). `card.payload.blockId` 가 이 값이고, 판을 마칠 때
  -- `block.ast_json` 캐시와 `why_answer.block_id` 를 되찾는 열쇠다 — `card` 에는 블록을
  -- 가리키는 열이 없다.
  block_id        INTEGER NOT NULL REFERENCES block(id),
  -- 조각 **본문**의 파일 줄 범위(1-based, 양끝 포함). 시그니처·닫힘은 조각마다 되풀이되므로
  -- 범위 밖이다 — `segment()` 의 `lineStart`·`lineEnd` 를 그대로 옮긴다.
  line_start      INTEGER NOT NULL,
  line_end        INTEGER NOT NULL,
  -- 조각 원문의 해시. 재인제스트로 파일이 바뀌면 어긋나고 그 조각은 다시 잘린다.
  text_hash       TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','active','done','skipped','stale')),
  pct             REAL,
  elapsed_s       INTEGER NOT NULL DEFAULT 0,
  draft_text      TEXT,
  session_item_id INTEGER REFERENCES session_item(id),
  review_log_id   INTEGER REFERENCES review_log(id),
  done_at         INTEGER,
  UNIQUE (run_id, seq, part)
);
CREATE INDEX ix_clone_step_run ON clone_step(run_id, status);
