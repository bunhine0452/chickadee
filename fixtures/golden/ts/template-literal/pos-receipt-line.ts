export function receiptLine(item: CartItem) {
  return `${item.name} × ${item.qty} — ${item.price * item.qty}원`;
}
