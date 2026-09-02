// 같은 판단을 문으로 쓴 판 — 값이 나오지 않으므로 삼항이 아니다.
export function badgeLabel(item: CartItem) {
  if (item.stock > 0) {
    return '재고 있음';
  }
  return '품절';
}
