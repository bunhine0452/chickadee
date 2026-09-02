-- 설정은 SQLite 한 곳이 진실이다 (01 §7 — plugin-store 를 쓰지 않는 이유).

-- @name settings.get_all
-- @params {}
-- @row { key: string, value_json: string, updated_at: number }
SELECT key, value_json, updated_at FROM settings;

-- @name settings.set
-- @params { key: string, valueJson: string, updatedAt: number }
-- @row void
INSERT INTO settings (key, value_json, updated_at) VALUES (:key, :valueJson, :updatedAt)
ON CONFLICT (key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at;
