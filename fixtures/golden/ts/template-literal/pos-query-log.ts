export function queryLog(table: string, ms: number) {
  return `
    table=${table}
    took=${ms}ms
  `;
}
