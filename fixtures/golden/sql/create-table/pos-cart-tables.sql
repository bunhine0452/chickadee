-- 마이그레이션 0001 — 장바구니와 그 줄.
CREATE TABLE cart (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
);

CREATE TABLE cart_item (
  id INTEGER PRIMARY KEY,
  cart_id INTEGER NOT NULL,
  sku TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1
);
