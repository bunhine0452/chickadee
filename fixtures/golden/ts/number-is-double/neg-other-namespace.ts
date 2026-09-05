// 이름은 비슷하지만 수의 한계와 상관이 없다.
export function clamp(value: number, low: number, high: number) {
  return Math.min(Math.max(value, low), high);
}

export const parsed = (raw: string) => Number(raw);
