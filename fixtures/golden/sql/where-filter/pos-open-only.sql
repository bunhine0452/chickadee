-- 열린 장바구니만 남긴다.
SELECT id, user_id
FROM cart
WHERE status = 'open';
