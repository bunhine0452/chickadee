// 32비트 안에서만 도는 해시. 뒤집기와 밀기가 함께 나온다.
export function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h = h ^ text.charCodeAt(i);
    h = (h << 5) - h;
  }
  return ~h;
}
