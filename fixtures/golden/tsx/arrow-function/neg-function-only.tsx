// 화살표 없이 function 으로만 쓴 판. 타입 자리의 `=>` 는 함수가 아니라 타입이다.
export function CartHeading({ count }: { count: number }) {
  return <h2 className="cart-heading">장바구니 {count}</h2>;
}

export function CartFooter() {
  return <footer>합계는 결제 화면에서 다시 확인합니다.</footer>;
}
