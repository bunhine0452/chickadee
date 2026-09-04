// 재고 판정 — 견주기 셋.
export function stockState(onHand: number, reserved: number, min: number) {
  const soldOut = onHand === reserved;
  const low = onHand < min;
  const plenty = onHand >= min;
  return { soldOut, low, plenty };
}
