/**
 * 「아직 모르는 개념 개수」와 첫 노출 고르기 (03 §3.6 · 02 §6). 이 파일이 공식의 정본이고
 * `concept_site.unknown_count` 는 그 캐시다 (D24).
 *
 * 왜 이 수가 중심인가: 입문 과정을 따로 만들지 않고 **최소 미지 개념 우선**으로 첫 노출을
 * 고르면 난이도 곡선이 파생된다(정본 §4). `const MAX = 10` 은 적격이고
 * `const [c, setC] = useState(0)` 은 부적격인 이유가 이 한 함수에 있다.
 */
import { prereqClosure, type Dict } from '@chickadee/dictionary';

/** 잉크 겹 0~4. 0 은 미인쇄 = 아직 모르는 것. */
export type LayerOf = (conceptId: string) => number;

/** 계산에 필요한 사용처의 최소 모양 — 저장 전이든 후든 같은 함수를 쓴다. */
export interface RankableSite {
  conceptId: string;
  lineConcepts: readonly string[];
  uncoveredRatio: number;
  lineStart: number;
  lineEnd: number;
}

/** 선행을 이 단까지 펼친다. 더 깊이 가면 「아는 것」까지 세게 된다. */
export const PREREQ_DEPTH = 2;
/** 이 비율을 넘으면 사전이 그 줄을 절반도 설명하지 못한 것이다. */
export const UNCOVERED_THRESHOLD = 0.5;
/** 이 줄 수부터는 사용처 자체가 부담이다. */
export const LONG_SITE_LINES = 3;
/** 이보다 미지가 많으면 오늘은 보류한다 — 선행이 먼저 찍히면 내려온다 (02 §6.2). */
export const MAX_UNKNOWN_FOR_NEW = 3;

export function unknownCount(site: RankableSite, layerOf: LayerOf, dict: Dict): number {
  const candidates = new Set([
    ...site.lineConcepts,
    ...prereqClosure(dict, site.conceptId, PREREQ_DEPTH),
  ]);
  candidates.delete(site.conceptId);
  let n = [...candidates].filter((id) => layerOf(id) === 0).length;
  // 사전이 모르는 것도 「미지」다 — 설명할 수 없는 줄은 첫 노출로 부적격이다.
  if (site.uncoveredRatio > UNCOVERED_THRESHOLD) n += 1;
  if (site.lineEnd - site.lineStart >= LONG_SITE_LINES) n += 1;
  return n;
}

/**
 * 아는 개념 집합 (02 §6.1). 1겹 이상이면 알고, 같은 보편 개념이 다른 언어에서
 * 3겹 이상이면 **전이**로 아는 것으로 친다 (D4).
 */
export interface MasteryRow {
  conceptId: string;
  layer: number;
  universalId: string | null;
}

export const TRANSFER_LAYER = 3;

export function knownSet(rows: readonly MasteryRow[]): Set<string> {
  const known = new Set(rows.filter((r) => r.layer >= 1).map((r) => r.conceptId));
  const mastered = new Set(
    rows.filter((r) => r.layer >= TRANSFER_LAYER && r.universalId).map((r) => r.universalId),
  );
  for (const row of rows) {
    if (row.layer === 0 && row.universalId && mastered.has(row.universalId)) known.add(row.conceptId);
  }
  return known;
}

/**
 * 첫 노출로 쓸 사용처 고르기 (03 §3.6 끝).
 * 미지 최소 → 사전이 더 많이 설명한 것 → 커밋된 것 → 파일 안 사용처가 많은 파일.
 *
 * 마지막 기준의 이유: 한 파일이 여러 카드에 다시 나오면 그 파일이 익숙해진다.
 */
export interface ChoosableSite extends RankableSite {
  siteKey: string;
  path: string;
  unknown: number;
  isDirty: boolean;
}

export function chooseFirst(sites: readonly ChoosableSite[]): ChoosableSite | null {
  if (sites.length === 0) return null;
  const perFile = new Map<string, number>();
  for (const site of sites) perFile.set(site.path, (perFile.get(site.path) ?? 0) + 1);
  const ordered = [...sites].sort(
    (a, b) =>
      a.unknown - b.unknown
      || a.uncoveredRatio - b.uncoveredRatio
      || Number(a.isDirty) - Number(b.isDirty)
      || (perFile.get(b.path) ?? 0) - (perFile.get(a.path) ?? 0)
      || a.siteKey.localeCompare(b.siteKey),
  );
  return ordered[0] ?? null;
}

/**
 * 같은 개념의 사용처 중 카드로 낼 것 고르기 — `shape` 다양성 (03 §3.5).
 * 같은 모양의 두 번째부터는 「다른 사용처」 목록에만 남는다.
 */
export function distinctShapes<T extends { shape: string; occurrence: number }>(
  sites: readonly T[],
): T[] {
  return sites.filter((s) => s.occurrence === 0);
}
