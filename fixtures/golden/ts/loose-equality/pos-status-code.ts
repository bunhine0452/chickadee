// 견주는 방법 둘이 한 파일에 섞여 있다.
export function report(code: number, state: string) {
  if (code != 0) {
    return 'failed to finish';
  }
  return state === 'done' ? 'done' : 'running';
}
