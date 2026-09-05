// 첫 글자의 번호로 색을 고른다.
export function tint(name: string) {
  const code = name.charCodeAt(0);
  return code % 8;
}
