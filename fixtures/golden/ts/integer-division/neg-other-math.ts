// 같은 자리에 있지만 버리는 일이 아니다.
export function span(values: number[]) {
  return Math.max(...values) - Math.min(...values);
}
