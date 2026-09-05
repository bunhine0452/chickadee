// 두 가지 없음을 한 번에 거른다.
export function pick(value: unknown, fallback: string) {
  if (value == null) {
    return fallback;
  }
  return value;
}
