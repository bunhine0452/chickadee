// 곱셈이 왼쪽에 있어도 먼저 접힌다.
export function payable(price: number, rate: number, fee: number) {
  return price * rate - fee;
}
