// 영수증 — 취소된 줄을 뺀 다음 한 덩어리 문자열로 접는다.
export function receiptLines(items: CartItem[]) {
  return items
    .filter((item) => item.qty > 0)
    .map((item) => `${item.name} x${item.qty}`)
    .join('\n');
}
