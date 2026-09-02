export function QuantityInput({ value, onChange }: QuantityProps) {
  const bump = (step: number) => onChange(Math.max(1, value + step));
  return (
    <div className="qty">
      <button type="button" onClick={() => bump(-1)}>빼기</button>
      <output>{value}</output>
      <button type="button" onClick={() => bump(1)}>더하기</button>
    </div>
  );
}
