// 재고 경고 — 정책의 임계값과 현재 수량을 견준다.
export function stockAlert(item: StockItem, policy: Policy) {
  if (item.onHand < policy.minimum) {
    return `${item.sku} 재고 부족`;
  }
  return '';
}
