-- 최근 주문만 남긴다.
SELECT id, total, paid_on
FROM purchase_order
WHERE paid_on > '2026-01-01'
ORDER BY paid_on DESC
LIMIT 50;
