-- TS 파생 층이 쓰는 statement (01 §3.3 「TS 파생 층」 · 03 §3.3).
-- Rust 가 캡처·파일·커밋을 쓰고 나면, 여기 있는 이름들로 사용처·대지·구멍이 만들어진다.
-- 열 별칭을 붙이지 않는다 (D57) — 행이 열 이름으로 와야 `fromRow` 가 테이블당 하나로 성립한다.

-- ───────── 사전 물질화 ─────────
-- 개념 행이 먼저 있어야 concept_site 의 외래키가 선다.

-- @name derive.dict_version_upsert
-- @params { lang: string, version: string, sha256: string, conceptCount: number, loadedAt: number }
-- @row void
INSERT INTO dictionary_version (lang, version, sha256, concept_count, loaded_at)
VALUES (:lang, :version, :sha256, :conceptCount, :loadedAt)
ON CONFLICT (lang, version) DO UPDATE SET
  sha256 = excluded.sha256, concept_count = excluded.concept_count, loaded_at = excluded.loaded_at;

-- @name derive.dict_version_id
-- @params { lang: string, version: string }
-- @row { id: number }
SELECT id FROM dictionary_version WHERE lang = :lang AND version = :version;

-- @name derive.concept_upsert
-- @params { id: string, lang: string, nameKo: string, token: string | null, kind: 'universal' | 'lang', universalId: string | null, trackDefault: 't0' | 't1' | 't2' | 't3', dictVersionId: number }
-- @row void
INSERT INTO concept (id, lang, name_ko, token, kind, universal_id, track_default, dict_version_id, is_retired)
VALUES (:id, :lang, :nameKo, :token, :kind, :universalId, :trackDefault, :dictVersionId, 0)
ON CONFLICT (id) DO UPDATE SET
  lang = excluded.lang, name_ko = excluded.name_ko, token = excluded.token, kind = excluded.kind,
  universal_id = excluded.universal_id, track_default = excluded.track_default,
  dict_version_id = excluded.dict_version_id, is_retired = 0;

-- 사전에서 사라진 개념은 지우지 않는다 — 학습 기록이 참조한다 (02 원장 규칙).
-- @name derive.concept_retire_missing
-- @params { ids: string[] }
-- @row void
UPDATE concept SET is_retired = 1 WHERE id NOT IN (SELECT value FROM json_each(:ids));

-- @name derive.prereq_clear
-- @params { conceptId: string }
-- @row void
DELETE FROM concept_prereq WHERE concept_id = :conceptId;

-- @name derive.prereq_insert
-- @params { conceptId: string, prereqId: string }
-- @row void
INSERT OR IGNORE INTO concept_prereq (concept_id, prereq_id) VALUES (:conceptId, :prereqId);

-- ───────── 사실 읽기 ─────────

-- 01 §3.4 `derive.captures_by_file`. 파일 단위 페이지 — 한 번에 리포 전체를 읽지 않는다.
-- @name derive.captures_by_file
-- @params { fileId: number }
-- @row { query_id: string, match_id: number, pattern_index: number, name: string, form: string | null, node_kind: string, in_error: number, start_byte: number, end_byte: number, start_line: number, end_line: number, start_col: number, end_col: number, excerpt: string }
SELECT query_id, match_id, pattern_index, name, form, node_kind, in_error,
       start_byte, end_byte, start_line, end_line, start_col, end_col, excerpt
FROM capture WHERE file_id = :fileId ORDER BY query_id, match_id, start_byte;

-- @name derive.files
-- @params { repoId: number }
-- @row { id: number, path: string, grammar: string | null, line_count: number, is_dirty: number, parse_quality: string | null }
SELECT id, path, grammar, line_count, is_dirty, parse_quality
FROM file WHERE repo_id = :repoId AND is_alive = 1 ORDER BY path;

-- 파일이 언제 바뀌었는지 — 증분 재파생의 대상을 고른다 (03 §1.6-4).
-- @name derive.files_changed_since
-- @params { repoId: number, since: number }
-- @row { id: number, path: string, grammar: string | null, line_count: number, is_dirty: number, parse_quality: string | null }
SELECT id, path, grammar, line_count, is_dirty, parse_quality
FROM file WHERE repo_id = :repoId AND is_alive = 1 AND updated_at >= :since ORDER BY path;

-- @name derive.commits
-- @params { repoId: number }
-- @row { id: number, sha: string, parent_count: number, author_email: string | null, author_name: string | null, message: string, files_n: number, insertions: number }
SELECT id, sha, parent_count, author_email, author_name, message, files_n, insertions
FROM git_commit WHERE repo_id = :repoId AND is_reachable = 1 ORDER BY authored_at DESC;

-- ───────── 사용처 ─────────

-- @name derive.site_upsert
-- @params { repoId: number, fileId: number, conceptId: string, siteKey: string, lineStart: number, lineEnd: number, colStart: number, colEnd: number, tsNodeKind: string | null, form: string | null, shape: string, occurrence: number, excerpt: string, picksJson: string, holeJson: string | null, ctxJson: string, lineConceptsJson: string, uncoveredRatio: number, confidence: 'syntactic' | 'heuristic', parseQuality: 'ok' | 'poor', isDirty: boolean, isOversize: boolean, unknownCount: number, updatedAt: number }
-- @row void
INSERT INTO concept_site (repo_id, file_id, concept_id, site_key, line_start, line_end,
                          col_start, col_end, ts_node_kind, form, shape, occurrence, excerpt,
                          picks_json, hole_json, ctx_json, line_concepts_json, uncovered_ratio,
                          confidence, parse_quality, is_dirty, is_oversize, unknown_count,
                          is_alive, updated_at)
VALUES (:repoId, :fileId, :conceptId, :siteKey, :lineStart, :lineEnd,
        :colStart, :colEnd, :tsNodeKind, :form, :shape, :occurrence, :excerpt,
        :picksJson, :holeJson, :ctxJson, :lineConceptsJson, :uncoveredRatio,
        :confidence, :parseQuality, :isDirty, :isOversize, :unknownCount, 1, :updatedAt)
ON CONFLICT (repo_id, site_key) DO UPDATE SET
  file_id = excluded.file_id, line_start = excluded.line_start, line_end = excluded.line_end,
  col_start = excluded.col_start, col_end = excluded.col_end, ts_node_kind = excluded.ts_node_kind,
  form = excluded.form, excerpt = excluded.excerpt, picks_json = excluded.picks_json,
  hole_json = excluded.hole_json, ctx_json = excluded.ctx_json,
  line_concepts_json = excluded.line_concepts_json, uncovered_ratio = excluded.uncovered_ratio,
  confidence = excluded.confidence, parse_quality = excluded.parse_quality,
  is_dirty = excluded.is_dirty, is_oversize = excluded.is_oversize,
  unknown_count = excluded.unknown_count, is_alive = 1, updated_at = excluded.updated_at;

-- 이번 재파생에서 나오지 않은 사용처는 죽는다. 지우지는 않는다 — 카드가 참조한다.
-- @name derive.site_retire_missing
-- @params { repoId: number, fileId: number, keys: string[], updatedAt: number }
-- @row void
UPDATE concept_site SET is_alive = 0, updated_at = :updatedAt
WHERE repo_id = :repoId AND file_id = :fileId AND is_alive = 1
  AND site_key NOT IN (SELECT value FROM json_each(:keys));

-- @name derive.sites_for_rank
-- @params { repoId: number }
-- @row { id: number, site_key: string, concept_id: string, path: string, line_start: number, line_end: number, uncovered_ratio: number, line_concepts_json: string, is_dirty: number, unknown_count: number }
SELECT s.id, s.site_key, s.concept_id, f.path, s.line_start, s.line_end,
       s.uncovered_ratio, s.line_concepts_json, s.is_dirty, s.unknown_count
FROM concept_site s JOIN file f ON f.id = s.file_id
WHERE s.repo_id = :repoId AND s.is_alive = 1;

-- @name derive.unknown_count_set
-- @params { repoId: number, siteKey: string, unknownCount: number }
-- @row void
UPDATE concept_site SET unknown_count = :unknownCount
WHERE repo_id = :repoId AND site_key = :siteKey;

-- 2차 패스가 blame 으로 사용처의 출처 커밋을 채운다 (03 §1.5).
-- @name derive.blame_fill
-- @params { repoId: number, siteKey: string, sha: string }
-- @row void
UPDATE concept_site
SET commit_id = (SELECT id FROM git_commit WHERE repo_id = :repoId AND sha = :sha)
WHERE repo_id = :repoId AND site_key = :siteKey;

-- ───────── 커밋 파생 열 ─────────

-- @name derive.commit_classify
-- @params { repoId: number, sha: string, kind: 'normal' | 'merge' | 'revert' | 'bot' | 'bulk', authorMatched: boolean }
-- @row void
UPDATE git_commit SET kind = :kind, author_matched = :authorMatched
WHERE repo_id = :repoId AND sha = :sha;

-- ───────── 대지 ─────────

-- @name derive.unit_upsert
-- @params { repoId: number, name: string, rootPath: string | null, orderIdx: number }
-- @row void
INSERT INTO unit (repo_id, name, root_path, source, order_idx)
VALUES (:repoId, :name, :rootPath, 'dir', :orderIdx)
ON CONFLICT (repo_id, name) DO UPDATE SET
  root_path = excluded.root_path, order_idx = excluded.order_idx;

-- @name derive.unit_files_clear
-- @params { repoId: number }
-- @row void
DELETE FROM unit_file WHERE unit_id IN (SELECT id FROM unit WHERE repo_id = :repoId);

-- @name derive.unit_file_insert
-- @params { repoId: number, name: string, fileId: number }
-- @row void
INSERT OR IGNORE INTO unit_file (unit_id, file_id)
VALUES ((SELECT id FROM unit WHERE repo_id = :repoId AND name = :name), :fileId);

-- @name derive.unit_nodes_clear
-- @params { repoId: number }
-- @row void
DELETE FROM unit_node WHERE unit_id IN (SELECT id FROM unit WHERE repo_id = :repoId);

-- @name derive.unit_node_insert
-- @params { repoId: number, name: string, conceptId: string, track: 't0' | 't1' | 't2' | 't3', nodeOrder: number }
-- @row void
INSERT OR IGNORE INTO unit_node (unit_id, concept_id, track, node_order)
VALUES ((SELECT id FROM unit WHERE repo_id = :repoId AND name = :name), :conceptId, :track, :nodeOrder);

-- 이번 인제스트에서 사라진 대지. 하위 행은 ON DELETE CASCADE 가 정리한다.
-- @name derive.unit_delete_missing
-- @params { repoId: number, names: string[] }
-- @row void
DELETE FROM unit WHERE repo_id = :repoId AND name NOT IN (SELECT value FROM json_each(:names));

-- ───────── 구멍 지도 ─────────

-- @name derive.gap_upsert
-- @params { repoId: number, conceptId: string, siteCount: number, minUnknown: number, bestSiteKey: string | null, reason: string | null, computedAt: number }
-- @row void
INSERT INTO gap (repo_id, concept_id, site_count, min_unknown, best_site_id, reason, status, computed_at)
VALUES (:repoId, :conceptId, :siteCount, :minUnknown,
        (SELECT id FROM concept_site WHERE repo_id = :repoId AND site_key = :bestSiteKey),
        :reason, 'open', :computedAt)
ON CONFLICT (repo_id, concept_id) DO UPDATE SET
  site_count = excluded.site_count, min_unknown = excluded.min_unknown,
  best_site_id = excluded.best_site_id, reason = excluded.reason,
  computed_at = excluded.computed_at;

-- 겹이 오르거나 사용처가 사라진 개념은 더 이상 구멍이 아니다.
-- @name derive.gap_delete_missing
-- @params { repoId: number, conceptIds: string[] }
-- @row void
DELETE FROM gap
WHERE repo_id = :repoId AND status = 'open'
  AND concept_id NOT IN (SELECT value FROM json_each(:conceptIds));
