-- 거르는 자리가 없다 — 정렬과 개수 제한만 있다.
SELECT sku, qty
FROM stock
ORDER BY qty ASC
LIMIT 20;
