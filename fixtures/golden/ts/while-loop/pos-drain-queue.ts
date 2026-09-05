// 조건이 참인 동안 되풀이한다.
export function drain(pending: number) {
  let left = pending;
  while (left > 0) {
    left = left - 1;
  }
  return left;
}
