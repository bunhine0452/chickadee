async function fetchStock(sku: string) {
  const res = await fetch(`/api/stock/${sku}`);
  return res.json();
}

export async function refreshStock(skus: string[]) {
  const rows = [];
  for (const sku of skus) {
    rows.push(await fetchStock(sku));
  }
  return rows;
}
