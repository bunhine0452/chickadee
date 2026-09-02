export function greeting(user: User, unread: number) {
  const name = user.name ?? '손님';
  return `${name}님, 읽지 않은 알림이 ${unread}개 있습니다.`;
}
