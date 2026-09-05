// 조건이 거짓이 될 때까지.
export function countdown(from: number) {
  let n = from;
  while (n > 0) {
    n = n - 1;
  }
  return n;
}
