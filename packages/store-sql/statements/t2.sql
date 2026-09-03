-- T2 구조 (04 §7~§8). 지도는 `import_edge`, 정답지는 `git_commit`·`commit_file` 이다.
-- 규칙은 하나도 여기 없다 — 밴드·SCC·배치는 `@chickadee/cards` 가, 채점은
-- `@chickadee/grading` 이 한다 (D97). 열 별칭을 붙이지 않는다 (D57).

-- 지도의 노드 후보. 대지 하나의 파일과 그 **1-hop 이웃**을 한 번에 준다 (04 §7.4 「범위」).
-- `in_unit` 이 0 인 행이 이웃이고, 24 노드 상한에서 먼저 접히는 쪽이다.
-- @name t2.unit_files
-- @params { repoId: number, unitId: number }
-- @row { id: number, path: string, in_unit: number }
WITH mine AS (
  SELECT uf.file_id AS id FROM unit_file uf WHERE uf.unit_id = :unitId
),
near AS (
  SELECT id FROM mine
  UNION SELECT e.to_file_id FROM import_edge e JOIN mine ON mine.id = e.from_file_id
  UNION SELECT e.from_file_id FROM import_edge e JOIN mine ON mine.id = e.to_file_id
)
SELECT f.id, f.path, (f.id IN (SELECT id FROM mine)) AS in_unit
FROM near JOIN file f ON f.id = near.id
WHERE f.repo_id = :repoId AND f.is_alive = 1
ORDER BY f.path;

-- 그 노드 집합 **안쪽** 엣지만. 밖으로 나가는 선은 지도에 그릴 자리가 없다.
-- `ids` 는 `json_each` 로 푼다 — SQLite 는 배열을 바인딩하지 못한다(카탈로그 규칙).
-- @name t2.edges
-- @params { repoId: number, ids: string }
-- @row { from_file_id: number, to_file_id: number, kind: string, confidence: string }
SELECT e.from_file_id, e.to_file_id, e.kind, e.confidence
FROM import_edge e
WHERE e.repo_id = :repoId
  AND e.from_file_id IN (SELECT value FROM json_each(:ids))
  AND e.to_file_id IN (SELECT value FROM json_each(:ids))
ORDER BY e.from_file_id, e.to_file_id, e.kind;

-- 정답지 후보 커밋 (04 §8.1). 「소스 파일 3~12개」·메시지 접두·테스트 제외 같은 규칙은
-- `@chickadee/cards` 가 본다 — 여기서는 **대지에 닿은** 정상 커밋만 좁혀 준다.
-- @name t2.commit_candidates
-- @params { repoId: number, unitId: number, limit: number }
-- @row { id: number, sha: string, authored_at: number, message: string, files_n: number, insertions: number, deletions: number, truncated: number, touched_n: number }
SELECT c.id, c.sha, c.authored_at, c.message, c.files_n, c.insertions, c.deletions,
       c.truncated, COUNT(DISTINCT cf.path) AS touched_n
FROM git_commit c
JOIN commit_file cf ON cf.commit_id = c.id
JOIN file f ON f.repo_id = c.repo_id AND f.path = cf.path
JOIN unit_file uf ON uf.file_id = f.id AND uf.unit_id = :unitId
WHERE c.repo_id = :repoId AND c.is_reachable = 1 AND c.kind = 'normal'
  AND c.author_matched = 1 AND c.parent_count = 1
GROUP BY c.id
ORDER BY c.authored_at DESC
LIMIT :limit;

-- 커밋 한 건이 바꾼 파일 전부. `file_id` 가 `null` 인 행은 인제스트가 읽지 않는 파일
-- (지워졌거나 사전 밖 확장자)이라 지도에 노드가 없다 — 정답지에서도 빠진다.
-- @name t2.commit_files
-- @params { commitId: number }
-- @row { path: string, old_path: string | null, status: string, additions: number, deletions: number, file_id: number | null }
SELECT cf.path, cf.old_path, cf.status, cf.additions, cf.deletions, f.id AS file_id
FROM commit_file cf
JOIN git_commit c ON c.id = cf.commit_id
LEFT JOIN file f ON f.repo_id = c.repo_id AND f.path = cf.path AND f.is_alive = 1
WHERE cf.commit_id = :commitId
ORDER BY cf.path;

-- 공변경 이력 (04 §8.1 sec ②). 최근 `limit` 커밋의 변경 파일을 통째로 주고, 「core 파일
-- ≥ 2개와 함께 바뀐 비율 ≥ 0.5」는 TS 가 센다 — 분모가 core 집합이라 SQL 로 좁힐 수 없다.
-- @name t2.recent_changes
-- @params { repoId: number, limit: number }
-- @row { commit_id: number, path: string }
SELECT cf.commit_id, cf.path
FROM commit_file cf
JOIN (
  SELECT id FROM git_commit
  WHERE repo_id = :repoId AND is_reachable = 1 AND kind = 'normal' AND parent_count = 1
  ORDER BY authored_at DESC LIMIT :limit
) c ON c.id = cf.commit_id
ORDER BY cf.commit_id DESC, cf.path;

-- 「이것도 맞다」가 세 번 쌓인 파일 (04 §8.4). 같은 판·같은 경로의 open 행을 센다.
-- @name t2.appeal_picks
-- @params { cardId: number }
-- @row { user_text: string, n: number }
SELECT user_text, COUNT(*) AS n
FROM appeal
WHERE card_id = :cardId AND track = 't2' AND status = 'open' AND user_text IS NOT NULL
GROUP BY user_text ORDER BY n DESC, user_text;
