// 범위 판정 — 견주기 둘.
export function withinBudget(price: number, budget: number) {
  const affordable = price <= budget;
  const free = price === 0;
  return affordable;
}
