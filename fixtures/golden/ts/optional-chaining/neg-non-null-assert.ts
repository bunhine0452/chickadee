// 느낌표는 「없을 리 없다」는 타입 단언이라 실행 중에는 아무것도 막지 않는다.
export function shippingLabel(order: Order) {
  if (!order.shipping) {
    return '배송 준비 중';
  }
  const step = order.shipping!.steps[0];
  return step.label;
}
