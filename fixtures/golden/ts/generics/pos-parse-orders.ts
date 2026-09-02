import { parseJson } from './json';

export function readOrders(raw: string) {
  const orders = parseJson<Order[]>(raw);
  return orders;
}
