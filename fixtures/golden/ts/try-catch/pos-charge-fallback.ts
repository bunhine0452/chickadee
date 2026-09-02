// 잡을 값이 필요 없으면 매개변수를 적지 않아도 된다.
export async function charge(cart: Cart) {
  try {
    return await chargeCard(cart.total);
  } catch {
    return { ok: false, reason: '결제사에 닿지 못했습니다.' };
  }
}
