export function dedupe(skus: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const sku of skus) {
    if (!seen.has(sku)) {
      seen.add(sku);
      out.push(sku);
    }
  }
  return out;
}
