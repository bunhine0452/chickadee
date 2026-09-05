// 위에서 먼저 끝내고 아래는 돌지 않는다.
export function safeDivide(a: number, b: number) {
  if (b === 0) {
    return 0;
  }
  return a / b;
}
