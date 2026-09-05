// 서버가 준 아이디가 안전한 범위인지 먼저 본다.
export function readId(raw: number) {
  if (!Number.isSafeInteger(raw)) {
    throw new Error('id is past the exact range');
  }
  return raw;
}

export const ceiling = Number.MAX_SAFE_INTEGER;
