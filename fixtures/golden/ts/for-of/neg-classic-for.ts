// 번호를 세는 옛 반복문 — for_statement 다.
export function firstThree(items: CartItem[]) {
  const out: CartItem[] = [];
  for (let i = 0; i < 3 && i < items.length; i += 1) {
    out.push(items[i]);
  }
  return out;
}
