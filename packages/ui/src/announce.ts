/**
 * `aria-live` 문구 규약 (05 §7 · §9 스크린리더 행).
 *
 * 형식 `[상태]. [수치]. [다음 행동]` · **60자 이내** · **태그 없음** · **마침표로 끝나는 완결 문장**.
 * 은유엔 평문을 병기한다 — 「정합 — 맞았습니다. 잉크 3겹. Space 로 다음.」
 */

/** 낭독 문구 최대 길이. 넘으면 잘라서 마침표를 다시 붙인다. */
export const ANNOUNCE_MAX_LEN = 60;

/** 문장 끝으로 인정하는 부호. */
const TERMINATORS = ['.', '!', '?'] as const;

/** 목업 `plain()` — 태그를 지우고 엔티티를 되돌린다. */
function plain(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTrailingTerminator(part: string): string {
  let out = part;
  while (out.length > 0 && TERMINATORS.includes(out[out.length - 1] as (typeof TERMINATORS)[number])) {
    out = out.slice(0, -1).trimEnd();
  }
  return out;
}

function clampToSentence(body: string): string {
  if (body.length + 1 <= ANNOUNCE_MAX_LEN) return `${body}.`;
  const room = ANNOUNCE_MAX_LEN - 1;
  const cut = body.slice(0, room);
  const lastSpace = cut.lastIndexOf(' ');
  const kept = lastSpace > room / 2 ? cut.slice(0, lastSpace) : cut;
  return `${stripTrailingTerminator(kept.trimEnd())}.`;
}

/**
 * 문구 조각들을 하나의 낭독 문장으로 만든다.
 * 빈 조각은 버리고, 태그를 지우고, `. ` 으로 잇고, 마침표로 닫고, 60자로 자른다.
 */
export function announce(...parts: ReadonlyArray<string | null | undefined>): string {
  const cleaned = parts
    .filter((p): p is string => typeof p === 'string')
    .map((p) => stripTrailingTerminator(plain(p)))
    .filter((p) => p.length > 0);
  if (cleaned.length === 0) return '';
  return clampToSentence(cleaned.join('. '));
}
