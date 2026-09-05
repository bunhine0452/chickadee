// 걸어가는 동안 같은 것을 가리키는 이름 하나를 더 둔다.
export function last(first: { next?: unknown }) {
  let current = first;
  while (current.next) {
    current = current.next as { next?: unknown };
  }
  return current;
}
