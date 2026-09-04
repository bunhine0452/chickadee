/**
 * 그래프만으로 만드는 문제 3종 (04 §8.3) — 영향 반경 · 흐름 추적 · 의존성 방향.
 *
 * 책임 배치(§8.1)와 다른 점 하나: **커밋이 없다.** 정답지가 지도 자체에서 나오므로 커밋이
 * 두 건뿐인 리포에서도 나온다 — 04 §8.4 의 폴백이 그것이다.
 *
 * 순수 함수다. 난수를 쓰는 곳은 의존성 방향의 5쌍 고르기 하나뿐이고 그것도 `req.seed` 로
 * 고정한 `mulberry32` 다 (04 §9 결정성).
 */
import { t } from '@chickadee/i18n';
import { mulberry32 } from '@chickadee/text';

import { condense, isEntry } from './t2-graph.js';
import { baseName } from './vars.js';
import type { Band, GraphEdge } from './t2-types.js';

/** 04 §8.3 흐름 추적 — 경로 길이. 3 미만이면 「순서」가 없고 6 을 넘으면 외우기가 된다. */
export const FLOW_MIN = 3;
export const FLOW_MAX = 6;
/** 경로 옆 형제 노드 몇 장을 덱에 섞는가 (04 §8.3 「함정」). */
export const FLOW_DECOYS = 2;
/** 의존성 방향은 5문항 묶음이다 (04 §8.3). */
export const DIRECTION_PAIRS = 5;

/** 04 §8.3 의 4지. 0 `A→B` · 1 `B→A` · 2 양쪽 · 3 무관. */
export type DirectionAnswer = 0 | 1 | 2 | 3;

export interface QuizInput {
  /** 지도에 남은 노드 경로 — 배치 뒤의 것이라 접힌 폴더 노드가 섞여 있다. */
  paths: readonly string[];
  edges: readonly GraphEdge[];
  bandOf: (path: string) => Band;
  unitPaths: readonly string[];
  seed: number;
}

// ───────── 영향 반경 (04 §8.3) ─────────

export interface RadiusQuiz {
  target: string;
  q: string;
  hint: string;
  core: Record<string, [string, string]>;
  sec: Record<string, [string, string]>;
  trap: Record<string, string>;
  hints: string[];
}

/**
 * 「X 를 바꾸면 어느 파일이 영향을 받나요?」 — core 는 **역방향 1-hop**(importers),
 * sec 는 2-hop 이다. `type`·`http` 엣지도 센다 (04 §8.3 표).
 *
 * 함정은 X 가 **쓰는** 쪽이다. 방향이 반대라 「X 가 바뀌어도 모른다」 — 이 문제가 실제로
 * 가르치려는 것이 그 비대칭이다.
 *
 * 대상은 importers 가 가장 많은 대지 파일이다. 동점이면 경로 사전순 — 난수를 쓰지 않는다.
 */
export function buildRadius(input: QuizInput): RadiusQuiz | null {
  const inbound = new Map<string, string[]>();
  const outbound = new Map<string, string[]>();
  for (const edge of input.edges) {
    if (!input.paths.includes(edge.from) || !input.paths.includes(edge.to)) continue;
    inbound.set(edge.to, [...(inbound.get(edge.to) ?? []), edge.from]);
    outbound.set(edge.from, [...(outbound.get(edge.from) ?? []), edge.to]);
  }

  const mine = input.unitPaths.filter((p) => input.paths.includes(p));
  const target = [...mine]
    .sort((a, b) => (inbound.get(b)?.length ?? 0) - (inbound.get(a)?.length ?? 0)
      || a.localeCompare(b))
    .at(0);
  // importers 가 하나도 없으면 반경이 0 이라 물을 것이 없다.
  if (target === undefined || (inbound.get(target)?.length ?? 0) === 0) return null;

  const one = [...new Set(inbound.get(target) ?? [])].sort();
  const two = [...new Set(one.flatMap((p) => inbound.get(p) ?? []))]
    .filter((p) => p !== target && !one.includes(p))
    .sort();

  const core: Record<string, [string, string]> = {};
  for (const path of one) {
    core[path] = [
      t('t2.radiusDirect'),
      t('t2.radiusDirectNote', { name: baseName(path), target: baseName(target) }),
    ];
  }
  const sec: Record<string, [string, string]> = {};
  for (const path of two) {
    sec[path] = [t('t2.radiusHop'), t('t2.radiusHopNote')];
  }
  const trap: Record<string, string> = {};
  for (const path of [...new Set(outbound.get(target) ?? [])].sort()) {
    if (core[path] !== undefined || sec[path] !== undefined) continue;
    trap[path] = t('t2.radiusTrap', { name: baseName(path), target: baseName(target) });
  }

  const bands = new Set(one.map((p) => input.bandOf(p)));
  return {
    target,
    q: t('t2.radiusQuestion', { target: baseName(target) }),
    hint: t('t2.radiusHint'),
    core, sec, trap,
    hints: [
      t('t2.radiusHint1', { n: String(bands.size) }),
      t('t2.radiusHint2'),
      t('t2.radiusHint3', { one: String(one.length), two: String(two.length) }),
    ],
  };
}

// ───────── 흐름 추적 (04 §8.3) ─────────

export interface FlowQuiz {
  q: string;
  hint: string;
  answer: string[];
  deck: string[];
  hints: string[];
}

/**
 * 「진입점에서 싱크까지 어떤 순서로 지나가나요?」 — SCC 축약 DAG 에서 최장 단순 경로다.
 * `type` 엣지는 뺀다: 타입만 가져오는 것은 실행 시점에 아무 일도 하지 않아 「흐름」이 아니다.
 *
 * SCC 를 한 노드로 접는 이유는 순환 안에서는 「순서」가 정의되지 않기 때문이다 (04 §7.2).
 * 접힌 SCC 는 대표 경로 하나로 나오므로 답도 그 하나다.
 */
export function buildFlow(input: QuizInput): FlowQuiz | null {
  const edges = input.edges.filter((e) => e.kind !== 'type'
    && input.paths.includes(e.from) && input.paths.includes(e.to));
  const { of, out } = condense(input.paths, edges);

  const entries = input.paths
    .filter((p) => isEntry(p) || input.bandOf(p) === 0)
    .map((p) => of.get(p) ?? p);
  const roots = entries.length > 0
    ? [...new Set(entries)].sort()
    // 진입점이 없으면 들어오는 선이 없는 노드가 그 자리다.
    : [...new Set(input.paths.map((p) => of.get(p) ?? p))]
      .filter((id) => !edges.some((e) => (of.get(e.to) ?? e.to) === id))
      .sort();

  let best: string[] = [];
  for (const root of roots) {
    const path = longest(root, out, new Set());
    if (path.length > best.length) best = path;
  }
  if (best.length < FLOW_MIN) return null;
  const answer = best.slice(0, FLOW_MAX);

  // 함정은 경로 **옆**의 형제다 — 경로 노드가 가리키지만 답에는 없는 노드.
  const siblings = [...new Set(answer.flatMap((id) => out.get(id) ?? []))]
    .filter((id) => !answer.includes(id))
    .sort();
  const deck = [...answer, ...siblings.slice(0, FLOW_DECOYS)].sort();

  const first = answer.at(0) ?? '';
  const last = answer.at(-1) ?? '';
  return {
    q: t('t2.flowQuestion', { first: baseName(first), last: baseName(last) }),
    hint: t('t2.flowHint'),
    answer,
    deck,
    hints: [
      t('t2.flowHint1', { n: String(answer.length) }),
      t('t2.flowHint2'),
      t('t2.flowHint3', { first: baseName(first) }),
    ],
  };
}

/** 깊이 우선 최장 단순 경로. 노드가 24개까지라 가지치기 없이 훑어도 예산 안이다. */
function longest(at: string, out: ReadonlyMap<string, string[]>, seen: ReadonlySet<string>): string[] {
  if (seen.has(at)) return [];
  const next = new Set([...seen, at]);
  let best: string[] = [];
  for (const to of out.get(at) ?? []) {
    const tail = longest(to, out, next);
    if (tail.length > best.length) best = tail;
  }
  return [at, ...best];
}

// ───────── 의존성 방향 (04 §8.3) ─────────

export interface DirectionQuiz {
  q: string;
  hint: string;
  pairs: { a: string; b: string; answer: DirectionAnswer }[];
  hints: string[];
}

/**
 * 「A 와 B — 어느 쪽이 어느 쪽을 가져다 쓰나요?」 5문항.
 *
 * 밴드 차 ≥ 1 인 쌍을 먼저 쓴다 (04 §8.3): 같은 층 두 파일은 눈으로도 방향이 안 보여
 * 찍기가 되고, 층이 다르면 「위가 아래를 쓴다」는 규칙이 답과 맞물린다.
 */
export function buildDirection(input: QuizInput): DirectionQuiz | null {
  const has = (a: string, b: string): boolean =>
    input.edges.some((e) => e.from === a && e.to === b);

  const all: { a: string; b: string; answer: DirectionAnswer; gap: number }[] = [];
  const paths = [...input.paths].sort();
  for (let i = 0; i < paths.length; i += 1) {
    for (let j = i + 1; j < paths.length; j += 1) {
      const a = paths[i] as string;
      const b = paths[j] as string;
      const ab = has(a, b);
      const ba = has(b, a);
      const answer: DirectionAnswer = ab && ba ? 2 : ab ? 0 : ba ? 1 : 3;
      all.push({ a, b, answer, gap: Math.abs(input.bandOf(a) - input.bandOf(b)) });
    }
  }
  // 「무관」만 다섯 개면 지도를 안 봐도 다 맞는다 — 관계가 있는 쌍을 먼저 채운다.
  const related = all.filter((p) => p.answer !== 3).sort(byGap);
  const unrelated = all.filter((p) => p.answer === 3 && p.gap >= 1).sort(byGap);
  if (related.length === 0) return null;

  const rng = mulberry32(input.seed);
  const pool = [...related, ...shuffleSeeded(unrelated, rng)];
  const pairs = pool.slice(0, DIRECTION_PAIRS).map(({ a, b, answer }) => ({ a, b, answer }));
  if (pairs.length < DIRECTION_PAIRS) return null;

  return {
    q: t('t2.directionQuestion'),
    hint: t('t2.directionHint', { n: String(DIRECTION_PAIRS) }),
    pairs,
    hints: [
      t('t2.directionHint1'),
      t('t2.directionHint2'),
      t('t2.directionHint3', { n: String(pairs.filter((p) => p.answer !== 3).length) }),
    ],
  };
}

const byGap = (
  x: { gap: number; a: string; b: string },
  y: { gap: number; a: string; b: string },
): number => y.gap - x.gap || x.a.localeCompare(y.a) || x.b.localeCompare(y.b);

/** 시드 셔플 — `@chickadee/text` 의 `shuffle` 은 배열을 제자리에서 바꾸므로 사본을 넘긴다. */
function shuffleSeeded<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}
