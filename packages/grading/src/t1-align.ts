/**
 * 줄 정렬 (04 §4.1). 원본 줄과 답안 줄을 짝짓고, 짝이 없는 것을 `missing`·`extra` 로 남긴다.
 *
 * **왜 글자 단위 diff 가 아닌가**: 한 줄이 밀리면 아래 전부가 빨간 덩어리가 되어 「무엇이
 * 다른가」를 말할 수 없다. 같은 줄 우선(A)은 「내가 쓴 3행이 원본 3행」이라는 기대와
 * 맞고, 창 ±2(B)는 한두 줄 밀림을 흡수하며, 3줄 이상 밀림만 Needleman-Wunsch(C)가 받는다.
 */
import { sim } from './t1-line.js';

/** A 단계 — 같은 줄 번호를 그대로 짝지을 최소 닮음. */
export const SAME_LINE_MIN = 0.6;
/** B·C 단계 — 짝으로 인정할 최소 닮음. 그 아래는 짝이 없는 것으로 본다. */
export const PAIR_MIN = 0.5;
/** B 단계가 보는 창 (±2). */
export const WINDOW = 2;
/** NW 의 갭 벌점. */
export const GAP = -0.5;

/** 짝 하나. `ui < 0` 이면 원본 줄에 짝이 없다(`missing`). */
export interface Pair {
  oi: number;
  ui: number;
}

export interface Alignment {
  pairs: Pair[];
  /** 짝이 없는 **비공백** 답안 줄 (04 §4.1 — 빈 줄은 `extra` 가 아니다). */
  extra: number[];
  /** C 단계(NW)까지 갔나. 화면에 쓰지는 않고 성능·회귀 확인에 쓴다. */
  usedNw: boolean;
}

/**
 * 04 §4.1 그대로. A → B 로 짝지어 보고, 어긋난 양(`missing + extra`)이
 * `max(3, 0.25·|O|)` 를 넘으면 **A·B 결과를 버리고** C(NW)로 다시 짠다.
 */
export function align(original: readonly string[], user: readonly string[]): Alignment {
  const first = greedy(original, user);
  const missing = first.pairs.filter((p) => p.ui < 0).length;
  const limit = Math.max(3, 0.25 * original.length);
  const chosen = missing + first.extra.length <= limit
    ? { ...first, usedNw: false }
    : { ...needleman(original, user), usedNw: true };
  return forceSameLine(chosen);
}

/**
 * **목업·문서에 없음** (D91). 양쪽에서 짝이 없는 줄이 **같은 자리**에 마주 보고 있으면
 * 닮음을 묻지 않고 짝짓는다.
 *
 * 왜: 04 §9 #28(`let v = Vec::new();` / `let v = vec![];`)의 Dice 는 0.44 라 §4.1 의 문턱
 * 0.5 를 못 넘어 「누락 + 추가」로 갈린다. 그런데 학습자는 **그 줄을 썼다** — 화면에
 * 「이 줄을 안 썼습니다」와 「원본에 없는 줄입니다」를 나란히 내면 무엇이 다른지 말할
 * 자리가 사라지고, 04 §9 가 그 행에 요구한 `differ TOKEN_COUNT` 도 나오지 않는다.
 * 같은 자리 조건으로 좁힌 이유는 A 단계와 같다 — 줄이 밀린 경우는 B·C 가 이미 받았으니,
 * 여기 남는 것은 「자리는 맞는데 내용이 많이 다른」 줄뿐이다.
 */
function forceSameLine(a: Alignment): Alignment {
  const extra = new Set(a.extra);
  if (extra.size === 0) return a;
  const pairs = a.pairs.map((p) => {
    if (p.ui >= 0 || !extra.has(p.oi)) return p;
    extra.delete(p.oi);
    return { oi: p.oi, ui: p.oi };
  });
  return { pairs, extra: [...extra].sort((x, y) => x - y), usedNw: a.usedNw };
}

/** A·B — 같은 줄 우선, 그다음 창 ±2 에서 가장 닮은 것. */
function greedy(original: readonly string[], user: readonly string[]): Omit<Alignment, 'usedNw'> {
  const used = new Array<boolean>(user.length).fill(false);
  const pairs: Pair[] = [];

  for (let i = 0; i < original.length; i += 1) {
    const o = original[i] as string;
    let bestAt = -1;
    let bestScore = 0;

    // A · 같은 줄 우선
    if (user[i] !== undefined && used[i] !== true) {
      const s = sim(o, user[i] as string);
      if (s >= SAME_LINE_MIN) {
        bestAt = i;
        bestScore = s;
      }
    }
    // B · 창 탐색
    if (bestAt < 0) {
      const from = Math.max(0, i - WINDOW);
      const to = Math.min(user.length - 1, i + WINDOW);
      for (let j = from; j <= to; j += 1) {
        if (used[j] === true) continue;
        const s = sim(o, user[j] as string);
        if (s > bestScore) {
          bestScore = s;
          bestAt = j;
        }
      }
    }

    if (bestAt >= 0 && bestScore >= PAIR_MIN) {
      used[bestAt] = true;
      pairs.push({ oi: i, ui: bestAt });
    } else {
      pairs.push({ oi: i, ui: -1 });
    }
  }

  return { pairs, extra: unusedNonBlank(user, used) };
}

/**
 * C · Needleman-Wunsch. 점수 `2·sim − 1`(−1..1), 갭 −0.5. 역추적 뒤 `sim < 0.5` 인 짝은
 * 해제한다 — 전역 최적이 「아무 줄이나 붙여 놓는」 짝을 만들 수 있고, 그것은 정렬이 아니라
 * 소음이다.
 */
function needleman(original: readonly string[], user: readonly string[]): Omit<Alignment, 'usedNw'> {
  const n = original.length;
  const m = user.length;
  const width = m + 1;
  const score = new Float64Array((n + 1) * width);
  // 0 = 대각(짝) · 1 = 위(원본만) · 2 = 왼쪽(답안만)
  const from = new Uint8Array((n + 1) * width);

  for (let j = 1; j <= m; j += 1) {
    score[j] = j * GAP;
    from[j] = 2;
  }
  for (let i = 1; i <= n; i += 1) {
    score[i * width] = i * GAP;
    from[i * width] = 1;
  }

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const diag = (score[(i - 1) * width + (j - 1)] as number)
        + 2 * sim(original[i - 1] as string, user[j - 1] as string) - 1;
      const up = (score[(i - 1) * width + j] as number) + GAP;
      const left = (score[i * width + (j - 1)] as number) + GAP;
      const at = i * width + j;
      if (diag >= up && diag >= left) {
        score[at] = diag;
        from[at] = 0;
      } else if (up >= left) {
        score[at] = up;
        from[at] = 1;
      } else {
        score[at] = left;
        from[at] = 2;
      }
    }
  }

  const pairs: Pair[] = [];
  const used = new Array<boolean>(m).fill(false);
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const step = i === 0 ? 2 : j === 0 ? 1 : (from[i * width + j] as number);
    if (step === 0) {
      const ok = sim(original[i - 1] as string, user[j - 1] as string) >= PAIR_MIN;
      pairs.push({ oi: i - 1, ui: ok ? j - 1 : -1 });
      if (ok) used[j - 1] = true;
      i -= 1;
      j -= 1;
      continue;
    }
    if (step === 1) {
      pairs.push({ oi: i - 1, ui: -1 });
      i -= 1;
      continue;
    }
    j -= 1;
  }
  pairs.reverse();

  return { pairs, extra: unusedNonBlank(user, used) };
}

const unusedNonBlank = (user: readonly string[], used: readonly boolean[]): number[] => {
  const out: number[] = [];
  for (let j = 0; j < user.length; j += 1) {
    if (used[j] !== true && (user[j] as string).trim() !== '') out.push(j);
  }
  return out;
};
