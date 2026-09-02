// 옛 판: <li className="row">{item.name}</li>
/* 지울 예정
 * <ul className="cart">
 *   <li>{item.name}</li>
 * </ul>
 */
export function CartRow({ item }: { item: CartItem }) {
  return <li className="row">{item.name}</li>;
}
