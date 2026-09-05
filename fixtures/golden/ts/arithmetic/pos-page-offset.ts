// 나누기와 빼기.
export function pageOffset(index: number, size: number) {
  const page = index / size;
  const remaining = size - index;
  return { page, remaining };
}
