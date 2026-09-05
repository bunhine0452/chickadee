-- 요청 줄기와 죽은 갈래 (D168 · 0009). 인제스트가 쓰고 2단 추적·챕터 화면·졸업 과제가 읽는다.
-- 열 별칭을 붙이지 않는다 (D57).

-- ───────── 쓰기 ─────────

-- 리포의 줄기를 통째로 다시 쓴다. 줄기는 캡처에서 매번 다시 서므로 증분이 없다.
-- @name path.clear
-- @params { repoId: number }
-- @row void
DELETE FROM request_hop WHERE path_id IN (SELECT id FROM request_path WHERE repo_id = :repoId);

-- @name path.clear_paths
-- @params { repoId: number }
-- @row void
DELETE FROM request_path WHERE repo_id = :repoId;

-- 대지는 이름으로 꽂는다 — `unit_file_insert` 와 같은 수다. 없으면 NULL.
-- @name path.insert
-- @params { repoId: number, unitName: string | null, entryFileId: number, entryLine: number, label: string, hopCount: number, updatedAt: number }
-- @row void
INSERT INTO request_path (repo_id, unit_id, entry_file_id, entry_line, label, hop_count, updated_at)
VALUES (
  :repoId,
  (SELECT id FROM unit WHERE repo_id = :repoId AND name = :unitName),
  :entryFileId, :entryLine, :label, :hopCount, :updatedAt
);

-- @name path.hop_insert
-- @params { repoId: number, entryFileId: number, entryLine: number, ord: number, fileId: number, name: string, lineStart: number, lineEnd: number, calledLine: number | null, depth: number, kind: 'call' | 'http' | 'mapper' | null }
-- @row void
INSERT INTO request_hop (path_id, ord, file_id, name, line_start, line_end, called_line, depth, kind)
VALUES (
  (SELECT id FROM request_path WHERE repo_id = :repoId AND entry_file_id = :entryFileId AND entry_line = :entryLine),
  :ord, :fileId, :name, :lineStart, :lineEnd, :calledLine, :depth, :kind
);

-- ───────── 읽기 ─────────

-- 대지 하나의 줄기들. `entry_line` 순 — 파일 안에서 위에 적힌 호출이 먼저다.
-- @name path.list_by_unit
-- @params { unitId: number }
-- @row { id: number, entry_file_id: number, path: string, entry_line: number, label: string, hop_count: number }
SELECT p.id, p.entry_file_id, f.path, p.entry_line, p.label, p.hop_count
FROM request_path p JOIN file f ON f.id = p.entry_file_id
WHERE p.unit_id = :unitId
ORDER BY f.path, p.entry_line;

-- @name path.list_by_repo
-- @params { repoId: number }
-- @row { id: number, unit_id: number | null, entry_file_id: number, path: string, entry_line: number, label: string, hop_count: number }
SELECT p.id, p.unit_id, p.entry_file_id, f.path, p.entry_line, p.label, p.hop_count
FROM request_path p JOIN file f ON f.id = p.entry_file_id
WHERE p.repo_id = :repoId
ORDER BY f.path, p.entry_line;

-- 줄기 하나의 칸들 — 실행 순서대로.
-- @name path.hops
-- @params { pathId: number }
-- @row { ord: number, file_id: number, path: string, name: string, line_start: number, line_end: number, called_line: number | null, depth: number, kind: 'call' | 'http' | 'mapper' | null }
SELECT h.ord, h.file_id, f.path, h.name, h.line_start, h.line_end, h.called_line, h.depth, h.kind
FROM request_hop h JOIN file f ON f.id = h.file_id
WHERE h.path_id = :pathId
ORDER BY h.ord;

-- 대지 하나가 실제로 도는 줄 범위 — 챕터가 「이 파일의 이 줄들만」을 보여 주는 재료 (D168 ④).
-- 파일 하나가 1,527줄이어도 로그인은 그중 핸들러 한 블록이다.
-- @name path.ranges_by_unit
-- @params { unitId: number }
-- @row { file_id: number, path: string, name: string, line_start: number, line_end: number }
SELECT DISTINCT h.file_id, f.path, h.name, h.line_start, h.line_end
FROM request_hop h
JOIN request_path p ON p.id = h.path_id
JOIN file f ON f.id = h.file_id
WHERE p.unit_id = :unitId
ORDER BY f.path, h.line_start;

-- ───────── 죽은 갈래 ─────────

-- @name path.dead_clear
-- @params { repoId: number }
-- @row void
DELETE FROM dead_branch WHERE repo_id = :repoId;

-- @name path.dead_insert
-- @params { repoId: number, kind: 'unreached-call' | 'uncalled-route' | 'uncalled-export' | 'orphan-file', fileId: number, line: number | null, label: string }
-- @row void
INSERT INTO dead_branch (repo_id, kind, file_id, line, label)
VALUES (:repoId, :kind, :fileId, :line, :label);

-- @name path.dead_list
-- @params { repoId: number }
-- @row { id: number, kind: 'unreached-call' | 'uncalled-route' | 'uncalled-export' | 'orphan-file', file_id: number, path: string, line: number | null, label: string }
SELECT d.id, d.kind, d.file_id, f.path, d.line, d.label
FROM dead_branch d JOIN file f ON f.id = d.file_id
WHERE d.repo_id = :repoId
ORDER BY d.kind, f.path, d.line, d.label;
