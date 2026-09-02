// 장바구니 검색 — 이름에 검색어가 든 줄만 남긴다.
export function searchCart(items: CartItem[], term: string) {
  const needle = term.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(needle));
}
