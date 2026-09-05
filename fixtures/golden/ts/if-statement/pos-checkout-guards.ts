// 조건이 참일 때만 아래 묶음이 돈다.
export function checkout(count: number, paid: boolean) {
  if (count === 0) {
    return "empty";
  }
  if (paid) {
    return "done";
  }
  return "pending";
}
