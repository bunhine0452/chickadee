-- 표는 이미 있고 색인과 뷰만 얹는다.
CREATE INDEX cart_item_cart_id ON cart_item (cart_id);

CREATE VIEW open_cart AS
SELECT id, user_id FROM cart WHERE status = 'open';
