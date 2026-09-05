-- 챕터 진도와 단 원장 (D165 · `docs/program/mastery.md` §3·§4·§6.2).
-- 「단 하나 판정」 한 트랜잭션이 이 파일의 이름들로 쓰인다: stage.append → chapter.apply_last.
-- 열 별칭을 붙이지 않는다 (D57) — 행 변환기가 DDL 열 이름으로 읽는다.

-- 챕터 한 장. `unit` 과 1:1 이라 기본키가 `unit_id` 다.
-- @name chapter.get
-- @params { unitId: number }
-- @row { unit_id: number, origin: string, stage_reached: number, passed_at: number | null, state: number, stability: number | null, difficulty: number | null, due_at: number | null, last_review_at: number | null, reps: number, lapses: number, deferred_day: string | null, applied_log_id: number, updated_at: number }
SELECT unit_id, origin, stage_reached, passed_at, state, stability, difficulty, due_at,
       last_review_at, reps, lapses, deferred_day, applied_log_id, updated_at
FROM chapter WHERE unit_id = :unitId;

-- 코스 전체. `unit.order_idx` 가 챕터 번호다 (D162 — 인제스트가 코스 순서로 쓴다).
-- @name chapter.list
-- @params { repoId: number }
-- @row { unit_id: number, name: string, order_idx: number, origin: string, stage_reached: number, passed_at: number | null, state: number, stability: number | null, difficulty: number | null, due_at: number | null, last_review_at: number | null, reps: number, lapses: number, deferred_day: string | null, applied_log_id: number, updated_at: number }
SELECT c.unit_id, u.name, u.order_idx, c.origin, c.stage_reached, c.passed_at, c.state,
       c.stability, c.difficulty, c.due_at, c.last_review_at, c.reps, c.lapses,
       c.deferred_day, c.applied_log_id, c.updated_at
FROM chapter c JOIN unit u ON u.id = c.unit_id
WHERE u.repo_id = :repoId
ORDER BY u.order_idx, u.name;

-- 만기 재검. **같은 날 두 번 안 낸다** — 그러면 `stage_log.elapsed_days` 가 0 이 되고
-- 「시간을 두고」(EVALS L2)가 재검에서 무너진다. `state <> 0` 은 아직 한 번도 통과 못 한
-- 챕터를 거른다 — 재검은 통과한 챕터의 것이다.
-- @name chapter.due
-- @params { repoId: number, now: number, dayKey: string }
-- @row { unit_id: number, name: string, order_idx: number, stage_reached: number, due_at: number | null, state: number, stability: number | null, difficulty: number | null, last_review_at: number | null, reps: number, lapses: number }
SELECT c.unit_id, u.name, u.order_idx, c.stage_reached, c.due_at, c.state,
       c.stability, c.difficulty, c.last_review_at, c.reps, c.lapses
FROM chapter c JOIN unit u ON u.id = c.unit_id
WHERE u.repo_id = :repoId AND c.state <> 0 AND c.due_at IS NOT NULL AND c.due_at <= :now
  AND NOT EXISTS (
    SELECT 1 FROM stage_log s
    WHERE s.unit_id = c.unit_id AND s.kind = 'recheck' AND s.day_key = :dayKey)
ORDER BY c.due_at, u.order_idx;

-- 오늘 밟을 챕터 — 아직 통과 못 한 것 중 가장 앞. **해금은 열이 아니라 이 순서다**:
-- 앞 챕터가 통과해야(`passed_at`) 다음 것이 첫 행이 된다. 세 번 막혀 접은 챕터는 그날 빠진다.
-- @name chapter.today
-- @params { repoId: number, dayKey: string }
-- @row { unit_id: number, name: string, order_idx: number, origin: string, stage_reached: number, deferred_day: string | null }
SELECT c.unit_id, u.name, u.order_idx, c.origin, c.stage_reached, c.deferred_day
FROM chapter c JOIN unit u ON u.id = c.unit_id
WHERE u.repo_id = :repoId AND c.passed_at IS NULL
  AND (c.deferred_day IS NULL OR c.deferred_day <> :dayKey)
ORDER BY u.order_idx, u.name
LIMIT 1;

-- 단 하나를 판정한 순간. `review_log.append` 와 같은 원장 규약이다 — 값을 나중에 고치지 않는다.
-- @name stage.append
-- @params { unitId: number, sessionId: number, stage: number, kind: string, asked: number, correct: number, passed: number, grade: number | null, elapsedDays: number, reviewedAt: number, dayKey: string, durationMs: number, detailJson: string }
-- @row void
INSERT INTO stage_log (unit_id, session_id, stage, kind, asked, correct, passed, grade,
                       elapsed_days, reviewed_at, day_key, duration_ms, detail_json)
VALUES (:unitId, :sessionId, :stage, :kind, :asked, :correct, :passed, :grade,
        :elapsedDays, :reviewedAt, :dayKey, :durationMs, :detailJson);

-- 원장 한 행을 쓴 **직후** 챕터 캐시를 그 값으로 세운다. `applied_log_id`(재생 커서)를 방금
-- 넣은 `stage_log.id` 로 두므로 `last_insert_rowid()` 를 쓴다 — VALUES 가 아니라 SET 에서
-- 읽히지만 규칙은 같다: 직전 INSERT 를 가리킨다 (D77 과 같은 자리).
-- `passed_at` 은 **한 번 서면 안 지운다** — 재검 실패가 진도(`stage_reached`)는 내려도
-- 해금은 안 걷는다 (D165).
-- @name chapter.apply_last
-- @params { unitId: number, stageReached: number, passedAt: number | null, state: number, stability: number | null, difficulty: number | null, dueAt: number | null, lastReviewAt: number | null, reps: number, lapses: number, updatedAt: number }
-- @row void
UPDATE chapter SET
  stage_reached = :stageReached,
  passed_at = COALESCE(passed_at, :passedAt),
  state = :state, stability = :stability, difficulty = :difficulty,
  due_at = :dueAt, last_review_at = :lastReviewAt, reps = :reps, lapses = :lapses,
  applied_log_id = last_insert_rowid(),
  updated_at = :updatedAt
WHERE unit_id = :unitId;

-- 세 번 막혀 그날 접는다 (`mastery.md` §5). 벌이 아니라 순서 재조정이라 진도는 안 건드린다.
-- @name chapter.defer
-- @params { unitId: number, dayKey: string, updatedAt: number }
-- @row void
UPDATE chapter SET deferred_day = :dayKey, updated_at = :updatedAt WHERE unit_id = :unitId;

-- 이 챕터의 단 원장. 통과 판정을 캐시에서만 읽지 않고 원장으로 다시 셀 수 있어야 한다
-- (「원장 재생 = 캐시 검증」).
-- @name stage.by_unit
-- @params { unitId: number }
-- @row { id: number, unit_id: number, session_id: number, stage: number, kind: string, asked: number, correct: number, passed: number, grade: number | null, elapsed_days: number, reviewed_at: number, day_key: string, duration_ms: number, detail_json: string }
SELECT id, unit_id, session_id, stage, kind, asked, correct, passed, grade, elapsed_days,
       reviewed_at, day_key, duration_ms, detail_json
FROM stage_log WHERE unit_id = :unitId ORDER BY reviewed_at, id;

-- 단마다 **가장 마지막** 첫 판정. 「1·2·3 이 다 통과했나」를 원장에서 센다.
-- @name stage.last_first_pass
-- @params { unitId: number }
-- @row { stage: number, passed: number, reviewed_at: number }
SELECT stage, passed, reviewed_at FROM stage_log s
WHERE s.unit_id = :unitId AND s.kind = 'first'
  AND s.reviewed_at = (SELECT MAX(reviewed_at) FROM stage_log x
                       WHERE x.unit_id = s.unit_id AND x.kind = 'first' AND x.stage = s.stage)
ORDER BY s.stage;

-- 이 세션에서 이 챕터가 몇 번 막혔나 (`mastery.md` §5 — 3건이면 접는다).
-- 챕터와 「모르겠어요」를 잇는 것은 `unit_node` 다 — 판은 개념에 달려 있고 개념이 대지에 붙는다.
-- 같은 개념이 트랙마다 행을 가지므로 `DISTINCT` 로 센다.
-- @name stage.dunno_count
-- @params { unitId: number, sessionId: number }
-- @row { n: number }
SELECT COUNT(DISTINCT d.id) AS n
FROM dunno_event d
JOIN session_item si ON si.id = d.session_item_id
JOIN unit_node un ON un.concept_id = d.concept_id AND un.unit_id = :unitId
WHERE si.session_id = :sessionId;

-- 1단 통과선은 「경로 위 개념이 전부 1겹 이상」이라 `mastery` 를 읽는다 (`mastery.md` §3.2).
-- 겹을 진도 축에서 내렸어도 **어휘 판정기로는 그대로 쓴다** (§4 ①).
-- @name chapter.reading_layers
-- @params { unitId: number }
-- @row { concept_id: string, layer: number }
SELECT un.concept_id, COALESCE(m.layer, 0) AS layer
FROM unit_node un
LEFT JOIN mastery m ON m.concept_id = un.concept_id
WHERE un.unit_id = :unitId AND un.track = 't0'
ORDER BY un.concept_id;
