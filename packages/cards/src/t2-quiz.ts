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

import { condense, folderBand, isEntry } from './t2-graph.js';
import { baseName } from './vars.js';
import {
  MAX_ENTRY_CORE, MIN_ROLE_MEMBERS,
  type Band, type Graph, type GraphEdge,
} from './t2-types.js';

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

// ───────── 리포 지도 두 종 (04 §8.5 · D142) ─────────

/** 지도 노드의 들어오는·나가는 차수. 파일이 아니라 **폴더** 차수다. */
function degreesOf(graph: Graph): Map<string, { i: number; o: number }> {
  const deg = new Map<string, { i: number; o: number }>();
  for (const file of graph.files) deg.set(file.p, { i: 0, o: 0 });
  for (const [from, to] of graph.edges) {
    const a = deg.get(from);
    const b = deg.get(to);
    if (a) a.o += 1;
    if (b) b.i += 1;
  }
  return deg;
}

export interface EntryQuiz {
  q: string;
  hint: string;
  core: Record<string, [string, string]>;
  sec: Record<string, [string, string]>;
  trap: Record<string, string>;
  hints: string[];
}

/**
 * 「밖에서 처음 들어오는 문은 어디인가」 (04 §8.5).
 *
 * `core` = **들어오는 화살표가 없는** 폴더 중 밖으로 나가거나 진입점 이름(`page.*`·`main.*`
 * ·`index.*`, `t2-key.ts` 의 `ENTRY_NAME` 과 같은 정규식)을 품은 것.
 *
 * 04 §8.5 초안은 「진입점 이름 ∪ (in-degree 0 ∧ out-degree > 0)」이었는데, 폴더 단위에서
 * 그 합집합은 **거의 모든 폴더**다 — TS 리포의 `index.ts` 는 문이 아니라 재수출 통이고
 * 폴더마다 하나씩 있다. 그래서 이름은 독립 근거가 아니라 in-degree 0 위의 확인으로 쓰고,
 * 이름은 있는데 안에서도 부르는 폴더는 `sec`(감점 없음)로 내린다. 「문처럼 생긴 것」과
 * 「문」을 가르는 것이 이 문제가 실제로 가르치는 것이다.
 *
 * `trap` 은 나머지 전부이고 사유가 in-degree 다 — 가장 많이 쓰이는 폴더를 고르는 것이
 * 이 문제의 대표 오답이다.
 */
export function buildEntry(graph: Graph): EntryQuiz | null {
  const nodes = graph.files.map((f) => f.p);
  const deg = degreesOf(graph);
  const at = (p: string): { i: number; o: number } => deg.get(p) ?? { i: 0, o: 0 };
  /** 그 폴더가 품은 진입점 이름 하나. 폴더 자체가 진입점 파일이면 그것. */
  const doorName = (p: string): string | null => {
    if (isEntry(p)) return baseName(p);
    const named = (graph.foldedOf[p] ?? []).filter(isEntry).sort();
    const first = named[0];
    return first === undefined ? null : baseName(first);
  };

  const core: Record<string, [string, string]> = {};
  const sec: Record<string, [string, string]> = {};
  for (const path of nodes) {
    const { i, o } = at(path);
    const name = doorName(path);
    if (i === 0 && (o > 0 || name !== null)) {
      core[path] = [t('t2.entryStat'), name === null
        ? t('t2.entryCore', { out: String(o) })
        : t('t2.entryCoreNamed', { name })];
    } else if (name !== null) {
      sec[path] = [t('t2.entrySecStat'), t('t2.entrySec', { name, in: String(i) })];
    }
  }

  const n = Object.keys(core).length;
  // 정답이 지도의 절반이면 아무 데나 찍어도 맞는다.
  if (n === 0 || n > MAX_ENTRY_CORE || n * 2 > nodes.length) {
    return null;
  }

  // 고를 수 있는 오답이 하나도 없으면 문제가 아니다.
  const rest = nodes.filter((p) => core[p] === undefined && sec[p] === undefined);
  const hub = [...rest].sort((a, b) => at(b).i - at(a).i || a.localeCompare(b)).at(0);
  if (hub === undefined) return null;

  const trap: Record<string, string> = {};
  for (const path of rest) trap[path] = t('t2.entryTrap', { in: String(at(path).i) });

  return {
    q: t('t2.entryQuestion'),
    hint: t('t2.entryHint'),
    core, sec, trap,
    hints: [
      t('t2.entryHint1', { n: String(n) }),
      t('t2.entryHint2'),
      t('t2.entryHint3', { name: hub }),
    ],
  };
}

export interface RoleTarget {
  folder: string;
  band: Band;
  /** 이 폴더를 가져다 쓰는 폴더 수 · 이 폴더가 가져다 쓰는 폴더 수. 근거 문장이 이 둘이다. */
  in: number;
  out: number;
  members: number;
}

/**
 * 「왜 있나」를 물어도 되는 폴더 (04 §8.5).
 *
 * **04 §7.2 ① 경로 패턴으로 층이 정해진 폴더에만 낸다.** ② 그래프 깊이로 **추정된** 층은
 * 물어서는 안 된다 — 추정이 틀린 채 「틀렸습니다」를 내면 한 번에 신뢰가 무너지고, 그 뒤로
 * 사용자는 맞는 판정도 믿지 않는다. 게이트는 둘이다: 폴더 경로 자체가 ① 에 걸리고,
 * **그 패턴이 지도가 실제로 그린 층과 같아야** 한다. 둘이 다르면 패턴이 거짓말한 것이다.
 *
 * 순서는 차수 내림차순 → 경로 사전순. 난수가 없다 (04 §9).
 */
export function roleTargets(graph: Graph): RoleTarget[] {
  const deg = degreesOf(graph);
  const out: RoleTarget[] = [];
  for (const file of graph.files) {
    const members = graph.foldedOf[file.p]?.length ?? 0;
    if (members < MIN_ROLE_MEMBERS || folderBand(file.p) !== file.r) continue;
    const d = deg.get(file.p) ?? { i: 0, o: 0 };
    if (d.i + d.o === 0) continue;
    out.push({ folder: file.p, band: file.r, in: d.i, out: d.o, members });
  }
  return out.sort((a, b) => (b.in + b.out) - (a.in + a.out) || a.folder.localeCompare(b.folder));
}

export interface RoleQuiz {
  q: string;
  hint: string;
  folder: string;
  answer: Band;
  hints: string[];
}

/**
 * 「«lib/» 폴더는 왜 있나요?」 4지 (04 §8.5). 보기는 지도의 밴드 라벨 넷이라 payload 에
 * 따로 싣지 않고, 정답은 그 색인이다.
 *
 * 부르는 쪽이 이 폴더를 **지도에서 빼고** 두 번째 지도를 굽는다 — 밴드 행 라벨이 정답을
 * 그대로 읽어 주면 문제가 아니다. 근거는 층 라벨이 아니라 방향 집계다.
 */
export function buildRole(target: RoleTarget): RoleQuiz {
  return {
    q: t('t2.roleQuestion', { folder: target.folder }),
    hint: t('t2.roleHint'),
    folder: target.folder,
    answer: target.band,
    hints: [
      t('t2.roleHint1', { in: String(target.in), out: String(target.out) }),
      t('t2.roleHint2'),
      t('t2.roleHint3', { n: String(target.members) }),
    ],
  };
}
