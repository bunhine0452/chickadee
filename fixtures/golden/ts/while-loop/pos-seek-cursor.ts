// 몇 번 돌지 미리 모르는 일.
export function seek(start: number, limit: number) {
  let cursor = start;
  while (cursor < limit) {
    cursor = cursor + 2;
  }
  return cursor;
}
