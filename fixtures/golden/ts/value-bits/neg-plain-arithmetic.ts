// 셈만 하고 비트는 안 만진다.
export function total(price: number, quantity: number, shipping: number) {
  const subtotal = price * quantity;
  return subtotal + shipping - 100;
}
