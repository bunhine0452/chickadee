// 처리 중인 주문만 남긴다 — 길이가 줄 수 있다는 것이 map 과의 차이다.
export function openOrders(orders: Order[]) {
  return orders.filter((order) => order.status !== 'done');
}
