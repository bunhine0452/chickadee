-- 성능 표본 (06 §8). 릴리스 빌드에는 DevTools 가 없어 재는 자가 앱 안에 있어야 하고,
-- 그 결과를 담는 곳이 이 표다. 최근 500행만 남긴다 — 기록이 목적이 아니라 추세가 목적이다.

-- @name perf.insert
-- @params { kind: string, ms: number, n: number, at: number }
-- @row void
INSERT INTO perf_sample (kind, ms, n, at) VALUES (:kind, :ms, :n, :at);

-- @name perf.list
-- @params { limit: number }
-- @row { id: number, kind: string, ms: number, n: number, at: number }
SELECT id, kind, ms, n, at FROM perf_sample ORDER BY id DESC LIMIT :limit;

-- 500행 순환. 지우는 쪽이 넣는 쪽보다 드물어도 되므로 세션 끝에 한 번 부른다.
-- @name perf.trim
-- @params { keep: number }
-- @row void
DELETE FROM perf_sample
WHERE id <= (SELECT MAX(id) FROM perf_sample) - :keep;
