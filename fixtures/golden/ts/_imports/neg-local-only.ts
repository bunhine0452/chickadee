// 바깥에서 가져오는 것이 하나도 없는 파일.
export const SHIPPING = {
  standard: { fee: 3000, days: 3 },
};

export function shippingFee(express: boolean) {
  return express ? 5500 : SHIPPING.standard.fee;
}
