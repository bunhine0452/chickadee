// 재고 응답 — 이름을 바꿔 받고, 서버가 빠뜨린 칸은 기본값으로 채운다.
export function stockRow(res: StockResponse) {
  const { sku: code, onHand = 0 } = res.item;
  return `${code} ${onHand}개`;
}
