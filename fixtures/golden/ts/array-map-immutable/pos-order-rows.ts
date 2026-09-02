export function orderRows(orders: Order[]) {
  return orders.map(order => ({
    id: order.id,
    label: LABELS[order.status],
  }));
}
