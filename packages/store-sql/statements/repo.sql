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

-- 서가 화면 한 벌 (D119 · 05 §2.1 `repos`). 리포마다 한 번씩 묻지 않는다 —
-- `listRepos()` 는 상태를 알려고 리포마다 `repo_probe` 를 부르므로 목록이 리포 수에
-- 비례해 느려진다. 여기서는 등록된 전부를 **한 번에** 긷고, 폴더가 실제로 있는지만
-- 화면이 그린 뒤에 따로 확인한다.
--
-- `due_n` 은 오늘 큐의 **복습 몫**이다. 새 개념 몫은 `new_per_day` 상한과 선행 판정이
-- 걸려 TS 가 정하므로(02 §6.2) SQL 이 셀 수 있는 것이 아니다 — 화면도 「오늘 만기」로
-- 적고 「오늘 N판」이라고 말하지 않는다.
-- @name repo.overview
-- @params { eod: number, day: string }
-- @row { id: number, root_path: string, name: string, fingerprint: string, detached_at: number | null, added_at: number, last_ingest_at: number | null, concepts: number, avg_layer: number | null, due_n: number }
WITH placed AS (
  SELECT u.repo_id AS repo_id, n.concept_id AS concept_id
  FROM unit u JOIN unit_node n ON n.unit_id = u.id
  GROUP BY u.repo_id, n.concept_id
),
ink AS (
  SELECT p.repo_id AS repo_id, COUNT(*) AS concepts, AVG(COALESCE(m.layer, 0)) AS avg_layer
  FROM placed p LEFT JOIN mastery m ON m.concept_id = p.concept_id
  GROUP BY p.repo_id
),
due AS (
  SELECT k.repo_id AS repo_id, COUNT(DISTINCT m.concept_id) AS due_n
  FROM card k JOIN mastery m ON m.concept_id = k.concept_id
  WHERE k.retired_at IS NULL AND m.state <> 0 AND m.due_at <= :eod
    AND NOT EXISTS (SELECT 1 FROM review_log r WHERE r.concept_id = m.concept_id
                    AND r.day_key = :day AND r.ok = 1)
  GROUP BY k.repo_id
)
SELECT r.id, r.root_path, r.name, r.fingerprint, r.detached_at, r.added_at, r.last_ingest_at,
       COALESCE(ink.concepts, 0) AS concepts, ink.avg_layer, COALESCE(due.due_n, 0) AS due_n
FROM repo r
LEFT JOIN ink ON ink.repo_id = r.id
LEFT JOIN due ON due.repo_id = r.id
ORDER BY r.added_at;
