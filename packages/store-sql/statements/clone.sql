-- 클론 코스 (D120 · 0003_clone.sql). 리포 하나를 순서대로 통째로 필사하는 모드다.
-- 순서 규칙(커밋 순 · 위상 폴백 · 순환 깨기)은 여기 없다 — `@chickadee/concepts` 의
-- `clone-order.ts` 가 정한다. 이 파일은 그 규칙이 먹을 재료를 긷고 결과를 담는 문장뿐이다.
-- 열 별칭을 붙이지 않는다 (D57).

-- ───────── 순서 재료 ─────────

-- 커밋 순을 쓸 수 있는가 (D120 「커밋 20개 이상」). 머지 커밋과 닿을 수 없는 커밋은 빼고,
-- 지금 살아 있는 파일을 A/M 로 만진 커밋만 센다 — 순서를 실제로 만드는 커밋이 그것뿐이라
-- 문턱과 재료가 같은 집합을 봐야 한다.
-- @name clone.commit_count
-- @params { repoId: number }
-- @row { n: number }
SELECT COUNT(*) AS n FROM git_commit c
WHERE c.repo_id = :repoId AND c.parent_count <= 1 AND c.is_reachable = 1
  AND EXISTS (SELECT 1 FROM commit_file cf JOIN file f
                ON f.repo_id = c.repo_id AND f.path = cf.path
               WHERE cf.commit_id = c.id AND cf.status IN ('A', 'M') AND f.is_alive = 1);

-- 커밋 순의 재료. 「A/M 만, 삭제된 파일과 머지 커밋 제외」가 WHERE 절 그대로다.
-- 정렬은 `authored_at → sha → path` — 같은 초에 찍힌 커밋이 있어도 순서가 흔들리지 않게
-- sha 로 한 번 더 깬다(난수 0).
-- @name clone.commit_touches
-- @params { repoId: number }
-- @row { sha: string, authored_at: number, path: string, id: number }
SELECT c.sha, c.authored_at, cf.path, f.id
FROM git_commit c
JOIN commit_file cf ON cf.commit_id = c.id
JOIN file f ON f.repo_id = c.repo_id AND f.path = cf.path
WHERE c.repo_id = :repoId AND c.parent_count <= 1 AND c.is_reachable = 1
  AND cf.status IN ('A', 'M')
  AND f.is_alive = 1 AND f.grammar IS NOT NULL AND f.skip_reason IS NULL
ORDER BY c.authored_at, c.sha, cf.path;

-- 코스에 들어갈 파일 전부. 문법을 모르는 파일(바이너리·생성물·너무 큰 파일)은 필사할 수
-- 없으므로 애초에 목차에 넣지 않는다.
-- @name clone.course_files
-- @params { repoId: number }
-- @row { id: number, path: string, grammar: string | null, line_count: number, unit_id: number | null }
SELECT f.id, f.path, f.grammar, f.line_count, uf.unit_id
FROM file f LEFT JOIN unit_file uf ON uf.file_id = f.id
WHERE f.repo_id = :repoId AND f.is_alive = 1
  AND f.grammar IS NOT NULL AND f.skip_reason IS NULL AND f.line_count > 0
ORDER BY f.path;

-- 대지 하나만 (`scope = 'unit'`).
-- @name clone.course_files_in_unit
-- @params { repoId: number, unitId: number }
-- @row { id: number, path: string, grammar: string | null, line_count: number, unit_id: number | null }
SELECT f.id, f.path, f.grammar, f.line_count, uf.unit_id
FROM file f JOIN unit_file uf ON uf.file_id = f.id
WHERE f.repo_id = :repoId AND uf.unit_id = :unitId AND f.is_alive = 1
  AND f.grammar IS NOT NULL AND f.skip_reason IS NULL AND f.line_count > 0
ORDER BY f.path;

-- 위상 폴백의 바깥 순서. `order_idx` 는 인제스트가 `assignUnits` 순서로 매긴 값이다.
-- @name clone.units
-- @params { repoId: number }
-- @row { id: number, name: string, root_path: string | null, order_idx: number }
SELECT id, name, root_path, order_idx FROM unit
WHERE repo_id = :repoId ORDER BY order_idx, name;

-- 위상 폴백의 간선. `import_edge` 의 PK 는 `(from, to, kind)` 라 같은 짝이 kind 별로 여러 번
-- 온다 — 중복은 TS 가 지운다(같은 짝을 두 번 세면 진입 차수가 영영 0 이 되지 않는다).
-- @name clone.import_edges
-- @params { repoId: number }
-- @row { from_file_id: number, to_file_id: number }
SELECT from_file_id, to_file_id FROM import_edge
WHERE repo_id = :repoId ORDER BY from_file_id, to_file_id;

-- ───────── 실행 (clone_run) ─────────

-- @name clone.run_insert
-- @params { repoId: number, sessionId: number, mode: string, scope: string, unitId: number | null, status: string, orderJson: string, startedAt: number }
-- @row void
INSERT INTO clone_run (repo_id, session_id, mode, scope, unit_id, status, order_json, started_at)
VALUES (:repoId, :sessionId, :mode, :scope, :unitId, :status, :orderJson, :startedAt);

-- @name clone.run_get
-- @params { id: number }
-- @row { id: number, repo_id: number, session_id: number, mode: string, scope: string, unit_id: number | null, status: string, order_json: string, started_at: number, finished_at: number | null }
SELECT id, repo_id, session_id, mode, scope, unit_id, status, order_json, started_at, finished_at
FROM clone_run WHERE id = :id;

-- 이어할 코스. 일일 세션과 달리 날짜로 버리지 않는다 — 코스는 며칠에 걸쳐 도는 것이
-- 정상이고(D120), 그래서 `session.abandon_stale` 이 코스를 건드리지 못하게 코스 세션은
-- 처음부터 `done` 이다.
-- @name clone.run_open
-- @params { repoId: number }
-- @row { id: number, repo_id: number, session_id: number, mode: string, scope: string, unit_id: number | null, status: string, order_json: string, started_at: number, finished_at: number | null }
SELECT id, repo_id, session_id, mode, scope, unit_id, status, order_json, started_at, finished_at
FROM clone_run WHERE repo_id = :repoId AND status IN ('active', 'paused')
ORDER BY started_at DESC, id DESC LIMIT 1;

-- @name clone.run_update
-- @params { id: number, status: string, finishedAt: number | null }
-- @row void
UPDATE clone_run SET status = :status, finished_at = :finishedAt WHERE id = :id;

-- ───────── 조각 (clone_step) ─────────

-- 조각은 파일을 열 때 한 번에 만들어진다(지연 생성). 같은 파일을 다시 열어도 행이 늘지
-- 않도록 `UNIQUE (run_id, seq, part)` 에 기대 조용히 넘어간다.
-- @name clone.step_insert
-- @params { runId: number, seq: number, part: number, fileId: number, blockId: number, lineStart: number, lineEnd: number, textHash: string }
-- @row void
INSERT INTO clone_step (run_id, seq, part, file_id, block_id, line_start, line_end, text_hash)
VALUES (:runId, :seq, :part, :fileId, :blockId, :lineStart, :lineEnd, :textHash)
ON CONFLICT (run_id, seq, part) DO NOTHING;

-- 목차 화면 한 벌. 파일 경로·문법까지 같이 준다 — 조각을 열 때 원문을 읽어야 한다.
-- @name clone.steps
-- @params { runId: number }
-- @row { id: number, run_id: number, seq: number, part: number, file_id: number, block_id: number, line_start: number, line_end: number, text_hash: string, status: string, pct: number | null, elapsed_s: number, draft_text: string | null, session_item_id: number | null, review_log_id: number | null, done_at: number | null, path: string, grammar: string | null }
SELECT s.id, s.run_id, s.seq, s.part, s.file_id, s.block_id, s.line_start, s.line_end,
       s.text_hash, s.status, s.pct, s.elapsed_s, s.draft_text, s.session_item_id,
       s.review_log_id, s.done_at, f.path, f.grammar
FROM clone_step s JOIN file f ON f.id = s.file_id
WHERE s.run_id = :runId ORDER BY s.seq, s.part;

-- 파일 하나의 조각만. 「이 파일은 이미 잘렸나」를 목차 전체를 긷지 않고 묻는다.
-- @name clone.steps_at
-- @params { runId: number, seq: number }
-- @row { id: number, run_id: number, seq: number, part: number, file_id: number, block_id: number, line_start: number, line_end: number, text_hash: string, status: string, pct: number | null, elapsed_s: number, draft_text: string | null, session_item_id: number | null, review_log_id: number | null, done_at: number | null, path: string, grammar: string | null }
SELECT s.id, s.run_id, s.seq, s.part, s.file_id, s.block_id, s.line_start, s.line_end,
       s.text_hash, s.status, s.pct, s.elapsed_s, s.draft_text, s.session_item_id,
       s.review_log_id, s.done_at, f.path, f.grammar
FROM clone_step s JOIN file f ON f.id = s.file_id
WHERE s.run_id = :runId AND s.seq = :seq ORDER BY s.part;

-- 다음에 칠 조각 — 아직 안 끝난 첫 것. 나갔다 와도 이 한 문장이 자리를 돌려준다.
-- @name clone.step_next
-- @params { runId: number }
-- @row { id: number, run_id: number, seq: number, part: number, file_id: number, block_id: number, line_start: number, line_end: number, text_hash: string, status: string, pct: number | null, elapsed_s: number, draft_text: string | null, session_item_id: number | null, review_log_id: number | null, done_at: number | null, path: string, grammar: string | null }
SELECT s.id, s.run_id, s.seq, s.part, s.file_id, s.block_id, s.line_start, s.line_end,
       s.text_hash, s.status, s.pct, s.elapsed_s, s.draft_text, s.session_item_id,
       s.review_log_id, s.done_at, f.path, f.grammar
FROM clone_step s JOIN file f ON f.id = s.file_id
WHERE s.run_id = :runId AND s.status IN ('pending', 'active')
ORDER BY s.seq, s.part LIMIT 1;

-- 자동 저장 (P4 이어하기가 이 초안을 되읽는다). 원장에는 아무것도 쓰지 않는다.
-- @name clone.step_save
-- @params { id: number, status: string, elapsedS: number, draftText: string | null }
-- @row void
UPDATE clone_step SET status = :status, elapsed_s = :elapsedS, draft_text = :draftText
WHERE id = :id;

-- 조각에 판(session_item)을 매단다. 판은 채점 직전에 하나 만들어진다 —
-- 열자마자 만들면 열어만 보고 나간 조각이 원장에 빈 판으로 남는다.
-- @name clone.step_link_item
-- @params { id: number, sessionItemId: number }
-- @row void
UPDATE clone_step SET session_item_id = :sessionItemId, status = 'active' WHERE id = :id;

-- 채점을 마친 뒤. `review_log_id` 는 「판 완료」 tx 가 `session_item` 에 이미 이어 둔 값을
-- 옮겨 온다 — `last_insert_rowid()` 에 기대지 않으므로 이 문장은 batch 밖에서 돌아도 된다.
-- @name clone.step_finish
-- @params { id: number, pct: number | null, elapsedS: number, draftText: string | null, doneAt: number }
-- @row void
UPDATE clone_step
SET status = 'done', pct = :pct, elapsed_s = :elapsedS, draft_text = :draftText,
    done_at = :doneAt,
    review_log_id = (SELECT review_log_id FROM session_item WHERE id = clone_step.session_item_id)
WHERE id = :id;

-- 재인제스트로 원문이 바뀐 파일의 조각을 무효로 만든다 (P4 clone-resume-stale).
-- 이미 끝낸 조각은 건드리지 않는다 — 그 결과는 원장에 있고 원장은 되돌리지 않는다.
-- @name clone.step_stale
-- @params { runId: number, fileId: number }
-- @row void
UPDATE clone_step SET status = 'stale'
WHERE run_id = :runId AND file_id = :fileId AND status IN ('pending', 'active');

-- 목차 진행률. 화면이 매 렌더마다 묻는 자리라 조각 전체를 긷지 않는다.
-- @name clone.progress
-- @params { runId: number }
-- @row { total: number, done: number, elapsed_s: number }
SELECT COUNT(*) AS total,
       SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done,
       COALESCE(SUM(elapsed_s), 0) AS elapsed_s
FROM clone_step WHERE run_id = :runId;

-- ───────── 판 자리 (session_item) ─────────

-- 코스 세션의 다음 `pos`. `UNIQUE (session_id, pos)` 를 스스로 지킨다.
-- @name clone.next_pos
-- @params { sessionId: number }
-- @row { n: number }
SELECT COALESCE(MAX(pos), -1) + 1 AS n FROM session_item WHERE session_id = :sessionId;

-- 방금 넣은 판의 id. `session.item_insert` 는 `lastId` 를 주지만 batch 안에서 넣은 경우엔
-- 그것을 못 보므로 자리로 되찾는 문을 둔다.
-- @name clone.item_at
-- @params { sessionId: number, pos: number }
-- @row { id: number }
SELECT id FROM session_item WHERE session_id = :sessionId AND pos = :pos;

-- ───────── 조각 재료 ─────────

-- 조각 줄 범위에 걸친 개념과 그 겹 (`block.candidates` 의 `concepts_json` 과 같은 셈이지만
-- 블록이 아니라 임의 줄 범위를 본다 — 조각은 블록보다 작다). 대표 개념 선정(D27)과
-- 페이딩 단계(`courseStage`)가 이 겹을 읽는다.
-- @name clone.segment_concepts
-- @params { fileId: number, lineStart: number, lineEnd: number }
-- @row { concept_id: string, layer: number, n: number, site_id: number }
SELECT s.concept_id, MAX(COALESCE(m.layer, 0)) AS layer, COUNT(*) AS n, MIN(s.id) AS site_id
FROM concept_site s LEFT JOIN mastery m ON m.concept_id = s.concept_id
WHERE s.file_id = :fileId AND s.is_alive = 1
  AND s.line_start <= :lineEnd AND s.line_end >= :lineStart
GROUP BY s.concept_id
ORDER BY s.concept_id;

-- 지금까지 잘린 파일 중 가장 뒤. 지연 생성이 여기부터 이어서 자른다 — 목차 전체를 긷지
-- 않으려고 커서를 한 값으로 줄인다.
-- @name clone.max_seq
-- @params { runId: number }
-- @row { n: number }
SELECT COALESCE(MAX(seq), -1) AS n FROM clone_step WHERE run_id = :runId;

-- 파일 하나의 문법. 조각을 자를 때 마스크 표를 고르는 값이다 — 목차 전체를 다시 긷지
-- 않으려고 한 행만 묻는다.
-- @name clone.file_grammar
-- @params { fileId: number }
-- @row { grammar: string | null }
SELECT grammar FROM file WHERE id = :fileId;
