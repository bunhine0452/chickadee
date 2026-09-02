// 더하기로 이은 판 — 백틱이 없다.
export function receiptLine(item: CartItem) {
  return item.name + ' × ' + item.qty + '개';
}
