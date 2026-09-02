-- 스키마 자체를 들여다보는 statement. 마이그레이션 검증·개발 패널이 쓴다.

-- @name store.table_names
-- @params {}
-- @row { name: string }
SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;
