-- 표 하나만 읽는다 — 이을 곳이 없다.
SELECT sku, qty
FROM stock
WHERE qty < threshold
ORDER BY qty ASC;
