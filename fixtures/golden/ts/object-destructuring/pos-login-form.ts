// 로그인 폼 검증 — 필요한 두 칸만 꺼내고 나머지는 두고 온다.
export function validateLogin(form: LoginForm) {
  const { email, password } = form;
  if (email.length === 0) {
    return '이메일을 입력하세요';
  }
  return password.length < 8 ? '비밀번호가 짧습니다' : '';
}
