// 수를 다루지만 한계 이름은 안 나온다.
export function average(values: number[]) {
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}
