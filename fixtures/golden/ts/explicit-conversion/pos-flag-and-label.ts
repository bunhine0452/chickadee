// 참·거짓과 글자를 각각 새로 만든다.
export function view(raw: unknown) {
  const shown = Boolean(raw);
  const label = String(raw);
  return { shown, label };
}
