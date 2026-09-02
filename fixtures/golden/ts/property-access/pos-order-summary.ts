// 주문 요약 — 점 하나로 값 안의 이름을 꺼낸다.
export function orderSummary(order: Order) {
  const buyer = order.buyer.name;
  const city = order.address.city;
  const total = order.payment.amount + order.payment.fee;
  return `${buyer} · ${city} · ${total}`;
}
