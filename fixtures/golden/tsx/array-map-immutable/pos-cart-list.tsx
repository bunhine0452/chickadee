export function CartList({ items }: { items: CartItem[] }) {
  return (
    <ul className="cart">
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
