// 주문자 이름 — 공백 하나로 성과 이름을 가른다.
export function splitName(full: string) {
  const [first, last] = full.split(' ');
  return { first, last };
}
