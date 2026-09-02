// `for…in` 은 값이 아니라 키를 돈다 — operator 가 "of" 가 아니다.
export function listKeys(labels: Record<string, string>) {
  const keys: string[] = [];
  for (const code in labels) {
    keys.push(code);
  }
  return keys;
}
