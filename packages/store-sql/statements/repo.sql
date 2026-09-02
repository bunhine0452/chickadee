-- 리포 등록·조회·이동·분리 (01 §3.2, §7).

-- @name repo.insert
-- @params { rootPath: string, name: string, defaultBranch: string | null, headSha: string | null, primaryLang: string | null, fingerprint: string, addedAt: number }
-- @row void
INSERT INTO repo (root_path, name, default_branch, head_sha, primary_lang, fingerprint, added_at)
VALUES (:rootPath, :name, :defaultBranch, :headSha, :primaryLang, :fingerprint, :addedAt);

-- @name repo.list
-- @params {}
-- @row { id: number, root_path: string, name: string, default_branch: string | null, head_sha: string | null, primary_lang: string | null, fingerprint: string, detached_at: number | null, added_at: number, last_ingest_at: number | null }
-- 별칭을 붙이지 않는다 (D57) — 02 §8.1 은 행이 **열 이름**으로 오는 것을 전제하고,
-- 그래야 테이블당 fromRow 하나가 성립한다.
SELECT id, root_path, name, default_branch, head_sha, primary_lang,
       fingerprint, detached_at, added_at, last_ingest_at
FROM repo ORDER BY added_at;

-- @name repo.update_path
-- @params { id: number, rootPath: string }
-- @row void
UPDATE repo SET root_path = :rootPath, detached_at = NULL WHERE id = :id;

-- @name repo.detach
-- @params { id: number, detachedAt: number }
-- @row void
UPDATE repo SET detached_at = :detachedAt WHERE id = :id;
