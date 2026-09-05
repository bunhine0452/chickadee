// 자모가 갈라진 이름을 모으고 나서 견준다.
export function sortNames(names: string[]) {
  return names
    .map((n) => n.normalize('NFC'))
    .sort((a, b) => a.localeCompare(b));
}
