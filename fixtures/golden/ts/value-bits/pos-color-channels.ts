// 24비트 색 하나에서 채널 셋을 꺼낸다.
export function channels(rgb: number) {
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  return { r, g, b };
}

export const opaque = (rgb: number) => rgb | 0xff000000;
