// 안에 또 하나를 정의해 둔다 — 둘 다 부를 때 돈다.
export function buildReport(rows: string[]) {
  function header(count: number) {
    return count;
  }
  return header(rows.length);
}
