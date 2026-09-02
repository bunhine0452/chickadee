// 문자열 안의 코드는 코드가 아니라 값이다.
const SNIPPET = 'const nick = res.user?.profile';
const TEMPLATE = `const first = cart?.items[0]`;
const DOC = "res.user?.profile ?? '손님'";

export function nickname(res: LoginResult) {
  return res.user?.profile ?? SNIPPET;
}
