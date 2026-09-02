// 설정 불러오기 — 사용자가 고른 0 과 빈 문자열은 그대로 두어야 한다.
export function loadSettings(saved: Partial<Settings>) {
  const pageSize = saved.pageSize ?? 20;
  const theme = saved.theme ?? 'light';
  return { pageSize, theme };
}
