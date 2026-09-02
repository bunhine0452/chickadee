// 배지 문구 — 재고가 없으면 품절로 바꾼다.
export function badgeLabel(item: CartItem) {
  const stock = item.stock > 0 ? '재고 있음' : '품절';
  return item.qty > 1 ? `${stock} · ${item.qty}개` : stock;
}
