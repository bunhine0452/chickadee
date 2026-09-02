// 물음표 점이 없던 시절의 같은 일 — `&&` 로 한 단계씩 막는다.
export function cartOwner(res: CartResponse) {
  const cart = res.cart;
  const owner = cart && cart.owner;
  return owner && owner.name;
}
