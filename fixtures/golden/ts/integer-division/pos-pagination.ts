// 쪽 번호는 셀 수 있는 값이라야 한다.
export function pageOf(offset: number, size: number) {
  return Math.floor(offset / size);
}

export const pageCount = (total: number, size: number) => Math.ceil(total / size);
