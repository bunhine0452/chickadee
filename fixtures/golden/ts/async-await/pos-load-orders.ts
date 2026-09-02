export async function loadOrders(userId: string) {
  const res = await fetch(`/api/orders?user=${userId}`);
  const rows = await res.json();
  return rows;
}
