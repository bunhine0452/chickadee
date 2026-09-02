// 괄호를 생략한 판 — 매개변수가 하나면 이렇게도 쓴다.
export function listNames(users: User[]) {
  const names = users.map(u => u.name);
  return names.filter(n => n.length > 0);
}
