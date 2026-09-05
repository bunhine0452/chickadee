// 함수가 곧바로 참·거짓을 건네는 자리.
export function canCheckout(itemCount: number): boolean {
  if (itemCount === 0) {
    return false;
  }
  return true;
}
