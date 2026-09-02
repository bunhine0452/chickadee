export class CartStore {
  private items: CartItem[] = [];

  add(item: CartItem) {
    this.items = [...this.items, item];
  }

  total() {
    return this.items.length;
  }
}
