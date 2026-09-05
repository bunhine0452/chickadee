// 이모지 하나가 저장 칸 둘을 먹는다는 것을 적어 둔다.
export const thumbSlots = '👍'.length;
export const hangulSlots = '가'.length;

export function firstPoint(text: string) {
  return text.codePointAt(0);
}
