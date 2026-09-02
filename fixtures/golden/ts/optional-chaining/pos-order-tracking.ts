// 주문 추적 — 배송 단계가 아직 안 붙은 주문이 섞여 있다.
export function latestStep(order: Order, index: number) {
  const step = order.shipping?.steps?.[index];
  const carrier = order.shipping?.['carrierCode'];
  return step?.label ?? carrier;
}
