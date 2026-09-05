// 남은 시간을 분 단위로 줄인다.
export function minutes(ms: number) {
  const seconds = ms / 1000;
  return Math.round(seconds / 60);
}
