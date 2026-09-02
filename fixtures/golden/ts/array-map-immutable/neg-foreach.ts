// forEach 는 돌기만 하고 새 배열을 만들지 않는다.
export function logCart(items: CartItem[]) {
  items.forEach((item) => report(`${item.id} ${item.qty}`));
}
