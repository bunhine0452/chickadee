// Object.assign 은 첫 인자를 그 자리에서 고친다 — 새 객체를 쓰는 표기가 아니다.
export function mergeSettings(saved: Settings, patch: Partial<Settings>) {
  const next = Object.assign({}, saved, patch);
  return next;
}
