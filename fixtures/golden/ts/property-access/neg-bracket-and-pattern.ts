// 대괄호와 구조 분해 — 값 안의 이름을 꺼내지만 점이 없다.
export function stockAlert(item: StockItem, policy: Policy) {
  const { sku, onHand } = item;
  const minimum = policy['minimum'];
  if (onHand < minimum) {
    return `${sku} 재고 부족`;
  }
  return '';
}
