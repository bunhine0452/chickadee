-- T1 필사 단위 (02 `block` · 04 §3.1). 블록 후보는 `_blocks` 캡처에서 나오고 분절·순위·
-- 마스크는 `@chickadee/cards` 가 정한다 — 여기 있는 것은 그 결과를 담고 되찾는 문장뿐이다.
-- 열 별칭을 붙이지 않는다 (D57).

-- 인제스트가 낸 블록 하나. `UNIQUE (file_id, line_start, text_hash)` 라 같은 본문이 같은
-- 자리에 다시 오면 같은 행이다 — 줄이 밀리면 새 행이 되고 옛 행은 `block.retire_missing`
-- 이 죽인다. `ast_json` 은 선정 시점에 `parse_snippet` 으로 채운다 (D14).
-- upsert 로 두는 이유: 두 번째 인제스트에서 `ast_json` 만 새로 채우는 일이 흔하다.
-- @name block.upsert
-- @params { repoId: number, fileId: number, rev: string | null, name: string, kind: string, lineStart: number, lineEnd: number, textHash: string, astJson: string | null, updatedAt: number }
-- @row void
INSERT INTO block (repo_id, file_id, rev, name, kind, line_start, line_end,
                   text_hash, ast_json, is_alive, updated_at)
VALUES (:repoId, :fileId, :rev, :name, :kind, :lineStart, :lineEnd,
        :textHash, :astJson, 1, :updatedAt)
ON CONFLICT (file_id, line_start, text_hash) DO UPDATE SET
  name = excluded.name, kind = excluded.kind, line_end = excluded.line_end,
  rev = excluded.rev,
  -- 이미 있는 AST 를 `null` 로 덮지 않는다 — 캐시를 다시 파싱하려고 지우는 일은 없다.
  ast_json = COALESCE(excluded.ast_json, block.ast_json),
  is_alive = 1, updated_at = excluded.updated_at;

-- 선정 시점에 파싱한 원본 AST 를 캐시한다 (04 §3.1 · D14).
-- @name block.ast_set
-- @params { id: number, astJson: string | null }
-- @row void
UPDATE block SET ast_json = :astJson WHERE id = :id;

-- @name block.get
-- @params { id: number }
-- @row { id: number, repo_id: number, file_id: number, rev: string | null, name: string, kind: string, line_start: number, line_end: number, text_hash: string, ast_json: string | null, is_alive: number, updated_at: number, path: string }
SELECT b.id, b.repo_id, b.file_id, b.rev, b.name, b.kind, b.line_start, b.line_end,
       b.text_hash, b.ast_json, b.is_alive, b.updated_at, f.path
FROM block b JOIN file f ON f.id = b.file_id WHERE b.id = :id;

-- 한 파일의 살아 있는 블록. 인제스트가 새로 낸 것과 대조해 사라진 것을 죽인다.
-- @name block.by_file
-- @params { fileId: number }
-- @row { id: number, repo_id: number, file_id: number, rev: string | null, name: string, kind: string, line_start: number, line_end: number, text_hash: string, ast_json: string | null, is_alive: number, updated_at: number }
SELECT id, repo_id, file_id, rev, name, kind, line_start, line_end, text_hash,
       ast_json, is_alive, updated_at
FROM block WHERE file_id = :fileId AND is_alive = 1 ORDER BY line_start;

-- 이번 인제스트가 낸 블록에 없는 것은 죽인다. `keep` 은 **`text_hash` 목록**이다 — upsert 를
-- 미리 만들어 보내는 batch 안에서는 새 행의 id 를 알 방법이 없다(D77 과 같은 이유).
-- @name block.retire_missing
-- @params { fileId: number, keep: string, at: number }
-- @row void
UPDATE block SET is_alive = 0, updated_at = :at
WHERE file_id = :fileId AND is_alive = 1
  AND text_hash NOT IN (SELECT value FROM json_each(:keep));

-- T1 판을 걸 때의 블록 후보 (04 §3.1 순위). 겹 평균·ly 0 개념 수·최근 커밋은 TS 가 재므로
-- 여기서는 **후보와 그 안의 개념 사용처**만 준다 — 이 리포의 파일에 살아 있는 것으로 좁힌다.
-- `concepts_json` 은 블록 줄 범위에 걸친 개념의 `(id, 겹, 사용처 수)` 목록이다.
-- @name block.candidates
-- @params { repoId: number, limit: number }
-- @row { id: number, file_id: number, path: string, grammar: string | null, rev: string | null, name: string, kind: string, line_start: number, line_end: number, text_hash: string, ast_json: string | null, lines_n: number, last_commit_at: number | null, concepts_json: string }
SELECT b.id, b.file_id, f.path, f.grammar, b.rev, b.name, b.kind, b.line_start, b.line_end,
       b.text_hash, b.ast_json,
       (b.line_end - b.line_start + 1) AS lines_n,
       (SELECT MAX(c.authored_at) FROM concept_site s
          JOIN git_commit c ON c.id = s.commit_id
         WHERE s.file_id = b.file_id AND s.is_alive = 1
           AND s.line_start <= b.line_end AND s.line_end >= b.line_start) AS last_commit_at,
       (SELECT COALESCE(json_group_array(json_object(
                 'conceptId', t.concept_id,
                 'layer', t.layer,
                 'siteCount', t.n,
                 'siteId', t.site_id)), '[]')
          FROM (SELECT s.concept_id AS concept_id,
                       COALESCE(m.layer, 0) AS layer,
                       COUNT(*) AS n,
                       MIN(s.id) AS site_id
                  FROM concept_site s
                  LEFT JOIN mastery m ON m.concept_id = s.concept_id
                 WHERE s.file_id = b.file_id AND s.is_alive = 1
                   AND s.line_start <= b.line_end AND s.line_end >= b.line_start
                 GROUP BY s.concept_id) t) AS concepts_json
FROM block b JOIN file f ON f.id = b.file_id
WHERE b.repo_id = :repoId AND b.is_alive = 1 AND f.is_alive = 1
ORDER BY b.id
LIMIT :limit;

-- T1 카드의 부수 개념 (02 `card_concept`). 대표 개념만 겹에 반영되고 나머지는 여기 남는다
-- (D27) — 미지 개념 계산이 이 행들을 읽는다.
-- @name block.card_concept_insert
-- @params { cardId: number, conceptId: string }
-- @row void
INSERT INTO card_concept (card_id, concept_id, role) VALUES (:cardId, :conceptId, 'secondary')
ON CONFLICT (card_id, concept_id) DO NOTHING;
