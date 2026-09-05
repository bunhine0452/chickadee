-- 데이터베이스 스키마 (D169 · 0009). DDL 의 표·열·외래키와 매퍼의 열 ↔ 필드 대응.
-- 열 별칭을 붙이지 않는다 (D57).

-- ───────── 쓰기 ─────────

-- @name schema.clear_bindings
-- @params { repoId: number }
-- @row void
DELETE FROM db_binding WHERE repo_id = :repoId;

-- @name schema.clear_fks
-- @params { repoId: number }
-- @row void
DELETE FROM db_fk WHERE table_id IN (SELECT id FROM db_table WHERE repo_id = :repoId);

-- @name schema.clear_columns
-- @params { repoId: number }
-- @row void
DELETE FROM db_column WHERE table_id IN (SELECT id FROM db_table WHERE repo_id = :repoId);

-- @name schema.clear_tables
-- @params { repoId: number }
-- @row void
DELETE FROM db_table WHERE repo_id = :repoId;

-- @name schema.table_insert
-- @params { repoId: number, name: string, fileId: number, line: number }
-- @row void
INSERT INTO db_table (repo_id, name, file_id, line) VALUES (:repoId, :name, :fileId, :line);

-- @name schema.column_insert
-- @params { repoId: number, tableName: string, ord: number, name: string, type: string, notNull: number, defaultValue: string | null, line: number }
-- @row void
INSERT INTO db_column (table_id, ord, name, type, not_null, default_value, line)
VALUES (
  (SELECT id FROM db_table WHERE repo_id = :repoId AND name = :tableName),
  :ord, :name, :type, :notNull, :defaultValue, :line
);

-- @name schema.fk_insert
-- @params { repoId: number, tableName: string, columnName: string, refTable: string, refColumn: string, line: number }
-- @row void
INSERT OR IGNORE INTO db_fk (table_id, column_name, ref_table, ref_column, line)
VALUES (
  (SELECT id FROM db_table WHERE repo_id = :repoId AND name = :tableName),
  :columnName, :refTable, :refColumn, :line
);

-- @name schema.binding_insert
-- @params { repoId: number, fileId: number, line: number, columnName: string, property: string, entity: string, entityFileId: number | null, tableName: string | null }
-- @row void
INSERT OR REPLACE INTO db_binding (repo_id, file_id, line, column_name, property, entity, entity_file_id, table_id)
VALUES (
  :repoId, :fileId, :line, :columnName, :property, :entity, :entityFileId,
  (SELECT id FROM db_table WHERE repo_id = :repoId AND name = :tableName)
);

-- ───────── 읽기 ─────────

-- @name schema.tables
-- @params { repoId: number }
-- @row { id: number, name: string, file_id: number, path: string, line: number, column_count: number }
SELECT t.id, t.name, t.file_id, f.path, t.line,
  (SELECT COUNT(*) FROM db_column c WHERE c.table_id = t.id) AS column_count
FROM db_table t JOIN file f ON f.id = t.file_id
WHERE t.repo_id = :repoId
ORDER BY t.name;

-- @name schema.columns
-- @params { tableId: number }
-- @row { ord: number, name: string, type: string, not_null: number, default_value: string | null, line: number }
SELECT ord, name, type, not_null, default_value, line
FROM db_column WHERE table_id = :tableId ORDER BY ord;

-- @name schema.fks
-- @params { repoId: number }
-- @row { table_id: number, table_name: string, column_name: string, ref_table: string, ref_column: string, line: number }
SELECT k.table_id, t.name AS table_name, k.column_name, k.ref_table, k.ref_column, k.line
FROM db_fk k JOIN db_table t ON t.id = k.table_id
WHERE t.repo_id = :repoId
ORDER BY t.name, k.line;

-- 열 하나가 어느 필드로 가나 — 3단 `origin` 의 재료.
-- @name schema.bindings
-- @params { repoId: number }
-- @row { file_id: number, path: string, line: number, column_name: string, property: string, entity: string, entity_file_id: number | null, table_id: number | null, table_name: string | null }
SELECT b.file_id, f.path, b.line, b.column_name, b.property, b.entity, b.entity_file_id, b.table_id, t.name AS table_name
FROM db_binding b
JOIN file f ON f.id = b.file_id
LEFT JOIN db_table t ON t.id = b.table_id
WHERE b.repo_id = :repoId
ORDER BY f.path, b.line, b.column_name;
