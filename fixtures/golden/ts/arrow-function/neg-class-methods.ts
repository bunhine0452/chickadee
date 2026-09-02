// 메서드는 화살표 없이 이름 뒤에서 바로 몸체를 연다.
export class CartStore {
  private items: CartItem[] = [];

  add(item: CartItem) {
    this.items.push(item);
  }

  total() {
    return this.items.length;
  }
}
