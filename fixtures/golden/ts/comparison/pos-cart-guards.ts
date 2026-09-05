// 값 둘을 견주어 참·거짓 하나를 얻는 자리들.
export function cartState(count: number, coupon: string) {
  const empty = count === 0;
  const overflowing = count > 99;
  const noCoupon = coupon !== "";
  return { empty, overflowing, noCoupon };
}
