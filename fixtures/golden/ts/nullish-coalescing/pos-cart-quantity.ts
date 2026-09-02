// 수량 입력 — 0 개는 「안 적었다」가 아니라 0 개다.
export function normalizeQty(input: number | null, stock: number | null) {
  const qty = input ?? 1;
  const limit = stock ?? 0;
  return qty > limit ? limit : qty;
}
