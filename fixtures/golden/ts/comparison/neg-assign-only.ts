// 넣기만 하고 견주지 않는다.
export function resetCart(store: { count: number; coupon: string }) {
  store.count = 0;
  store.coupon = "";
  return store;
}
