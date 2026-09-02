export function labelRows(labels: Record<string, string>) {
  const rows: string[] = [];
  for (const [code, text] of Object.entries(labels)) {
    rows.push(`${code}\t${text}`);
  }
  return rows;
}
