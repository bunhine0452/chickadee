// 곱셈이 먼저 접히고 그 값이 더해진다.
export function total(price: number, quantity: number, shipping: number) {
  return shipping + price * quantity;
}
