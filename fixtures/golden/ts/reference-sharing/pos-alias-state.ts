// 짧은 이름으로 같은 것을 부른다.
export function apply(state: { qty: number }) {
  const cart = state;
  cart.qty = 2;
  return state.qty;
}
