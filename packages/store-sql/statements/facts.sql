-- Rust 사실 층이 이름으로만 실행하는 statement (01 §3.3).
-- 기동 시 이 이름들이 전부 카탈로그에 있어야 하며, 없으면 STORE_CATALOG_MISSING 이다.
-- Rust 는 SQL 을 한 줄도 갖지 않는다 — 여기가 유일한 출처다.

-- @name facts.file_upsert
-- @params { repoId: number, path: string, lang: string | null, grammar: string | null, lineCount: number, byteSize: number, contentHash: string | null, headOid: string | null, isDirty: boolean, parseQuality: 'ok' | 'poor' | null, skipReason: string | null, updatedAt: number }
-- @row void
INSERT INTO file (repo_id, path, lang, grammar, line_count, byte_size,
                  content_hash, head_oid, is_dirty, parse_quality, skip_reason, is_alive, updated_at)
VALUES (:repoId, :path, :lang, :grammar, :lineCount, :byteSize,
        :contentHash, :headOid, :isDirty, :parseQuality, :skipReason, 1, :updatedAt)
ON CONFLICT (repo_id, path) DO UPDATE SET
  lang = excluded.lang, grammar = excluded.grammar,
  line_count = excluded.line_count, byte_size = excluded.byte_size,
  content_hash = excluded.content_hash, head_oid = excluded.head_oid,
  is_dirty = excluded.is_dirty, parse_quality = excluded.parse_quality,
  skip_reason = excluded.skip_reason, is_alive = 1, updated_at = excluded.updated_at;

-- @name facts.file_mark_deleted
-- @params { repoId: number, path: string, updatedAt: number }
-- @row void
UPDATE file SET is_alive = 0, updated_at = :updatedAt
WHERE repo_id = :repoId AND path = :path;

-- 파일 id 는 Rust 가 들고 다니지 않는다 — 이름 하나로 찾는 일은 SQL 이 한다 (D65).
-- @name facts.file_hashes
-- @params { repoId: number }
-- @row { path: string, content_hash: string | null }
SELECT path, content_hash FROM file WHERE repo_id = :repoId AND is_alive = 1;

-- @name facts.capture_delete_by_file
-- @params { repoId: number, path: string }
-- @row void
DELETE FROM capture WHERE file_id = (SELECT id FROM file WHERE repo_id = :repoId AND path = :path);

-- @name facts.capture_insert
-- @params { repoId: number, path: string, queryId: string, matchId: number, patternIndex: number, name: string, form: string | null, nodeKind: string, inError: boolean, startByte: number, endByte: number, startLine: number, endLine: number, startCol: number, endCol: number, excerpt: string }
-- @row void
INSERT INTO capture (file_id, query_id, match_id, pattern_index, name, form, node_kind, in_error,
                     start_byte, end_byte, start_line, end_line, start_col, end_col, excerpt)
VALUES ((SELECT id FROM file WHERE repo_id = :repoId AND path = :path),
        :queryId, :matchId, :patternIndex, :name, :form, :nodeKind, :inError,
        :startByte, :endByte, :startLine, :endLine, :startCol, :endCol, :excerpt);

-- @name facts.commit_insert
-- @params { repoId: number, sha: string, parentSha: string | null, parentCount: number, authoredAt: number, authorEmail: string | null, authorName: string | null, message: string, truncated: boolean, filesN: number, insertions: number, deletions: number }
-- @row void
INSERT INTO git_commit (repo_id, sha, parent_sha, parent_count, authored_at, author_email, author_name,
                        message, truncated, files_n, insertions, deletions)
VALUES (:repoId, :sha, :parentSha, :parentCount, :authoredAt, :authorEmail, :authorName,
        :message, :truncated, :filesN, :insertions, :deletions)
ON CONFLICT (repo_id, sha) DO UPDATE SET
  parent_sha = excluded.parent_sha, parent_count = excluded.parent_count,
  authored_at = excluded.authored_at, author_email = excluded.author_email,
  author_name = excluded.author_name, message = excluded.message,
  truncated = excluded.truncated, files_n = excluded.files_n,
  insertions = excluded.insertions, deletions = excluded.deletions;

-- @name facts.commit_file_insert
-- @params { repoId: number, sha: string, path: string, oldPath: string | null, status: 'A' | 'M' | 'D' | 'R', additions: number, deletions: number, touchedJson: string }
-- @row void
INSERT INTO commit_file (commit_id, path, old_path, status, additions, deletions, touched_json)
VALUES ((SELECT id FROM git_commit WHERE repo_id = :repoId AND sha = :sha),
        :path, :oldPath, :status, :additions, :deletions, :touchedJson)
ON CONFLICT (commit_id, path) DO UPDATE SET
  old_path = excluded.old_path, status = excluded.status,
  additions = excluded.additions, deletions = excluded.deletions,
  touched_json = excluded.touched_json;

-- rebase·force-push 로 닿을 수 없게 된 커밋. 지우지 않는다 — 학습 기록이 참조한다 (03 §1.6).
-- @name facts.commit_mark_unreachable
-- @params { repoId: number, shas: string[] }
-- @row void
UPDATE git_commit SET is_reachable = 0
WHERE repo_id = :repoId AND sha IN (SELECT value FROM json_each(:shas));

-- @name facts.run_start
-- @params { repoId: number, startedAt: number, mode: 'full' | 'incremental', headSha: string | null, appVersion: string | null }
-- @row void
INSERT INTO ingest_run (repo_id, started_at, mode, head_sha, status, app_version)
VALUES (:repoId, :startedAt, :mode, :headSha, 'running', :appVersion);

-- @name facts.run_finish
-- @params { id: number, finishedAt: number, status: 'done' | 'failed' | 'cancelled', filesN: number, sitesN: number, capturesN: number, commitsN: number, warningsN: number, peakRssMb: number | null, escalatedToFull: boolean, grammarVersionsJson: string | null, queryHash: string | null, dictVersion: string | null, dictSchema: number | null, genVersion: number | null, fingerprint: string | null, error: string | null }
-- @row void
UPDATE ingest_run SET
  finished_at = :finishedAt, status = :status, files_n = :filesN, sites_n = :sitesN,
  captures_n = :capturesN, commits_n = :commitsN, warnings_n = :warningsN,
  peak_rss_mb = :peakRssMb, escalated_to_full = :escalatedToFull,
  grammar_versions_json = :grammarVersionsJson, query_hash = :queryHash,
  dict_version = :dictVersion, dict_schema = :dictSchema, gen_version = :genVersion,
  fingerprint = :fingerprint, error = :error
WHERE id = :id;

-- @name facts.run_stamp
-- @params { repoId: number, sitesN: number, grammarVersionsJson: string, queryHash: string, dictVersion: string, dictSchema: number, genVersion: number, fingerprint: string }
-- @row void
-- 06 §6.3 — 파생 층이 인제스트 끝에 채우는 다섯 값과 그 지문. Rust 는 이 다섯을 모른다
-- (사전·생성기는 TS 것이다) 그래서 `facts.run_finish` 는 null 로 두고 여기서 덮는다.
-- 대상은 그 리포의 **마지막 실행 한 줄**이다 — 잡 id 를 파생 층까지 들고 다니지 않는다.
UPDATE ingest_run SET
  sites_n = :sitesN,
  grammar_versions_json = :grammarVersionsJson, query_hash = :queryHash,
  dict_version = :dictVersion, dict_schema = :dictSchema, gen_version = :genVersion,
  fingerprint = :fingerprint
WHERE id = (SELECT id FROM ingest_run WHERE repo_id = :repoId ORDER BY id DESC LIMIT 1);
