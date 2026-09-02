// 배송 정보 — 쓸 칸만 이름으로 꺼낸다. 순서는 상관없다.
export function shippingLine(order: Order) {
  const { courier, tracking } = order.shipping;
  const { city, zip } = order.address;
  return `${courier} ${tracking} ${city} ${zip}`;
}
