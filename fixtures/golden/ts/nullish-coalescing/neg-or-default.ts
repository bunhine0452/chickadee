// `||` 는 0 과 '' 까지 빈 값으로 보고 오른쪽으로 넘어간다 — 같은 자리, 다른 판정.
export function loadSettings(saved: Partial<Settings>) {
  const pageSize = saved.pageSize || 20;
  const theme = saved.theme || 'light';
  return { pageSize, theme };
}
