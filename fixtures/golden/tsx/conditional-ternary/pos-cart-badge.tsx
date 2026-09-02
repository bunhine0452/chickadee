export function CartBadge({ count }: { count: number }) {
  return (
    <span className={count > 0 ? 'badge on' : 'badge'}>
      {count > 0 ? `${count}개` : '비어 있음'}
    </span>
  );
}
