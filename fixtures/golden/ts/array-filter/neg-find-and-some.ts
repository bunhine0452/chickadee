// find 는 항목 하나, some 은 참·거짓 — 둘 다 새 배열을 만들지 않는다.
export function firstOpen(orders: Order[]) {
  const found = orders.find((order) => order.status === 'open');
  const anyOpen = orders.some((order) => order.status === 'open');
  return { found, anyOpen };
}
