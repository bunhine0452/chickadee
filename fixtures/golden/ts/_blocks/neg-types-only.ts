export type OrderStatus = 'paid' | 'shipped' | 'done';

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
}

export const EMPTY_ORDER: Order = { id: '', status: 'paid', total: 0 };
