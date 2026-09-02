// 배송 경유지 순서 바꾸기 — 임시 변수 없이 자리를 맞바꾼다.
export function swapStops(stops: Stop[], here: number, there: number) {
  const next = [...stops];
  let left = next[here];
  let right = next[there];
  [left, right] = [right, left];
  next[here] = left;
  next[there] = right;
  return next;
}
