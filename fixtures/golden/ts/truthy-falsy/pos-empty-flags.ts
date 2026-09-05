// 값을 뒤집어 「비었나」로 쓴다.
export function state(text: string, list: string[]) {
  const blank = !text;
  const nothing = !list;
  return { blank, nothing };
}
