// JSX 에서 흔한 `&&` 갈래 — 물음표가 없으니 삼항이 아니다.
export function CartBadge({ count }: { count: number }) {
  return (
    <span className="badge">
      {count > 0 && <b>{count}</b>}
    </span>
  );
}
