// 입력이 멎을 때까지 미루는 함수를 돌려준다.
export function debounce(run: () => void, ms: number) {
  let timer = 0;
  return () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => run(), ms);
  };
}
