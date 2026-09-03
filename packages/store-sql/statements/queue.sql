-- 오늘의 인쇄 큐가 읽는 statement (02 §5 · §6 · §7.2). 화면도 플래너도 SQL 을 모르고 이름만 안다.
-- 열 별칭을 붙이지 않는다 (D57).

-- 만기 복습 후보 (02 §7.2). TS 가 R 로 다시 정렬하고 20개로 자른다 — 여기서 60개까지만 긷는다.
-- @name queue.due
-- @params { repoId: number, eod: number, day: string, limit: number }
-- @row { concept_id: string, layer: number, stability: number | null, difficulty: number | null, due_at: number | null, last_review_at: number | null, state: number, reps: number, lapses: number, track_default: string }
SELECT m.concept_id, m.layer, m.stability, m.difficulty, m.due_at, m.last_review_at,
       m.state, m.reps, m.lapses, c.track_default
FROM mastery m JOIN concept c ON c.id = m.concept_id
WHERE m.state <> 0 AND m.due_at <= :eod
  AND EXISTS (SELECT 1 FROM card k WHERE k.repo_id = :repoId AND k.concept_id = m.concept_id
              AND k.retired_at IS NULL)
  AND NOT EXISTS (SELECT 1 FROM review_log r WHERE r.concept_id = m.concept_id
                  AND r.day_key = :day AND r.ok = 1)
ORDER BY m.due_at LIMIT :limit;

-- 새 개념 후보 (02 §6.2 NEW_CANDIDATES_SQL). 선행이 전부 알려졌거나 이 리포에 사용처가 없는 개념만.
-- @name queue.new_candidates
-- @params { repoId: number }
-- @row { id: string, site_count: number }
SELECT c.id, COUNT(s.id) AS site_count
FROM concept c
JOIN concept_site s ON s.concept_id = c.id AND s.repo_id = :repoId AND s.is_alive = 1
LEFT JOIN mastery m ON m.concept_id = c.id
WHERE c.kind = 'lang' AND c.is_retired = 0 AND c.track_default = 't0'
  AND COALESCE(m.state, 0) = 0
  AND NOT EXISTS (
    SELECT 1 FROM concept_prereq p
    LEFT JOIN mastery pm ON pm.concept_id = p.prereq_id
    WHERE p.concept_id = c.id AND COALESCE(pm.layer, 0) = 0
      AND EXISTS (SELECT 1 FROM concept_site ps
                  WHERE ps.repo_id = :repoId AND ps.concept_id = p.prereq_id AND ps.is_alive = 1))
GROUP BY c.id;

-- 첫 노출 사용처 (02 §6.2 `bestSite`) — 미지 최소 → 짧은 줄 → id.
-- @name queue.best_site
-- @params { repoId: number, conceptId: string }
-- @row { id: number, unknown_count: number, line_start: number, line_end: number, shape: string, occurrence: number, confidence: string, parse_quality: string, is_dirty: number }
SELECT s.id, s.unknown_count, s.line_start, s.line_end, s.shape, s.occurrence,
       s.confidence, s.parse_quality, s.is_dirty
FROM concept_site s
WHERE s.repo_id = :repoId AND s.concept_id = :conceptId AND s.is_alive = 1
ORDER BY s.unknown_count, (s.line_end - s.line_start), s.id LIMIT 1;

-- `loadKnownSet` 의 입력 (02 §6.1). 개념 전부 + 겹 + 보편 id.
-- @name queue.known_rows
-- @params {}
-- @row { id: string, universal_id: string | null, layer: number }
SELECT c.id, c.universal_id, COALESCE(m.layer, 0) AS layer
FROM concept c LEFT JOIN mastery m ON m.concept_id = c.id
WHERE c.is_retired = 0;

-- 선행 간선 전부 — 위상 정렬(02 §6.2 `topoOrder`)의 입력.
-- @name queue.prereq_edges
-- @params {}
-- @row { concept_id: string, prereq_id: string }
SELECT concept_id, prereq_id FROM concept_prereq;

-- 오늘 이미 찍은 새 판 수 (02 §5.2). 하루 상한은 세션을 합산한다.
-- @name queue.new_count_today
-- @params { repoId: number, day: string }
-- @row { n: number }
SELECT COUNT(*) AS n FROM review_log r JOIN session s ON s.id = r.session_id
WHERE s.repo_id = :repoId AND r.day_key = :day AND r.role = 'new';

-- 복습에 쓸 카드 고르기 (02 §7.2) — 겹에 맞는 level, 가장 오래 안 본 kind.
-- @name queue.pick_card
-- @params { repoId: number, conceptId: string, level: number }
-- @row { id: number, repo_id: number, unit_id: number | null, track: string, kind: string, concept_id: string, level: number, site_id: number | null, file_id: number | null, commit_id: number | null, payload_json: string, snapshot_json: string | null, gen_version: number, content_hash: string, created_at: number, retired_at: number | null }
SELECT k.id, k.repo_id, k.unit_id, k.track, k.kind, k.concept_id, k.level, k.site_id,
       k.file_id, k.commit_id, k.payload_json, k.snapshot_json, k.gen_version,
       k.content_hash, k.created_at, k.retired_at
FROM card k
LEFT JOIN (SELECT card_id, MAX(reviewed_at) AS last FROM review_log GROUP BY card_id) l
       ON l.card_id = k.id
WHERE k.repo_id = :repoId AND k.concept_id = :conceptId AND k.retired_at IS NULL
  AND k.level = :level
ORDER BY l.last IS NOT NULL, l.last, k.id LIMIT 1;

-- 트랙 리듬 (02 §5.2) — 최근 `sinceDay` 이후 그 트랙을 몇 번 마쳤고 마지막이 언제인가.
-- T1 은 「최근 7일 < 2 이고 마지막 ≥ 2일 전」, T2 는 「마지막 ≥ 2일 전」이 조건이다.
-- @name queue.track_cadence
-- @params { repoId: number, track: string, sinceDay: string }
-- @row { recent: number, last_day: string | null }
SELECT SUM(CASE WHEN r.day_key >= :sinceDay THEN 1 ELSE 0 END) AS recent,
       MAX(r.day_key) AS last_day
FROM review_log r JOIN session s ON s.id = r.session_id
WHERE s.repo_id = :repoId AND r.track = :track;

-- 그 트랙의 다음 판 — 단계가 남은 카드 우선, 없으면 아직 안 찍은 카드 (02 §5.3 2·3번).
-- @name queue.next_track_card
-- @params { repoId: number, track: string }
-- @row { id: number, repo_id: number, unit_id: number | null, track: string, kind: string, concept_id: string, level: number, site_id: number | null, file_id: number | null, commit_id: number | null, payload_json: string, snapshot_json: string | null, gen_version: number, content_hash: string, created_at: number, retired_at: number | null, prints: number, stage: number, est_min_ema: number | null }
SELECT k.id, k.repo_id, k.unit_id, k.track, k.kind, k.concept_id, k.level, k.site_id,
       k.file_id, k.commit_id, k.payload_json, k.snapshot_json, k.gen_version,
       k.content_hash, k.created_at, k.retired_at,
       COALESCE(t.prints, 0) AS prints, COALESCE(t.stage, 1) AS stage, t.est_min_ema
FROM card k LEFT JOIN card_state t ON t.card_id = k.id
WHERE k.repo_id = :repoId AND k.track = :track AND k.retired_at IS NULL
  AND COALESCE(t.is_suspended, 0) = 0
ORDER BY (COALESCE(t.prints, 0) = 0), COALESCE(t.last_printed_at, 0), k.id LIMIT 1;
