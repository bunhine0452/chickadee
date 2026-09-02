// 기다릴 것이 없는 계산.
export function cartTotal(items: CartItem[]) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.qty;
  }
  return total;
}
