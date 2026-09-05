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

-- 카드 한 장을 만드는 데 필요한 사용처 — `concept_site` 전 열 + 파일 경로.
-- 03 §3.6 `rank` 순(미지 최소 → **창의 미지 최소**(D155) → 사전 설명이 많은 것 → 짧은 줄
-- → 경로)으로 이미 정렬해 준다.
-- @name card.sites_for_concept
-- @params { repoId: number, conceptId: string, limit: number }
-- @row { id: number, repo_id: number, file_id: number, concept_id: string, site_key: string, line_start: number, line_end: number, col_start: number, col_end: number, ts_node_kind: string | null, form: string | null, shape: string, occurrence: number, excerpt: string, picks_json: string, hole_json: string | null, ctx_json: string, line_concepts_json: string, uncovered_ratio: number, confidence: string, parse_quality: string, is_dirty: number, is_oversize: number, commit_id: number | null, unknown_count: number, is_alive: number, updated_at: number, path: string }
SELECT s.id, s.repo_id, s.file_id, s.concept_id, s.site_key, s.line_start, s.line_end,
       s.col_start, s.col_end, s.ts_node_kind, s.form, s.shape, s.occurrence, s.excerpt,
       s.picks_json, s.hole_json, s.ctx_json, s.line_concepts_json, s.uncovered_ratio,
       s.confidence, s.parse_quality, s.is_dirty, s.is_oversize, s.commit_id,
       s.unknown_count, s.is_alive, s.updated_at, f.path
FROM concept_site s JOIN file f ON f.id = s.file_id
WHERE s.repo_id = :repoId AND s.concept_id = :conceptId AND s.is_alive = 1
ORDER BY s.unknown_count, s.window_unknown, s.uncovered_ratio, (s.line_end - s.line_start),
         s.is_dirty, f.path, s.id
LIMIT :limit;

-- 같은 줄에 걸친 다른 개념의 사용처 — 지목형 오답이 여기서 나온다 (04 §1.1 혼동 쌍).
-- @name card.sites_on_line
-- @params { repoId: number, fileId: number, lineStart: number, lineEnd: number, exceptId: number }
-- @row { id: number, repo_id: number, file_id: number, concept_id: string, site_key: string, line_start: number, line_end: number, col_start: number, col_end: number, ts_node_kind: string | null, form: string | null, shape: string, occurrence: number, excerpt: string, picks_json: string, hole_json: string | null, ctx_json: string, line_concepts_json: string, uncovered_ratio: number, confidence: string, parse_quality: string, is_dirty: number, is_oversize: number, commit_id: number | null, unknown_count: number, is_alive: number, updated_at: number }
SELECT s.id, s.repo_id, s.file_id, s.concept_id, s.site_key, s.line_start, s.line_end,
       s.col_start, s.col_end, s.ts_node_kind, s.form, s.shape, s.occurrence, s.excerpt,
       s.picks_json, s.hole_json, s.ctx_json, s.line_concepts_json, s.uncovered_ratio,
       s.confidence, s.parse_quality, s.is_dirty, s.is_oversize, s.commit_id,
       s.unknown_count, s.is_alive, s.updated_at
FROM concept_site s
WHERE s.repo_id = :repoId AND s.file_id = :fileId AND s.is_alive = 1 AND s.id <> :exceptId
  AND s.line_start <= :lineEnd AND s.line_end >= :lineStart;

-- 카드의 개념 이름 — 큐가 카드 id 로만 판을 걸 때 화면 문구가 필요하다.
-- @name card.concept_of
-- @params { id: number }
-- @row { concept_id: string, universal_id: string | null, name_ko: string, token: string | null, lang: string }
SELECT c.id AS concept_id, c.universal_id, c.name_ko, c.token, c.lang
FROM card k JOIN concept c ON c.id = k.concept_id WHERE k.id = :id;

-- ───────── 코스 문항 (D164) ─────────
-- 코스 카드는 `track = 't3'` 에 앉고 `stage_no` 가 단이다. 예전 큐(t0·t1·t2)는 이 행을 보지 않는다.
-- `card.insert` 를 안 넓힌 이유: 파라미터를 더하면 그 statement 를 부르는 모든 자리가 함께 바뀐다.
-- @name card.insert_stage
-- @params { repoId: number, unitId: number | null, track: string, kind: string, conceptId: string, level: number, siteId: number | null, fileId: number | null, commitId: number | null, payloadJson: string, genVersion: number, contentHash: string, createdAt: number, stageNo: number }
-- @row void
INSERT INTO card (repo_id, unit_id, track, kind, concept_id, level, site_id, file_id,
                  commit_id, payload_json, gen_version, content_hash, created_at, stage_no)
VALUES (:repoId, :unitId, :track, :kind, :conceptId, :level, :siteId, :fileId,
        :commitId, :payloadJson, :genVersion, :contentHash, :createdAt, :stageNo)
ON CONFLICT (repo_id, content_hash) DO NOTHING;

-- 한 챕터(=unit)의 한 단에 구워진 판 전부. 단 화면이 한 번에 긷는다 — 판 전환에 IPC 0회.
-- @name card.by_unit_stage
-- @params { unitId: number, stageNo: number }
-- @row { id: number, repo_id: number, unit_id: number | null, track: string, kind: string, concept_id: string, level: number, site_id: number | null, file_id: number | null, commit_id: number | null, payload_json: string, snapshot_json: string | null, gen_version: number, content_hash: string, created_at: number, retired_at: number | null, stage_no: number | null }
SELECT id, repo_id, unit_id, track, kind, concept_id, level, site_id, file_id, commit_id,
       payload_json, snapshot_json, gen_version, content_hash, created_at, retired_at, stage_no
FROM card
WHERE unit_id = :unitId AND stage_no = :stageNo AND retired_at IS NULL
ORDER BY kind, id;

-- 한 챕터에 단마다 판이 몇 장 있나 — 통과 판정(D165)이 「4단 문항이 있으면」을 여기서 본다.
-- @name card.stage_counts
-- @params { unitId: number }
-- @row { stage_no: number, n: number }
SELECT stage_no, COUNT(*) AS n
FROM card
WHERE unit_id = :unitId AND stage_no IS NOT NULL AND retired_at IS NULL
GROUP BY stage_no;

-- 파일 집합 안의 살아 있는 사용처 전부 — 코스 굽기(D172)가 챕터의 파일로 1단 개념·쌍둥이를 뽑는다.
-- `fileIds` 는 `json_each` 로 푼다 (`t2.edges` 와 같은 규칙). 열은 `card.sites_for_concept` 와 같다.
-- @name card.sites_in_files
-- @params { repoId: number, fileIds: string }
-- @row { id: number, repo_id: number, file_id: number, concept_id: string, site_key: string, line_start: number, line_end: number, col_start: number, col_end: number, ts_node_kind: string | null, form: string | null, shape: string, occurrence: number, excerpt: string, picks_json: string, hole_json: string | null, ctx_json: string, line_concepts_json: string, uncovered_ratio: number, confidence: string, parse_quality: string, is_dirty: number, is_oversize: number, commit_id: number | null, unknown_count: number, is_alive: number, updated_at: number, path: string }
SELECT s.id, s.repo_id, s.file_id, s.concept_id, s.site_key, s.line_start, s.line_end,
       s.col_start, s.col_end, s.ts_node_kind, s.form, s.shape, s.occurrence, s.excerpt,
       s.picks_json, s.hole_json, s.ctx_json, s.line_concepts_json, s.uncovered_ratio,
       s.confidence, s.parse_quality, s.is_dirty, s.is_oversize, s.commit_id, s.unknown_count,
       s.is_alive, s.updated_at, f.path
FROM concept_site s JOIN file f ON f.id = s.file_id
WHERE s.repo_id = :repoId AND s.is_alive = 1
  AND s.file_id IN (SELECT value FROM json_each(:fileIds))
ORDER BY f.path, s.line_start, s.id;

-- 4단의 정답지 — 챕터 파일을 고친 `fix` 커밋 (D172 · `exercises.md` §2). 부모 sha 가 있어야
-- 두 판을 읽어 diff 를 낼 수 있으므로 머지(부모 둘)는 뺀다. 작성자 일치는 요구하지 않는다 —
-- 팀원이 고친 것도 「실제로 고친 것」이라 정답지다.
-- @name card.fix_commits
-- @params { repoId: number, unitId: number, limit: number }
-- @row { id: number, sha: string, parent_sha: string | null, authored_at: number, message: string }
SELECT c.id, c.sha, c.parent_sha, c.authored_at, c.message
FROM git_commit c
WHERE c.repo_id = :repoId AND c.is_reachable = 1 AND c.kind = 'normal' AND c.parent_count = 1
  AND (c.message LIKE 'fix%' OR c.message LIKE 'bugfix%' OR c.message LIKE 'hotfix%')
  AND EXISTS (
    SELECT 1 FROM commit_file cf
    JOIN file f ON f.repo_id = c.repo_id AND f.path = cf.path
    JOIN unit_file uf ON uf.file_id = f.id AND uf.unit_id = :unitId
    WHERE cf.commit_id = c.id
  )
ORDER BY c.authored_at DESC, c.sha
LIMIT :limit;
