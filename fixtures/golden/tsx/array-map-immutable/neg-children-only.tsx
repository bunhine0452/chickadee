// 목록을 이미 만들어 받은 판 — 이 파일에는 map 이 없다.
export function CartList({ rows }: { rows: JSX.Element[] }) {
  return <ul className="cart">{rows}</ul>;
}
