// 수량만 바꾼 새 줄 — 원본은 그대로 두고 복사본 위에 덮어쓴다.
export function withQty(item: CartItem, qty: number) {
  return { ...item, qty };
}
