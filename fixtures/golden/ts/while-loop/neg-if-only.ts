// 한 번 보고 지나가는 갈림이라 되풀이가 아니다.
export function clamp(n: number, max: number) {
  if (n > max) {
    return max;
  }
  return n;
}
