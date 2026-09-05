// 두 번 뒤집어 참·거짓 하나로 줄인다.
export function summary(user: { email: string }) {
  const hasEmail = !!user.email;
  return { hasEmail };
}
