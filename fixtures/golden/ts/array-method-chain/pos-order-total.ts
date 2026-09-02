// 배송비 줄을 뺀 주문 합계 — 거른 결과에 바로 접기를 붙인다.
export function orderTotal(lines: OrderLine[]) {
  return lines
    .filter((line) => line.kind === 'item')
    .reduce((sum, line) => sum + line.price * line.qty, 0);
}
