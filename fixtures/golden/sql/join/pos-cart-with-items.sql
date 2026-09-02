-- 장바구니에 줄 수를 붙여 본다.
SELECT c.id, count(i.id) AS lines
FROM cart c
JOIN cart_item i ON i.cart_id = c.id
GROUP BY c.id;
