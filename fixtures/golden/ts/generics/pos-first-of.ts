// 빈 타입 자리를 부르는 쪽이 채운다.
export function firstOf<T>(rows: T[]) {
  return rows.length > 0 ? rows[0] : undefined;
}
