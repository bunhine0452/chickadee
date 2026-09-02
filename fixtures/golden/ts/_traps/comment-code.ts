// 옛 판에서는 res.user?.profile 로 읽었다.
/* 사양 초안:
 *   const nick = res.user?.profile?.nickname
 *   const first = cart?.items[0]
 */
export function nickname(res: LoginResult) {
  return res.user?.profile ?? '손님';
}
