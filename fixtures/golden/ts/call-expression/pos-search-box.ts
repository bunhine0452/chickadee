// 검색창 — 입력이 멎고 300ms 뒤에 한 번만 찾는다.
export function searchBox(input: HTMLInputElement, onFind: (q: string) => void) {
  let timer = 0;

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => onFind(input.value.trim()), 300);
  });
}
