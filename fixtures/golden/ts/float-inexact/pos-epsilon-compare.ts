// 소수 둘을 견줄 때는 차이를 본다.
export function sameEnough(a: number, b: number) {
  return Math.abs(a - b) < Number.EPSILON;
}
