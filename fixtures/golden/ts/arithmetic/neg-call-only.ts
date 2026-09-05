// 부르기만 하고 셈하지 않는다.
export function render(label: string, format: (s: string) => string) {
  const text = format(label);
  return text;
}
