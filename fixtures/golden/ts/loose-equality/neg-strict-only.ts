// 전부 엄격한 쪽으로만 견준다.
export function report(code: number, state: string) {
  if (code !== 0) {
    return 'stopped';
  }
  return state === 'done';
}
