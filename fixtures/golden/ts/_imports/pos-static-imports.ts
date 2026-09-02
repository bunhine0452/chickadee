import { chargeCard } from './payment';
import type { Cart } from '../types/cart';
import formatWon from './format';

export function receiptLine(cart: Cart) {
  return formatWon(chargeCard.fee + cart.total);
}
