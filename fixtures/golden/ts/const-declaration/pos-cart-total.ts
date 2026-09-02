// 장바구니 합계 — 부가세를 더해 최종 금액을 만든다.
const TAX_RATE = 0.1;

export function cartTotal(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  return subtotal + tax;
}
