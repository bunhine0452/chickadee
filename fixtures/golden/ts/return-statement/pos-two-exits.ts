// 값을 건네며 그 자리에서 끝난다 — 나가는 문이 둘이다.
export function firstItem(items: string[]) {
  if (items.length === 0) {
    return "";
  }
  return items[0];
}
