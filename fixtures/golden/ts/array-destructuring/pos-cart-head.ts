// 장바구니 접힌 미리보기 — 앞의 두 줄만 자리로 꺼낸다.
export function previewCart(items: CartItem[]) {
  const [first, second] = items;
  const rest = items.length - 2;
  return { first, second, rest };
}
