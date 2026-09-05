// 주소에서 온 글자를 셈 전에 수로 만든다.
export function paging(query: Record<string, string>) {
  const page = parseInt(query.page, 10);
  const size = Number(query.size);
  return { page, size };
}
