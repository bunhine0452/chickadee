// 같은 일을 `.then` 으로 쓴 판 — async 도 await 도 없다.
export function loadOrders(userId: string) {
  return fetch('/api/orders?user=' + userId)
    .then((res) => res.json())
    .then((rows) => rows.filter(Boolean));
}
