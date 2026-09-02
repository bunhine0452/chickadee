// 닫는 태그가 없어 파서가 복구 모드로 들어간다 (03 §8 「미완 JSX」).
// 복구는 아래 함수까지 삼켜서 `return` 을 부르는 이름으로 읽는다 — 그래서 inError 가 선다.
export function CartList({ items }: CartProps) {
  return (
    <ul className="cart">
      <li>{items.length}
    </ul>
  );
}

export function CartCount({ items }: CartProps) {
  return count(items);
}
