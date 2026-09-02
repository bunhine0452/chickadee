-- 홈이 읽는 statement (01 §3.4 · 02 §7.1). 화면은 SQL 을 모르고 이름만 안다.
-- 열 별칭을 붙이지 않는다 (D57).

-- 마스트헤드 — 개념 수와 겹 분포. `fade` 와 평균은 TS 가 계산한다 (02 §7.1).
-- @name home.bundle_counts
-- @params { repoId: number }
-- @row { concepts: number, printed: number, avg_layer: number | null }
SELECT COUNT(*) AS concepts,
       SUM(CASE WHEN COALESCE(m.layer, 0) > 0 THEN 1 ELSE 0 END) AS printed,
       AVG(COALESCE(m.layer, 0)) AS avg_layer
FROM (SELECT DISTINCT n.concept_id FROM unit_node n
      JOIN unit u ON u.id = n.unit_id WHERE u.repo_id = :repoId) x
LEFT JOIN mastery m ON m.concept_id = x.concept_id;

-- 잉크 겹 척도 — 겹별 개념 수. 홈의 `InkScale` 이 그대로 그린다.
-- @name home.layer_scale
-- @params { repoId: number }
-- @row { layer: number, n: number }
SELECT COALESCE(m.layer, 0) AS layer, COUNT(*) AS n
FROM (SELECT DISTINCT n.concept_id FROM unit_node n
      JOIN unit u ON u.id = n.unit_id WHERE u.repo_id = :repoId) x
LEFT JOIN mastery m ON m.concept_id = x.concept_id
GROUP BY 1 ORDER BY 1;

-- 대지 · 스티커 · 겹. 노드 상태(done/locked/current)는 TS 가 판정한다 (02 §7.1).
-- @name home.units
-- @params { repoId: number }
-- @row { unit_id: number, name: string, order_idx: number, root_path: string | null, concept_id: string, track: string, node_order: number, name_ko: string, token: string | null, layer: number, stability: number | null, last_review_at: number | null, state: number | null, due_at: number | null }
SELECT u.id AS unit_id, u.name, u.order_idx, u.root_path,
       n.concept_id, n.track, n.node_order, c.name_ko, c.token,
       COALESCE(m.layer, 0) AS layer, m.stability, m.last_review_at, m.state, m.due_at
FROM unit u
JOIN unit_node n ON n.unit_id = u.id
JOIN concept c ON c.id = n.concept_id
LEFT JOIN mastery m ON m.concept_id = n.concept_id
WHERE u.repo_id = :repoId
ORDER BY u.order_idx, n.node_order;

-- 대지마다 파일이 몇 개인지 — 시트 머리의 「파일 N개」.
-- @name home.unit_files
-- @params { repoId: number }
-- @row { name: string, files: number }
SELECT u.name, COUNT(uf.file_id) AS files
FROM unit u LEFT JOIN unit_file uf ON uf.unit_id = u.id
WHERE u.repo_id = :repoId GROUP BY u.name;

-- 판이 없는 문법 — 등장 횟수 순. 패널의 정의가 「내 코드엔 있는데」라 site_count > 0 뿐이다.
-- @name gaps.list
-- @params { repoId: number, limit: number }
-- @row { concept_id: string, name_ko: string, token: string | null, site_count: number, min_unknown: number, best_site_id: number | null }
SELECT g.concept_id, c.name_ko, c.token, g.site_count, g.min_unknown, g.best_site_id
FROM gap g JOIN concept c ON c.id = g.concept_id
WHERE g.repo_id = :repoId AND g.status = 'open'
ORDER BY g.site_count DESC, g.concept_id LIMIT :limit;

-- 사다리 3단·노드 상세의 「내 코드 N곳」 (02 §7.3).
-- @name concept.uses
-- @params { repoId: number, conceptId: string, limit: number }
-- @row { id: number, site_key: string, path: string, line_start: number, line_end: number, unknown_count: number, excerpt: string }
SELECT s.id, s.site_key, f.path, s.line_start, s.line_end, s.unknown_count, s.excerpt
FROM concept_site s JOIN file f ON f.id = s.file_id
WHERE s.repo_id = :repoId AND s.concept_id = :conceptId AND s.is_alive = 1
ORDER BY s.unknown_count, (s.line_end - s.line_start), f.path LIMIT :limit;

-- 선행 개념 + 겹 + 카드 유무 — 사다리 2단의 `prereq[{s}]`.
-- @name concept.prereqs
-- @params { repoId: number, conceptId: string }
-- @row { prereq_id: string, name_ko: string, token: string | null, layer: number, has_card: number, has_site: number }
SELECT p.prereq_id, c.name_ko, c.token, COALESCE(m.layer, 0) AS layer,
       EXISTS (SELECT 1 FROM card k WHERE k.repo_id = :repoId AND k.concept_id = p.prereq_id
               AND k.retired_at IS NULL) AS has_card,
       EXISTS (SELECT 1 FROM concept_site s WHERE s.repo_id = :repoId
               AND s.concept_id = p.prereq_id AND s.is_alive = 1) AS has_site
FROM concept_prereq p
JOIN concept c ON c.id = p.prereq_id
LEFT JOIN mastery m ON m.concept_id = p.prereq_id
WHERE p.concept_id = :conceptId
ORDER BY p.prereq_id;

-- 14일 컬러 바 — 하루 합산 분.
-- @name stats.days
-- @params { repoId: number, fromDay: string }
-- @row { day_key: string, mins: number }
SELECT day_key, SUM(elapsed_s) / 60.0 AS mins FROM session
WHERE repo_id = :repoId AND day_key >= :fromDay AND status IN ('done', 'paused', 'abandoned')
GROUP BY day_key ORDER BY day_key;

-- 다시 찍을 개념 — 만기 가까운 순 (02 §7.1).
-- @name queue.retake_pending
-- @params { repoId: number, limit: number }
-- @row { concept_id: string, name_ko: string, token: string | null, track_default: string, layer: number, due_at: number | null, stability: number | null, last_review_at: number | null, excerpt: string | null }
SELECT m.concept_id, c.name_ko, c.token, c.track_default, m.layer, m.due_at, m.stability,
       m.last_review_at, s.excerpt
FROM mastery m JOIN concept c ON c.id = m.concept_id
LEFT JOIN concept_site s ON s.id = (
  SELECT s2.id FROM concept_site s2
  WHERE s2.repo_id = :repoId AND s2.concept_id = m.concept_id AND s2.is_alive = 1
  ORDER BY s2.unknown_count, (s2.line_end - s2.line_start), s2.id LIMIT 1)
WHERE m.state <> 0
  AND EXISTS (SELECT 1 FROM card k WHERE k.repo_id = :repoId AND k.concept_id = m.concept_id
              AND k.retired_at IS NULL)
ORDER BY m.due_at LIMIT :limit;

-- 인제스트가 무엇을 남겼는지 — 첫 실행 안내와 개발자 패널이 읽는다.
-- @name home.last_run
-- @params { repoId: number }
-- @row { id: number, status: string, mode: string, started_at: number, finished_at: number | null, files_n: number, captures_n: number, commits_n: number, warnings_n: number, escalated_to_full: number, head_sha: string | null, error: string | null }
SELECT id, status, mode, started_at, finished_at, files_n, captures_n, commits_n,
       warnings_n, escalated_to_full, head_sha, error
FROM ingest_run WHERE repo_id = :repoId ORDER BY id DESC LIMIT 1;

-- @name home.file_count
-- @params { repoId: number }
-- @row { grammar: string | null, n: number }
SELECT grammar, COUNT(*) AS n FROM file
WHERE repo_id = :repoId AND is_alive = 1 GROUP BY grammar;
