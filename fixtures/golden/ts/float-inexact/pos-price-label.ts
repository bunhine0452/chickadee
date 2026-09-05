// 화면에 보일 금액만 자릿수를 자른다.
export function priceLabel(amount: number, rate: number) {
  const withTax = amount * rate;
  return `${withTax.toFixed(2)} won`;
}
