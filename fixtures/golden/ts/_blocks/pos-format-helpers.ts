export function formatWon(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function formatDate(at: Date) {
  return `${at.getFullYear()}.${pad2(at.getMonth() + 1)}`;
}
