// 속성을 고치는 것은 이름을 다시 묶는 것과 다른 일이다.
export class CartStore {
  count = 0;
  bump(next: number) {
    this.count = next;
  }
}
