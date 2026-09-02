// 재고가 임계값보다 많은 품목만 골라 목록에 올린다.
export function inStock(items: StockItem[], minimum: number) {
  const shown = items.filter((item) => item.onHand > minimum);
  return shown;
}
