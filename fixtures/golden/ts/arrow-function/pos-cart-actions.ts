import { save } from './store';

export const addItem = (cart: Cart, item: CartItem) => ({
  ...cart,
  items: [...cart.items, item],
});

export const persist = (cart: Cart) => save(cart.id, cart.items);
