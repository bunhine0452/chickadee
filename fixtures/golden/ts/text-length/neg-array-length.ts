// 세는 것은 맞지만 글이 아니라 목록이다.
export function summarize(items: string[]) {
  return { n: items.length, first: items[0] };
}
