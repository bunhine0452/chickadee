// 같은 일을 `function` 으로 쓴 판 — 화살표가 없다.
export function addItem(cart: Cart, item: CartItem) {
  return { ...cart, items: [...cart.items, item] };
}

export function persist(cart: Cart) {
  return save(cart.id, cart.items);
}
