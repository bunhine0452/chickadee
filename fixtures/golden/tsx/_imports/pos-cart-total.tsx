import { useMemo } from 'react';
import type { CartItem } from '../types/cart';
import { formatWon } from './format';

export function CartTotal({ items }: { items: CartItem[] }) {
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);
  return <strong className="total">{formatWon(total)}</strong>;
}
