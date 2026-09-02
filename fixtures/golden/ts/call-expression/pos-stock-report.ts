export function lowStockReport(rows: StockRow[]) {
  const low = rows.filter((row) => row.qty < row.threshold);
  return low.map((row) => `${row.sku} 남은 수량 ${row.qty}`).join('\n');
}
