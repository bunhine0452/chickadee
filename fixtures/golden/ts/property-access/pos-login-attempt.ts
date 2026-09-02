// 로그인 시도 기록 — 세션 객체의 칸을 하나씩 읽어 한 줄로 만든다.
export function attemptLine(session: Session) {
  const who = session.user.email;
  const when = session.startedAt.toISOString();
  return `${who} ${when}`;
}
