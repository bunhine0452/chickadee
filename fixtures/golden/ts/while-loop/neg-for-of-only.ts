// 목록을 도는 것은 다른 문법이다.
export function joinNames(names: string[]) {
  let out = "";
  for (const name of names) {
    out = out + name;
  }
  return out;
}
