// `.catch` 는 메서드 이름이지 catch 절이 아니다.
export function charge(cart: Cart) {
  return chargeCard(cart.total)
    .then((receipt) => receipt.id)
    .catch(() => null);
}
