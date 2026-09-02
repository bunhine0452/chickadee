export function loginMessage(attempts: number, locked: boolean) {
  if (locked) {
    return '잠겼습니다. 잠시 뒤 다시 해 주세요.';
  }
  return attempts > 0 ? `${attempts}번 틀렸습니다.` : '아이디와 비밀번호를 넣어 주세요.';
}
