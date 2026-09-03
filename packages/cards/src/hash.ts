/**
 * `card.content_hash` (D70). 같은 리포에 같은 카드를 두 번 만들지 않기 위한 값이고
 * 암호학적 강도는 어디에도 쓰이지 않는다.
 *
 * `crypto.subtle` 은 웹뷰에서 비동기라 카드 수백 장에 프로미스 수백 개가 생긴다.
 * FNV-1a 32비트를 **접두어를 달리해 두 벌** 돌려 64비트(16자리 hex)로 쓴다.
 */
import { fnv1a64 } from '@chickadee/text';

export { fnv1a64 };

/**
 * 키 순서에 기대지 않는 JSON. 04 §0 결정성 규칙이 「객체 키 순서 의존 금지」를 못박는다 —
 * 페이로드를 조립하는 순서가 바뀌어도 같은 카드는 같은 해시여야 한다.
 */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
}

/** 카드의 정체 = 개념·유형·사용처 + 실제로 찍히는 내용 전부. */
export function contentHash(parts: {
  conceptId: string;
  kind: string;
  siteId: number;
  genVersion: number;
  payload: unknown;
}): string {
  return fnv1a64(canonical(parts));
}
