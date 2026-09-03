-- 원장과 숙련도 (02 §2.2 · §3 · §4 · §7.4). 「판 완료」 한 트랜잭션이 이 파일의 이름들로 쓰인다
-- (02 §8.1 순서: review_log → mastery → session_item → lifer → dunno_event).
-- 열 별칭을 붙이지 않는다 (D57).

-- @name review.append
-- @params { sessionId: number, sessionItemId: number, cardId: number, conceptId: string, track: string, role: string, reviewedAt: number, dayKey: string, grade: number, ok: number, dunno: number, early: number, elapsedDays: number, scheduledDays: number, rAtReview: number | null, layerBefore: number, layerAfter: number, sBefore: number | null, dBefore: number | null, sAfter: number, dAfter: number, dueAfter: number, paramsId: number, durationMs: number, detailJson: string }
-- @row void
INSERT INTO review_log (session_id, session_item_id, card_id, concept_id, track, role,
                        reviewed_at, day_key, grade, ok, dunno, early, elapsed_days,
                        scheduled_days, r_at_review, layer_before, layer_after,
                        s_before, d_before, s_after, d_after, due_after, params_id,
                        duration_ms, detail_json)
VALUES (:sessionId, :sessionItemId, :cardId, :conceptId, :track, :role,
        :reviewedAt, :dayKey, :grade, :ok, :dunno, :early, :elapsedDays,
        :scheduledDays, :rAtReview, :layerBefore, :layerAfter,
        :sBefore, :dBefore, :sAfter, :dAfter, :dueAfter, :paramsId,
        :durationMs, :detailJson);

-- 숙련도 캐시. `applied_log_id` 가 재생 커서다 — `rebuild_mastery()` 가 같은 값을 세운다.
-- @name review.mastery_upsert
-- @params { conceptId: string, state: number, stability: number | null, difficulty: number | null, dueAt: number | null, lastReviewAt: number | null, reps: number, lapses: number, layer: number, dayKey: string | null, dayStartLayer: number, dayCeiling: number, firstOkAt: number | null, lastOkDay: string | null, dunnoTotal: number, transferFrom: string | null, appliedLogId: number, updatedAt: number }
-- @row void
INSERT INTO mastery (concept_id, state, stability, difficulty, due_at, last_review_at,
                     reps, lapses, layer, day_key, day_start_layer, day_ceiling,
                     first_ok_at, last_ok_day, dunno_total, transfer_from,
                     applied_log_id, updated_at)
VALUES (:conceptId, :state, :stability, :difficulty, :dueAt, :lastReviewAt,
        :reps, :lapses, :layer, :dayKey, :dayStartLayer, :dayCeiling,
        :firstOkAt, :lastOkDay, :dunnoTotal, :transferFrom,
        :appliedLogId, :updatedAt)
ON CONFLICT (concept_id) DO UPDATE SET
  state = excluded.state, stability = excluded.stability, difficulty = excluded.difficulty,
  due_at = excluded.due_at, last_review_at = excluded.last_review_at,
  reps = excluded.reps, lapses = excluded.lapses, layer = excluded.layer,
  day_key = excluded.day_key, day_start_layer = excluded.day_start_layer,
  day_ceiling = excluded.day_ceiling, first_ok_at = excluded.first_ok_at,
  last_ok_day = excluded.last_ok_day, dunno_total = excluded.dunno_total,
  transfer_from = excluded.transfer_from, applied_log_id = excluded.applied_log_id,
  updated_at = excluded.updated_at;

-- @name review.mastery_get
-- @params { conceptIds: string }
-- @row { concept_id: string, state: number, stability: number | null, difficulty: number | null, due_at: number | null, last_review_at: number | null, reps: number, lapses: number, layer: number, day_key: string | null, day_start_layer: number, day_ceiling: number, first_ok_at: number | null, last_ok_day: string | null, dunno_total: number, transfer_from: string | null, applied_log_id: number, updated_at: number }
SELECT concept_id, state, stability, difficulty, due_at, last_review_at, reps, lapses,
       layer, day_key, day_start_layer, day_ceiling, first_ok_at, last_ok_day,
       dunno_total, transfer_from, applied_log_id, updated_at
FROM mastery WHERE concept_id IN (SELECT value FROM json_each(:conceptIds));

-- `rebuild_mastery()` 는 원장 전체를 시간 순으로 다시 흘린다 (02 체크리스트 「원장 재생 = 캐시 검증」).
-- @name review.all_logs
-- @params {}
-- @row { id: number, session_id: number, session_item_id: number, card_id: number, concept_id: string, track: string, role: string, reviewed_at: number, day_key: string, grade: number, ok: number, dunno: number, early: number, elapsed_days: number, scheduled_days: number, r_at_review: number | null, layer_before: number, layer_after: number, s_before: number | null, d_before: number | null, s_after: number, d_after: number, due_after: number, params_id: number, duration_ms: number, detail_json: string }
SELECT id, session_id, session_item_id, card_id, concept_id, track, role, reviewed_at,
       day_key, grade, ok, dunno, early, elapsed_days, scheduled_days, r_at_review,
       layer_before, layer_after, s_before, d_before, s_after, d_after, due_after,
       params_id, duration_ms, detail_json
FROM review_log ORDER BY id;

-- 재생 결과와 대조할 캐시 전량.
-- @name review.mastery_all
-- @params {}
-- @row { concept_id: string, state: number, stability: number | null, difficulty: number | null, due_at: number | null, last_review_at: number | null, reps: number, lapses: number, layer: number, day_key: string | null, day_start_layer: number, day_ceiling: number, first_ok_at: number | null, last_ok_day: string | null, dunno_total: number, transfer_from: string | null, applied_log_id: number, updated_at: number }
SELECT concept_id, state, stability, difficulty, due_at, last_review_at, reps, lapses,
       layer, day_key, day_start_layer, day_ceiling, first_ok_at, last_ok_day,
       dunno_total, transfer_from, applied_log_id, updated_at
FROM mastery ORDER BY concept_id;

-- 활성 스케줄러 파라미터 (02 §3.6). 없으면 TS 가 기본값 1행을 넣는다.
-- @name review.params_active
-- @params {}
-- @row { id: number, algo: string, params_json: string, source: string, review_count: number, log_loss: number | null }
SELECT id, algo, params_json, source, review_count, log_loss
FROM scheduler_params WHERE is_active = 1 LIMIT 1;

-- @name review.params_insert
-- @params { createdAt: number, algo: string, paramsJson: string, source: string, reviewCount: number, isActive: number }
-- @row void
INSERT INTO scheduler_params (created_at, algo, params_json, source, review_count, is_active)
VALUES (:createdAt, :algo, :paramsJson, :source, :reviewCount, :isActive);

-- ───────── LIFER · 모르겠어요 · 사다리 ─────────

-- 개념당 평생 1회. `id` 가 곧 일련번호(#047)다.
-- @name review.lifer_insert
-- @params { conceptId: string, cardId: number, repoId: number, filePath: string, lineNo: number | null, at: number, shownAt: number | null }
-- @row void
INSERT INTO lifer (concept_id, card_id, repo_id, file_path, line_no, at, shown_at)
VALUES (:conceptId, :cardId, :repoId, :filePath, :lineNo, :at, :shownAt)
ON CONFLICT (concept_id) DO NOTHING;

-- @name review.lifer_get
-- @params { conceptId: string }
-- @row { id: number, concept_id: string, card_id: number, repo_id: number, file_path: string, line_no: number | null, at: number, shown_at: number | null }
SELECT id, concept_id, card_id, repo_id, file_path, line_no, at, shown_at
FROM lifer WHERE concept_id = :conceptId;

-- 의식(연출)을 보여준 시각. 세션 3회 상한을 넘긴 것은 NULL 로 남아 요약에서 보인다 (02 §4).
-- @name review.lifer_shown
-- @params { id: number, shownAt: number }
-- @row void
UPDATE lifer SET shown_at = :shownAt WHERE id = :id;

-- 요약의 「처음 기록한 개념」 (02 §7.4).
-- @name review.lifer_since
-- @params { repoId: number, since: number }
-- @row { id: number, concept_id: string, card_id: number, repo_id: number, file_path: string, line_no: number | null, at: number, shown_at: number | null, name_ko: string, token: string | null }
SELECT l.id, l.concept_id, l.card_id, l.repo_id, l.file_path, l.line_no, l.at, l.shown_at,
       c.name_ko, c.token
FROM lifer l JOIN concept c ON c.id = l.concept_id
WHERE l.repo_id = :repoId AND l.at >= :since ORDER BY l.id;

-- 판당 1회 (UNIQUE(session_item_id)).
-- @name review.dunno_insert
-- @params { sessionItemId: number, cardId: number, conceptId: string, at: number, answeredBefore: number, wasCorrect: number | null, maxRung: number, layerBefore: number, layerAfter: number }
-- @row void
INSERT INTO dunno_event (session_item_id, card_id, concept_id, at, answered_before,
                         was_correct, max_rung, layer_before, layer_after)
VALUES (:sessionItemId, :cardId, :conceptId, :at, :answeredBefore,
        :wasCorrect, :maxRung, :layerBefore, :layerAfter)
ON CONFLICT (session_item_id) DO UPDATE SET max_rung = MAX(dunno_event.max_rung, excluded.max_rung);

-- @name review.dunno_get
-- @params { sessionItemId: number }
-- @row { id: number, session_item_id: number, review_log_id: number | null, card_id: number, concept_id: string, at: number, answered_before: number, was_correct: number | null, max_rung: number, layer_before: number, layer_after: number }
SELECT id, session_item_id, review_log_id, card_id, concept_id, at, answered_before,
       was_correct, max_rung, layer_before, layer_after
FROM dunno_event WHERE session_item_id = :sessionItemId;

-- 판을 마치면 원장 행을 잇는다 (02 §8.1 「판 완료」 5번).
-- @name review.dunno_link_log
-- @params { sessionItemId: number, reviewLogId: number, maxRung: number, layerAfter: number }
-- @row void
UPDATE dunno_event SET review_log_id = :reviewLogId, max_rung = :maxRung, layer_after = :layerAfter
WHERE session_item_id = :sessionItemId;

-- @name review.ladder_insert
-- @params { dunnoEventId: number, rung: number, action: string, targetCardId: number | null, at: number }
-- @row void
INSERT INTO ladder_event (dunno_event_id, rung, action, target_card_id, at)
VALUES (:dunnoEventId, :rung, :action, :targetCardId, :at);

-- 초보 감지 (02 §6.4) — 이 세션의 사다리 2단이 「내려갈 곳이 없다」를 몇 번 보고했나.
-- @name review.ladder_empty_prereq
-- @params { sessionId: number }
-- @row { n: number }
SELECT COUNT(*) AS n FROM ladder_event e
JOIN dunno_event d ON d.id = e.dunno_event_id
JOIN session_item i ON i.id = d.session_item_id
WHERE i.session_id = :sessionId AND e.rung = 2 AND e.action = 'open'
  AND NOT EXISTS (SELECT 1 FROM ladder_event j WHERE j.dunno_event_id = d.id AND j.action = 'jump');

-- ───────── 요약 (02 §7.4) ─────────

-- 오늘 움직인 잉크 — 개념마다 첫 로그의 `layer_before` 와 마지막 로그의 `layer_after`.
-- @name review.session_shifts
-- @params { sessionId: number }
-- @row { concept_id: string, name_ko: string, token: string | null, track: string, layer_from: number, layer_to: number, due_after: number, last_role: string, detail_json: string, ok: number }
SELECT a.concept_id, c.name_ko, c.token, l.track,
       f.layer_before AS layer_from, l.layer_after AS layer_to, l.due_after,
       l.role AS last_role, l.detail_json, l.ok
FROM (SELECT concept_id, MIN(id) AS first_id, MAX(id) AS last_id
      FROM review_log WHERE session_id = :sessionId GROUP BY concept_id) a
JOIN review_log f ON f.id = a.first_id
JOIN review_log l ON l.id = a.last_id
JOIN concept c ON c.id = a.concept_id
ORDER BY a.first_id;

-- 정합 수 · 판 수.
-- @name review.session_tally
-- @params { sessionId: number }
-- @row { n: number, ok: number | null, dunno: number | null, duration_ms: number | null }
SELECT COUNT(*) AS n, SUM(ok) AS ok, SUM(dunno) AS dunno, SUM(duration_ms) AS duration_ms
FROM review_log WHERE session_id = :sessionId;

-- 초보 감지 1·2번 조건 (02 §6.4) — 이 세션의 뿌리 개념 새 판 성적.
-- @name review.session_root_new
-- @params { sessionId: number }
-- @row { concept_id: string, ok: number, dunno: number }
SELECT r.concept_id, r.ok, r.dunno FROM review_log r
WHERE r.session_id = :sessionId AND r.role = 'new'
  AND NOT EXISTS (SELECT 1 FROM concept_prereq p WHERE p.concept_id = r.concept_id);
