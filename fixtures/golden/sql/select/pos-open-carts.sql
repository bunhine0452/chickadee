-- 아직 결제하지 않은 장바구니 목록.
SELECT c.id, c.user_id, c.status
FROM cart c
WHERE c.status = 'open'
ORDER BY c.id DESC;
