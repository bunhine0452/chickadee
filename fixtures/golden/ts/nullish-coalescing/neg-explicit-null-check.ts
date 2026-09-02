// 같은 판정을 삼항으로 손수 쓴 판 — 물음표 두 개짜리 연산자가 없다.
export function normalizeQty(input: number | null | undefined) {
  const qty = input === null || input === undefined ? 1 : input;
  return qty;
}
