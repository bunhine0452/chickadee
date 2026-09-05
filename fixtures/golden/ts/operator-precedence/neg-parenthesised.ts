// 괄호가 순서를 적어 두어 섞인 자리가 없다.
export function total(price: number, quantity: number, shipping: number) {
  const goods = price * quantity;
  return goods + shipping;
}
