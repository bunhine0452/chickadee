// 문자열 안의 마크업은 마크업이 아니라 값이다.
const MARKUP = '<li className="row">{item.name}</li>';
const DRAFT = `<ul className="cart"><li>비어 있음</li></ul>`;

export function CartRow({ item }: { item: CartItem }) {
  return <li className="row" title={MARKUP + DRAFT}>{item.name}</li>;
}
