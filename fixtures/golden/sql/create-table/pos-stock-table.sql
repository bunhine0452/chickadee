-- 마이그레이션 0007 — 재고 표를 뒤늦게 나눈다.
CREATE TABLE stock (
  sku TEXT PRIMARY KEY,
  qty INTEGER NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 5
);
