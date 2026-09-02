import { chargeCard } from './payment';
import { clearCart } from './cart';

export async function checkout(cart: Cart) {
  const receipt = await chargeCard(cart.total);
  clearCart(cart.id);
  return receipt;
}
