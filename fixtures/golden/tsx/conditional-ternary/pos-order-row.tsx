export function OrderRow({ order }: { order: Order }) {
  return (
    <li className="order">
      <span>{order.id}</span>
      <em>{order.paidAt ? '결제 완료' : '결제 대기'}</em>
    </li>
  );
}
