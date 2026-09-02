// 주문 초안 — 배송지만 갈아 끼운 새 주문을 만든다.
export function withAddress(order: Order, address: Address) {
  return {
    ...order,
    address: { ...address, updatedAt: Date.now() },
  };
}
