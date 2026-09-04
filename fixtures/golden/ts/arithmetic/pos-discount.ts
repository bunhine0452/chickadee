// 할인 계산 — 새 값 둘이 생긴다.
export function discounted(price: number, rate: number) {
  const off = price * rate;
  const final = price - off;
  return final;
}
