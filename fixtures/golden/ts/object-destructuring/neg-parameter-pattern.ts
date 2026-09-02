// 매개변수 자리의 중괄호. TS 는 여기에 required_parameter 를 한 겹 더 두어
// 선언문과 구조가 갈린다 — 사전 쿼리는 선언문만 본다.
export function stockRow({ sku, onHand }: StockItem) {
  return `${sku} ${onHand}개`;
}

export const cartLine = ({ name, qty }: CartItem) => `${name} x${qty}`;
