// 콜백을 이름으로 넘긴 판 — 인자 자리에 화살표가 없다.
export function toIds(rows: StockRow[]) {
  return rows.map(toId);
}
