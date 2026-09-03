/**
 * 공통 시드 · PRNG — 04 §0 결정성 규칙.
 *
 * 셔플 · 동점 해소 · 후보 선택은 전부 `seedOf` 로 만든 PRNG 만 쓴다.
 * `Math.random` 은 금지(06 §1.3, ESLint `no-restricted-globals`)이고 이 파일에도 없다.
 */

const FNV_OFFSET_BASIS_32 = 0x811c9dc5;
const FNV_PRIME_32 = 0x01000193;
const MULBERRY_INCREMENT = 0x6d2b79f5;
const UINT32_RANGE = 4_294_967_296;

const utf8 = new TextEncoder();

/**
 * 32비트 FNV-1a. 문자열은 UTF-8 바이트로 해싱한다(Rust `s.as_bytes()` 와 같은 결과).
 * 반환은 언제나 부호 없는 32비트 정수.
 */
export function fnv1a32(s: string): number {
  let hash = FNV_OFFSET_BASIS_32;
  for (const byte of utf8.encode(s)) {
    hash ^= byte;
    hash = Math.imul(hash, FNV_PRIME_32) >>> 0;
  }
  return hash >>> 0;
}

/**
 * 64비트 지문 (D70). FNV-1a 32비트를 **접두어를 달리해 두 벌** 돌린다 — 16자리 hex.
 *
 * 접두어가 없으면 두 벌이 같은 값이 되어 앞뒤 8자리가 똑같아지고, 실제 강도는 32비트로
 * 떨어진다. 사용처 5만 건이면 32비트 충돌 확률이 30 % 에 가깝고 `ux_site_key` 가 UNIQUE 라
 * 그중 하나가 조용히 사라진다. 암호학적 강도는 어디에도 쓰이지 않지만 이 폭은 필요하다.
 */
export function fnv1a64(body: string): string {
  const hi = fnv1a32(`hi ${body}`);
  const lo = fnv1a32(`lo ${body}`);
  return hi.toString(16).padStart(8, '0') + lo.toString(16).padStart(8, '0');
}

/**
 * 04 §0: `seedOf(repoId, kind, targetId, attempt, dictVersion)`.
 * 카드 레코드의 `gen:{seed, dictVersion, attempt, siteId}` 로 같은 카드를 언제든 재생성한다.
 */
export function seedOf(
  repoId: number,
  kind: string,
  targetId: string | number,
  attempt: number,
  dictVersion: string,
): number {
  return fnv1a32(`${repoId}|${kind}|${targetId}|${attempt}|${dictVersion}`);
}

/** mulberry32 PRNG. `seed` 하나로 완전히 결정되는 `[0, 1)` 난수열. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + MULBERRY_INCREMENT) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

/** Fisher-Yates. 입력을 건드리지 않고 새 배열을 돌려준다. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    const held = out[i] as T;
    out[i] = out[j] as T;
    out[j] = held;
  }
  return out;
}
