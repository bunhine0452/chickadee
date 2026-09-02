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

-- 리포 장부는 TS 가 조립한다 (D65) — 아래 세 개가 등록·삭제·인제스트 기록에 쓰인다.

-- @name repo.get_by_root
-- @params { rootPath: string }
-- @row { id: number, root_path: string, name: string, default_branch: string | null, head_sha: string | null, primary_lang: string | null, fingerprint: string, detached_at: number | null, added_at: number, last_ingest_at: number | null }
SELECT id, root_path, name, default_branch, head_sha, primary_lang, fingerprint,
       detached_at, added_at, last_ingest_at
FROM repo WHERE root_path = :rootPath;

-- @name repo.set_head
-- @params { id: number, headSha: string | null, fingerprint: string, primaryLang: string | null, lastIngestAt: number }
-- @row void
UPDATE repo SET head_sha = :headSha,
                fingerprint = CASE WHEN fingerprint = '' THEN :fingerprint ELSE fingerprint END,
                primary_lang = COALESCE(:primaryLang, primary_lang),
                detached_at = NULL,
                last_ingest_at = :lastIngestAt
WHERE id = :id;

-- 리포를 지운다. 사실·파생은 함께 사라지고 카드는 은퇴만 시킨다 (D31) — 은퇴는 별도 statement.
-- @name repo.remove
-- @params { id: number }
-- @row void
DELETE FROM repo WHERE id = :id;

-- @name repo.purge_facts
-- @params { id: number }
-- @row void
DELETE FROM file WHERE repo_id = :id;

-- @name repo.purge_derived
-- @params { id: number }
-- @row void
DELETE FROM concept_site WHERE repo_id = :id;

-- @name repo.purge_units
-- @params { id: number }
-- @row void
DELETE FROM unit WHERE repo_id = :id;

-- @name repo.purge_gaps
-- @params { id: number }
-- @row void
DELETE FROM gap WHERE repo_id = :id;

-- @name repo.purge_commits
-- @params { id: number }
-- @row void
DELETE FROM git_commit WHERE repo_id = :id;

-- @name repo.purge_runs
-- @params { id: number }
-- @row void
DELETE FROM ingest_run WHERE repo_id = :id;

-- 카드는 지우지 않고 은퇴시킨다 — review_log.card_id 가 NOT NULL 이다 (D31).
-- @name repo.retire_cards
-- @params { id: number, at: number }
-- @row void
UPDATE card SET retired_at = :at WHERE repo_id = :id AND retired_at IS NULL;
