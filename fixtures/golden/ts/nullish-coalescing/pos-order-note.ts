// 영수증 비고 — 빈 메모는 사용자가 비운 것이므로 기본 문구로 덮지 않는다.
export function receiptNote(order: Order) {
  const memo = order.memo ?? '';
  const courier = order.shipping?.courier ?? '미배정';
  return `${memo} / ${courier}`;
}
