// 장바구니 응답 — 카트가 아직 없을 수 있어 단계마다 물음표 점으로 끊는다.
export function cartSummary(res: CartResponse) {
  const owner = res.cart?.owner;
  const firstItem = res.cart?.items?.[0];
  const coupon = res.cart?.coupon ?? '쿠폰 없음';
  return { owner, firstItem, coupon };
}
