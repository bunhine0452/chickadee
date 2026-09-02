// 수량만 바꾼 새 배열을 만든다 — 원본은 그대로 둔다.
export function setQty(items: CartItem[], id: string, qty: number) {
  return items.map((item) => (item.id === id ? { ...item, qty } : item));
}
