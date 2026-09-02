// 중괄호는 이름으로 꺼내는 것이라 자리로 꺼내는 대괄호와 다른 개념이다.
export function shippingLine(order: Order) {
  const { courier, tracking } = order.shipping;
  return `${courier} ${tracking}`;
}
