// 주문 상태 코드를 사람이 읽는 문구로 바꾼다.
const LABELS = {
  paid: '결제 완료',
  shipped: '배송 중',
  done: '수령 완료',
};

export function orderLabel(order: Order) {
  const label = LABELS[order.status];
  return label;
}
