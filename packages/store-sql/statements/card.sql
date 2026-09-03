-- 판(카드) 원장 (02 §2.2 `card`·`card_state`). 생성은 `@chickadee/cards`, 저장은 여기.
-- 열 별칭을 붙이지 않는다 (D57).

-- 카드 한 장. `content_hash` 가 같으면 이미 있는 것을 쓴다 (같은 사용처·같은 시드 = 같은 판).
-- upsert 로 만들지 않는 이유: UPDATE 경로를 타면 `lastId` 가 직전 INSERT 의 것이라 거짓말을 한다.
-- 넣은 뒤에는 언제나 `card.by_hash` 로 되찾는다.
-- @name card.insert
-- @params { repoId: number, unitId: number | null, track: string, kind: string, conceptId: string, level: number, siteId: number | null, fileId: number | null, commitId: number | null, payloadJson: string, genVersion: number, contentHash: string, createdAt: number }
-- @row void
INSERT INTO card (repo_id, unit_id, track, kind, concept_id, level, site_id, file_id,
                  commit_id, payload_json, gen_version, content_hash, created_at)
VALUES (:repoId, :unitId, :track, :kind, :conceptId, :level, :siteId, :fileId,
        :commitId, :payloadJson, :genVersion, :contentHash, :createdAt)
ON CONFLICT (repo_id, content_hash) DO NOTHING;

-- @name card.by_hash
-- @params { repoId: number, contentHash: string }
-- @row { id: number, repo_id: number, unit_id: number | null, track: string, kind: string, concept_id: string, level: number, site_id: number | null, file_id: number | null, commit_id: number | null, payload_json: string, snapshot_json: string | null, gen_version: number, content_hash: string, created_at: number, retired_at: number | null }
SELECT id, repo_id, unit_id, track, kind, concept_id, level, site_id, file_id, commit_id,
       payload_json, snapshot_json, gen_version, content_hash, created_at, retired_at
FROM card WHERE repo_id = :repoId AND content_hash = :contentHash;

-- 세션이 거는 판 하나. 카드 payload 는 여기서만 읽는다 — 카드 전환에 IPC 가 없도록
-- 세션 시작 때 `session.items` 로 한 번에 긷는다 (05 §10).
-- @name card.get
-- @params { id: number }
-- @row { id: number, repo_id: number, unit_id: number | null, track: string, kind: string, concept_id: string, level: number, site_id: number | null, file_id: number | null, commit_id: number | null, payload_json: string, snapshot_json: string | null, gen_version: number, content_hash: string, created_at: number, retired_at: number | null }
SELECT id, repo_id, unit_id, track, kind, concept_id, level, site_id, file_id, commit_id,
       payload_json, snapshot_json, gen_version, content_hash, created_at, retired_at
FROM card WHERE id = :id;

-- 카드 인스턴스 상태 (02 `card_state`). 판을 마칠 때마다 갱신한다.
-- @name card.state_upsert
-- @params { cardId: number, prints: number, stage: number, lastPct: number | null, estMinEma: number | null, lastPrintedAt: number | null }
-- @row void
INSERT INTO card_state (card_id, prints, stage, last_pct, est_min_ema, last_printed_at)
VALUES (:cardId, :prints, :stage, :lastPct, :estMinEma, :lastPrintedAt)
ON CONFLICT (card_id) DO UPDATE SET
  prints = excluded.prints, stage = excluded.stage, last_pct = excluded.last_pct,
  est_min_ema = excluded.est_min_ema, last_printed_at = excluded.last_printed_at;

-- @name card.state_get
-- @params { cardId: number }
-- @row { card_id: number, prints: number, stage: number, last_pct: number | null, est_min_ema: number | null, last_printed_at: number | null, is_suspended: number }
SELECT card_id, prints, stage, last_pct, est_min_ema, last_printed_at, is_suspended
FROM card_state WHERE card_id = :cardId;

-- 「판이 없는 문법」에서 판을 만들면 그 구멍은 닫힌다 (02 `gap.status`).
-- @name card.gap_close
-- @params { repoId: number, conceptId: string, status: string }
-- @row void
UPDATE gap SET status = :status WHERE repo_id = :repoId AND concept_id = :conceptId;

-- 생성 불가 사유를 구멍에 적는다 (04 §1.4 `no-plate`).
-- @name card.gap_reason
-- @params { repoId: number, conceptId: string, reason: string | null }
-- @row void
UPDATE gap SET reason = :reason WHERE repo_id = :repoId AND concept_id = :conceptId;
