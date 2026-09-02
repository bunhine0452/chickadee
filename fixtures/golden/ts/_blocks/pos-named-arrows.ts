// 이름에 묶인 함수 — 화살표든 function 식이든 필사할 덩어리가 된다.
export const shippingFee = (total: number) => (total >= 50000 ? 0 : 3000);

const toLabel = function (order: Order) {
  return order.status;
};
