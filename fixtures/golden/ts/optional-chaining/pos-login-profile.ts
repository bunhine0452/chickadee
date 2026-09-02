// 로그인 응답 — 프로필도 콜백도 서버가 안 보내 줄 수 있다.
export function greetUser(session: Session) {
  const nickname = session.user?.profile?.nickname;
  session.onReady?.(nickname);
  return nickname;
}
