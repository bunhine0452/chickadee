// 타입 자리를 적지 않은 호출들.
export function orderIds(orders: Order[]) {
  const ids = orders.map((order) => order.id);
  return ids.join(',');
}
