// 같은 값을 점으로 하나씩 꺼낸 판 — 중괄호가 없다.
export function shippingLine(order: Order) {
  const courier = order.shipping.courier;
  const tracking = order.shipping.tracking;
  return `${courier} ${tracking}`;
}
