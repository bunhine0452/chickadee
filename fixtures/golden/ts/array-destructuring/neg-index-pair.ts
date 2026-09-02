// 같은 일을 자리 번호로 — 이름과 번호가 떨어져 있어 순서를 놓치기 쉽다.
export function previewCart(items: CartItem[]) {
  const first = items[0];
  const second = items[1];
  const rest = items.length - 2;
  return { first, second, rest };
}
