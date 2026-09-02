// 같은 점 세 개라도 부모가 배열이거나 인자 목록이면 객체 복사가 아니다.
export function appendItem(items: CartItem[], item: CartItem) {
  const next = [...items, item];
  return mergeAll(...next);
}
