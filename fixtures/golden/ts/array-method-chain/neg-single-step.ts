// 한 단짜리 두 개 — 앞 단계가 돌려준 배열에 이어 붙인 자리가 없다.
export function listNames(items: CartItem[], orders: Order[]) {
  const names = items.map((item) => item.name);
  const open = orders.filter((order) => order.status === 'open');
  return { names, open };
}
