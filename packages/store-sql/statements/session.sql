-- 교정쇄(세션)와 그 안의 판 (02 §2.2 `session`·`session_item`, §5.5·§5.6).
-- 원장이 곧 큐다 (D10) — 블롭 상태가 따로 없고 이 두 테이블이 진행 상태의 전부다.
-- 열 별칭을 붙이지 않는다 (D57).

-- @name session.insert
-- @params { repoId: number, dayKey: string, seqInDay: number, startedAt: number, budgetMin: number, plannedMin: number, status: string, planJson: string }
-- @row void
INSERT INTO session (repo_id, day_key, seq_in_day, started_at, budget_min, planned_min, status, plan_json)
VALUES (:repoId, :dayKey, :seqInDay, :startedAt, :budgetMin, :plannedMin, :status, :planJson);

-- 오늘 이어 찍을 세션. `active`·`paused` 만 — 끝났거나 버려진 것은 돌려주지 않는다 (02 §5.6).
-- @name session.open_today
-- @params { repoId: number, dayKey: string }
-- @row { id: number, repo_id: number, day_key: string, seq_in_day: number, started_at: number, ended_at: number | null, budget_min: number, planned_min: number, elapsed_s: number, status: string, plan_json: string, lifer_shown: number }
SELECT id, repo_id, day_key, seq_in_day, started_at, ended_at, budget_min, planned_min,
       elapsed_s, status, plan_json, lifer_shown
FROM session
WHERE repo_id = :repoId AND day_key = :dayKey AND status IN ('active', 'paused')
ORDER BY seq_in_day DESC LIMIT 1;

-- @name session.get
-- @params { id: number }
-- @row { id: number, repo_id: number, day_key: string, seq_in_day: number, started_at: number, ended_at: number | null, budget_min: number, planned_min: number, elapsed_s: number, status: string, plan_json: string, lifer_shown: number }
SELECT id, repo_id, day_key, seq_in_day, started_at, ended_at, budget_min, planned_min,
       elapsed_s, status, plan_json, lifer_shown
FROM session WHERE id = :id;

-- 하루 여러 세션 — 다음 `seq_in_day` (02 §5.6).
-- @name session.next_seq
-- @params { repoId: number, dayKey: string }
-- @row { n: number }
SELECT COALESCE(MAX(seq_in_day), 0) + 1 AS n FROM session
WHERE repo_id = :repoId AND day_key = :dayKey;

-- 날이 바뀌면 어제의 미완 세션은 버린다 (02 §5.6). 완료 판의 로그는 이미 원장에 있다.
-- @name session.abandon_stale
-- @params { repoId: number, dayKey: string, at: number }
-- @row void
UPDATE session SET status = 'abandoned', ended_at = :at
WHERE repo_id = :repoId AND day_key < :dayKey AND status IN ('active', 'paused');

-- 버린 세션의 미완 항목도 함께 닫는다 — 그 카드들은 만기라 새 세션이 다시 집는다.
-- @name session.remove_stale_items
-- @params { repoId: number, dayKey: string }
-- @row void
UPDATE session_item SET status = 'removed'
WHERE status IN ('pending', 'active')
  AND session_id IN (SELECT id FROM session
                     WHERE repo_id = :repoId AND day_key < :dayKey AND status = 'abandoned');

-- @name session.update
-- @params { id: number, status: string, elapsedS: number, plannedMin: number, endedAt: number | null, liferShown: number }
-- @row void
UPDATE session SET status = :status, elapsed_s = :elapsedS, planned_min = :plannedMin,
                   ended_at = :endedAt, lifer_shown = :liferShown
WHERE id = :id;

-- ───────── 판 (session_item) ─────────

-- @name session.item_insert
-- @params { sessionId: number, pos: number, cardId: number, conceptId: string, track: string, role: string, estMin: number, parentItemId: number | null, createdAt: number }
-- @row void
INSERT INTO session_item (session_id, pos, card_id, concept_id, track, role, est_min,
                          parent_item_id, status, created_at)
VALUES (:sessionId, :pos, :cardId, :conceptId, :track, :role, :estMin,
        :parentItemId, 'pending', :createdAt);

-- 세션 한 벌 — 판 + 그 판이 걸 카드까지 한 번에. **카드 전환에 IPC 0회** 가 여기 걸려 있다 (05 §10).
-- @name session.items
-- @params { sessionId: number }
-- @row { id: number, session_id: number, pos: number, card_id: number, concept_id: string, track: string, role: string, est_min: number, parent_item_id: number | null, status: string, elapsed_s: number, state_json: string | null, review_log_id: number | null, created_at: number, kind: string, level: number, site_id: number | null, payload_json: string, name_ko: string, token: string | null, layer: number }
SELECT i.id, i.session_id, i.pos, i.card_id, i.concept_id, i.track, i.role, i.est_min,
       i.parent_item_id, i.status, i.elapsed_s, i.state_json, i.review_log_id, i.created_at,
       k.kind, k.level, k.site_id, k.payload_json,
       c.name_ko, c.token, COALESCE(m.layer, 0) AS layer
FROM session_item i
JOIN card k ON k.id = i.card_id
JOIN concept c ON c.id = i.concept_id
LEFT JOIN mastery m ON m.concept_id = i.concept_id
WHERE i.session_id = :sessionId
ORDER BY i.pos;

-- 05 §3 의 저장 5시점이 부르는 것 — 판 하나의 진행.
-- @name session.item_save
-- @params { id: number, status: string, elapsedS: number, stateJson: string | null }
-- @row void
UPDATE session_item SET status = :status, elapsed_s = :elapsedS, state_json = :stateJson
WHERE id = :id;

-- 판을 마칠 때 원장 행을 잇는다 (02 §8.1 「판 완료」 3번).
-- @name session.item_link_log
-- @params { id: number, reviewLogId: number, status: string, elapsedS: number, stateJson: string | null }
-- @row void
UPDATE session_item SET review_log_id = :reviewLogId, status = :status,
                        elapsed_s = :elapsedS, state_json = :stateJson
WHERE id = :id;

-- 세션 중 삽입 (02 §5.5). `UNIQUE(session_id,pos)` 때문에 한 문장으로 밀 수 없다 —
-- SQLite 는 UPDATE 를 행마다 검사하므로 `pos=p → p+1` 이 아직 살아 있는 `p+1` 과 부딪힌다.
-- 문서의 「역순 UPDATE」는 `SQLITE_ENABLE_UPDATE_DELETE_LIMIT` 빌드에서만 되는 `ORDER BY` 를
-- 요구한다. 대신 **음수로 옮겼다 되돌린다** — 기존 pos 는 전부 0 이상이라 절대 부딪히지 않는다.
-- @name session.shift_park
-- @params { sessionId: number, from: number }
-- @row void
UPDATE session_item SET pos = -(pos + 1)
WHERE session_id = :sessionId AND pos >= :from;

-- @name session.shift_unpark
-- @params { sessionId: number }
-- @row void
UPDATE session_item SET pos = -pos WHERE session_id = :sessionId AND pos < 0;

-- @name session.item_count
-- @params { sessionId: number }
-- @row { n: number }
SELECT COUNT(*) AS n FROM session_item WHERE session_id = :sessionId;

-- 같은 판의 다시 찍기가 이미 뒤에 있으면 또 만들지 않는다 (02 §5.5 `hasPendingRetry`).
-- @name session.pending_retry
-- @params { sessionId: number, cardId: number, pos: number }
-- @row { n: number }
SELECT COUNT(*) AS n FROM session_item
WHERE session_id = :sessionId AND card_id = :cardId AND role = 'retry'
  AND pos > :pos AND status = 'pending';

-- 아래층에서 `B` 로 올라가면 그 판은 지운다 (02 §4 「아래층에서 B」).
-- @name session.item_remove
-- @params { id: number }
-- @row void
UPDATE session_item SET status = 'removed' WHERE id = :id;
