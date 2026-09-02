// 점이 두 번 이어져도 앞 단계가 배열 메서드가 아니면 이 개념이 아니다.
export function stockLabels(inventory: Record<string, number>) {
  const rows = Object.entries(inventory).map(([sku, count]) => `${sku}: ${count}`);
  return rows.join(', ').trim();
}
