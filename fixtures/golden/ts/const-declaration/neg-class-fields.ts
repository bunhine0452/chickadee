// 클래스 필드도 선언이지만 `const`·`let` 이 붙지 않는다.
export class CartStore {
  items: CartItem[] = [];
  coupon?: string;

  add(item: CartItem) {
    this.items = [...this.items, item];
  }
}
