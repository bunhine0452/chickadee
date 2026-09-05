// 클래스 안의 것은 메서드라 이 정의문이 아니다.
export class CartStore {
  count = 0;
  bump(next: number) {
    return next;
  }
}
