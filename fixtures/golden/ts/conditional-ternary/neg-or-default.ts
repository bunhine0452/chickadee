// `||` 도 둘 중 하나를 고르지만 물음표가 없다.
export function nickname(user: User) {
  const shown = user.name || '손님';
  return shown;
}
