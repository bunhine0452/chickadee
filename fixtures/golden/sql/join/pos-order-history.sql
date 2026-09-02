-- 주문 이력에 쿠폰을 곁들인다 — 쿠폰이 없는 주문도 남긴다.
SELECT o.id, o.total, p.code
FROM purchase_order o
JOIN cart c ON c.id = o.cart_id
LEFT JOIN coupon p ON p.cart_id = c.id
ORDER BY o.paid_on DESC;
