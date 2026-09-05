// 참·거짓을 묶기만 한다 — 기호가 하나씩 더 붙어 있다.
export function visible(ready: boolean, open: boolean, hidden: boolean) {
  return ready && open && !hidden;
}

export const label = (name: string) => name || 'anonymous';
