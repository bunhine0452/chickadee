-- 날짜별 매출 — 결제된 주문만 센다.
SELECT paid_on, sum(total) AS sales
FROM purchase_order
WHERE paid_on IS NOT NULL
GROUP BY paid_on;
