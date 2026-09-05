// 값 둘로 새 값을 만드는 자리들.
export function orderTotal(price: number, quantity: number, shipping: number) {
  const subtotal = price * quantity;
  const total = subtotal + shipping;
  return total;
}
