// 범위를 넘는 값은 다른 종류로 옮겨 담는다.
export function widen(raw: string) {
  const asNumber = parseInt(raw, 10);
  if (asNumber > Number.MAX_SAFE_INTEGER) {
    return BigInt(raw);
  }
  return asNumber;
}
