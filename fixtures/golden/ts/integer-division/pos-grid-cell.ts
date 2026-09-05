// 격자 좌표는 0 쪽으로 버린다.
export function cell(x: number, width: number) {
  const column = Math.trunc(x / width);
  return { column };
}
