// 안쪽 값을 그대로 조건에 둔다.
export function greeting(user: { name: string; nickname: string }) {
  if (user.nickname) {
    return user.nickname;
  }
  return user.name;
}
