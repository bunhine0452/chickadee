/**
 * 새 개념 순위 (02 §6.2·§6.3·§6.4). 「오늘 무엇을 처음 배울까」를 정하는 곳이다.
 *
 * 별도 입문 과정·배치고사를 만들지 않는다는 결정(정본 §4)의 구현이 여기다 — **최소 미지
 * 개념 우선**으로 첫 노출을 고르면 난이도 곡선은 파생된다. `const MAX = 10` 은 적격이고
 * `const [c, setC] = useState(0)` 은 부적격인 이유가 `unknownCount`(03 §3.6)에 있고,
 * 이 파일은 그 위에 선행 깊이(D75)와 동점 규칙을 얹는다.
 */
import { MAX_UNKNOWN_FOR_NEW, TRANSFER_LAYER } from './unknown-rank.js';

/** 후보 개념 하나 — `queue.new_candidates` 한 행. */
export interface NewCandidate {
  conceptId: string;
  siteCount: number;
}

/** `queue.best_site` 한 행. 첫 노출로 쓸 사용처. */
export interface BestSite {
  siteId: number;
  unknown: number;
  lineStart: number;
  lineEnd: number;
}

export interface RankedConcept extends NewCandidate {
  best: BestSite;
}

export interface RankInput {
  candidates: readonly NewCandidate[];
  /** 개념 → 첫 노출 사용처. 없으면 `null` (사용처가 죽었을 수 있다). */
  bestSiteOf: (conceptId: string) => BestSite | null;
  /** 선행 그래프 — `queue.prereq_edges` 를 개념별로 모은 것. */
  prereqOf: (conceptId: string) => readonly string[];
}

/**
 * 후보 집합 안에서의 **선행 깊이**. 뿌리(선행이 후보에 없는 것)가 0 이고, 그 위로 1씩 오른다.
 *
 * 왜 `topoOrder` 를 그대로 쓰지 않나 (D75): 위상 정렬은 **전순서**를 돌려준다 — 두 개념의
 * 순번이 같은 일이 없으므로 02 §6.2 의 나머지 세 기준(미지 수 · 사용 횟수 · id)이 한 번도
 * 실행되지 않는다. 형제(같은 깊이) 사이를 그 세 기준이 가르게 하려면 깊이여야 한다.
 *
 * 사이클은 사전 린트가 잡을 일이다. 여기서는 멈추지 않고 풀리지 않은 것을 깊이 0 으로 둔다.
 */
export function prereqDepth(
  ids: readonly string[],
  prereqOf: (id: string) => readonly string[],
): Map<string, number> {
  const known = new Set(ids);
  const depth = new Map<string, number>();
  const visiting = new Set<string>();

  const walk = (id: string): number => {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0; // 사이클 — 여기서 끊는다
    visiting.add(id);
    let d = 0;
    for (const p of prereqOf(id)) {
      if (!known.has(p)) continue;
      d = Math.max(d, walk(p) + 1);
    }
    visiting.delete(id);
    depth.set(id, d);
    return d;
  };

  for (const id of ids) walk(id);
  return depth;
}

/**
 * 02 §6.2. 정렬은 ① 선행 깊이(뿌리부터) ② 미지 적은 것 ③ 내 코드에 많이 나오는 것 ④ id.
 *
 * 미지 4 이상은 오늘 보류한다 — 버리는 것이 아니라 **선행이 먼저 찍히면 저절로 내려온다**.
 * 이것이 「합성 예제를 만들지 않고도 바닥부터 오른다」의 전부다.
 */
export function rankNewConcepts(input: RankInput): RankedConcept[] {
  const ids = input.candidates.map((c) => c.conceptId);
  const depth = prereqDepth(ids, input.prereqOf);

  return input.candidates
    .map((c) => ({ ...c, best: input.bestSiteOf(c.conceptId) }))
    .filter((c): c is RankedConcept => c.best !== null && c.best.unknown <= MAX_UNKNOWN_FOR_NEW)
    .sort(
      (a, b) =>
        (depth.get(a.conceptId) ?? 0) - (depth.get(b.conceptId) ?? 0)
        || a.best.unknown - b.best.unknown
        || b.siteCount - a.siteCount
        || a.conceptId.localeCompare(b.conceptId),
    );
}

/**
 * 카드 `level` (02 §6.2 끝). 첫 노출은 1(미지 ≤ 2), 2겹부터 2(미지 ≤ 3), 3겹부터 3(제한 없음).
 * 같은 개념이 점점 복잡한 **자기 코드**로 나오게 하는 장치다.
 */
export function levelForLayer(layer: number): 1 | 2 | 3 {
  if (layer <= 1) return 1;
  return layer === 2 ? 2 : 3;
}

/** `level` 별 미지 상한. 3은 제한이 없다. */
export const UNKNOWN_CAP: Record<1 | 2 | 3, number> = { 1: 2, 2: 3, 3: Number.MAX_SAFE_INTEGER };

/**
 * 진짜 바닥 (02 §6.2 E-4) — 후보의 모든 사용처가 미지 4 이상인데 남은 선행이 하나도 없다.
 * 그때만 합성 예제를 만들고 본문에 「곧 `useCart.ts:27` 에서 이걸 봅니다」를 반드시 넣는다.
 */
export function isRockBottom(
  candidate: NewCandidate,
  best: BestSite | null,
  prereq: readonly string[],
  known: ReadonlySet<string>,
): boolean {
  if (best === null) return false;
  if (best.unknown <= MAX_UNKNOWN_FOR_NEW) return false;
  return prereq.every((p) => known.has(p));
}

// ───────── 02 §6.3 개념 전이 ─────────

export interface TransferSource {
  conceptId: string;
  universalId: string | null;
  layer: number;
}

/**
 * 같은 `universal_id` 의 다른 언어 개념이 3겹 이상이면 첫 노출을 1겹에서 시작한다.
 * 숙련도는 여전히 **언어고유 개념**에 붙는다 — 전이는 출처를 적어 둘 뿐이다.
 */
export function transferFrom(
  conceptId: string,
  universalId: string | null,
  rows: readonly TransferSource[],
): string | null {
  if (universalId === null) return null;
  const donors = rows
    .filter((r) => r.conceptId !== conceptId && r.universalId === universalId
      && r.layer >= TRANSFER_LAYER)
    .sort((a, b) => b.layer - a.layer || a.conceptId.localeCompare(b.conceptId));
  return donors[0]?.conceptId ?? null;
}

// ───────── 02 §6.4 프로그래밍 완전 초보 감지 ─────────

/** 뿌리 개념 새 판을 이만큼 찍어야 판단한다. */
export const NEWCOMER_MIN_ROOT_NEW = 4;
/** 그중 이만큼이 오답·모르겠어요면 의심한다. */
export const NEWCOMER_MIN_MISSES = 3;
/** 뿌리 개념 4장 중 3장을 맞히는 세션이 나오면 플래그를 지운다. */
export const NEWCOMER_CLEAR_OKS = 3;

export type NewcomerFlag = 'none' | 'suspect' | 'confirmed';

export interface RootResult {
  conceptId: string;
  ok: boolean;
  dunno: boolean;
}

export interface NewcomerInput {
  /** 이 세션에서 찍은 **뿌리 개념**(선행이 없는 T0 개념) 새 판의 결과. */
  rootResults: readonly RootResult[];
  /** 사다리 2단이 「비어 있는 층 0」을 보고한 횟수 — 내려갈 곳이 없었던 경우. */
  emptyPrereqReports: number;
  previous: NewcomerFlag;
}

/**
 * 세 조건이 **한 세션 안에서** 모두 참이면 `suspect`, 다음 세션에서도 참이면 `confirmed`.
 * `confirmed` 여도 **아무것도 잠그지 않는다** — 홈에 안내 한 줄이 뜰 뿐이다.
 * 억지로 커버하는 척하면 둘 다 못 한다는 결론(정본 §1)을 데이터로 구현한 것이다.
 */
export function newcomerFlag(input: NewcomerInput): NewcomerFlag {
  const n = input.rootResults.length;
  const oks = input.rootResults.filter((r) => r.ok && !r.dunno).length;
  if (n >= NEWCOMER_MIN_ROOT_NEW && oks >= NEWCOMER_CLEAR_OKS) return 'none';

  const misses = input.rootResults.filter((r) => !r.ok || r.dunno).length;
  const suspicious = n >= NEWCOMER_MIN_ROOT_NEW
    && misses >= NEWCOMER_MIN_MISSES
    && input.emptyPrereqReports >= misses;
  if (!suspicious) return input.previous;
  return input.previous === 'none' ? 'suspect' : 'confirmed';
}
