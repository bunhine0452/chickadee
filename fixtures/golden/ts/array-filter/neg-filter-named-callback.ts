// 조건을 이름 붙인 함수로 빼 둔 판 — 인자 자리에 화살표가 없다.
function isOpen(order: Order) {
  return order.status !== 'done';
}

export function openOrders(orders: Order[]) {
  return orders.filter(isOpen);
}
