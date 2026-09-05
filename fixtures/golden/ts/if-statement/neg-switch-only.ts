// 값 하나를 여러 갈래와 맞추는 것은 다른 문법이다.
export function labelOf(kind: string) {
  switch (kind) {
    case "cart":
      return "장바구니";
    default:
      return "기타";
  }
}
