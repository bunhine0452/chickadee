// 펼쳐서 새로 만든다 — 이름만 넣은 것이 아니다.
export function apply(state: { qty: number }) {
  const cart = { ...state };
  cart.qty = 2;
  return state.qty;
}
