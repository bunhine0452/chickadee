-- 읽는 문장이 하나도 없는 마이그레이션 뒷정리.
INSERT INTO cart (user_id, status) VALUES (7, 'open');
UPDATE cart SET status = 'paid' WHERE id = 12;
DELETE FROM cart_item WHERE cart_id = 12;
