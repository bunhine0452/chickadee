// 물음표 점은 `.` 토큰이 아니라 optional_chain 노드다 — 같은 자리를 다른 개념이 맡는다.
export function orderSummary(order: Order) {
  const buyer = order?.buyer?.name;
  const city = order?.address?.city;
  return `${buyer} ${city}`;
}
