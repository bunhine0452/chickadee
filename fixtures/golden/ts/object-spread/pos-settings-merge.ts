// 기본값 위에 저장본, 그 위에 이번 화면의 값 — 뒤에 온 것이 이긴다.
export function mergeSettings(saved: Settings, patch: Partial<Settings>) {
  const next = { ...DEFAULTS, ...saved, ...patch };
  return next;
}
