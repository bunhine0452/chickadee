/**
 * 「아직 모르는 개념 개수」와 첫 노출 고르기 (03 §3.6 · 02 §6). 이 파일이 공식의 정본이고
 * `concept_site.unknown_count` 는 그 캐시다 (D24).
 *
 * 왜 이 수가 중심인가: 입문 과정을 따로 만들지 않고 **최소 미지 개념 우선**으로 첫 노출을
 * 고르면 난이도 곡선이 파생된다(정본 §4). `const MAX = 10` 은 적격이고
 * `const [c, setC] = useState(0)` 은 부적격인 이유가 이 한 함수에 있다.
 */
import { isComputed, prereqClosure, type Dict } from '@chickadee/dictionary';

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

/** 창의 여유 폭 — 감싸는 블록을 못 찾았을 때는 이것이 창 전부다 (D141). */
export const WINDOW_PAD = 2;
/** 창의 최대 줄 수. 블록이 이보다 길면 초점을 가운데 두고 자른다 (D141). */
export const WINDOW_MAX_LINES = 40;

/** 줄 범위 하나. `from`·`to` 둘 다 포함이다. */
export interface LineSpan {
  from: number;
  to: number;
}

/**
 * 판에 찍히는 창 — **감싸는 블록 ∪ 초점 ±2**, 상한 40줄 (D141).
 *
 * **정의는 여기 하나다** (D155). `@chickadee/cards` 의 `windowOf` 가 이것을 부른다 —
 * 판이 그리는 창과 순위가 재는 창이 갈라지면 순위는 보이지 않는 것을 재게 된다.
 *
 * 폴백(블록 없음 · 블록 밖 초점)이 초점 ±2 인 이유는 `cards/lines.ts` 에 적혀 있다:
 * 창은 넓히는 것이지 좁히는 것이 아니다.
 */
export function windowRange(focus: number, block?: LineSpan | undefined): LineSpan {
  const floor: LineSpan = { from: focus - WINDOW_PAD, to: focus + WINDOW_PAD };
  if (block === undefined || focus < block.from || focus > block.to) return floor;

  const from = Math.min(block.from, floor.from);
  const to = Math.max(block.to, floor.to);
  if (to - from + 1 <= WINDOW_MAX_LINES) return { from, to };

  const half = Math.floor((WINDOW_MAX_LINES - 1) / 2);
  let cut = focus - half;
  if (cut < from) cut = from;
  else if (cut + WINDOW_MAX_LINES - 1 > to) cut = to - WINDOW_MAX_LINES + 1;
  return { from: cut, to: cut + WINDOW_MAX_LINES - 1 };
}

/** 창의 미지를 세는 데 필요한, 같은 파일 안 사용처의 최소 모양. */
export interface WindowSite {
  conceptId: string;
  lineStart: number;
  lineEnd: number;
}

/** 줄 번호 → 그 줄에 글자가 걸치는 개념들. */
export type LineIndex = ReadonlyMap<number, ReadonlySet<string>>;

/**
 * 파일 하나의 줄 색인. 창은 사용처마다 한 번씩 세는데 한 파일에 사용처가 수천 개라
 * 매번 전량을 훑으면 제곱이 된다 — 한 번 만들어 돌려 쓴다.
 */
export function lineIndex(inFile: readonly WindowSite[]): LineIndex {
  const out = new Map<number, Set<string>>();
  for (const site of inFile) {
    for (let n = site.lineStart; n <= site.lineEnd; n += 1) {
      const at = out.get(n) ?? new Set<string>();
      at.add(site.conceptId);
      out.set(n, at);
    }
  }
  return out;
}

/** 초점을 감싸는 블록 중 **가장 안쪽** — 창의 테두리다. 없으면 `undefined`. */
export function innermostBlock(
  blocks: readonly LineSpan[],
  focus: number,
): LineSpan | undefined {
  let best: LineSpan | undefined;
  for (const block of blocks) {
    if (focus < block.from || focus > block.to) continue;
    if (best === undefined || block.from > best.from) best = block;
  }
  return best;
}

/**
 * **창** 안에서 아직 모르는 개념의 수 (D155).
 *
 * {@link unknownCount} 와 짝이되 재는 자리가 다르다 — 저것은 초점 줄이 「오늘 낼 수 있는
 * 자리인가」를 묻고(문턱 {@link MAX_UNKNOWN_FOR_NEW}), 이것은 같은 값의 자리들 사이에서
 * **어느 화면이 덜 겁나는가**를 묻는다. 문턱이 아니라 순서라서 상한이 없다.
 *
 * 왜 따로 세나: 초점 줄만 보면 1,747줄짜리 파일 한복판의 두 글자짜리 리터럴이 만점을
 * 받는다. 실제로 그랬다 — `function Spark({ data, w = 56, h = 16 }: …)` 의 `56` 이
 * 「숫자」의 첫 판으로 나갔고, 같은 값이던 `const MIN_FONT = 9;` 가 경로 알파벳순에 졌다.
 *
 * 자기 개념은 세지 않는다. 창에 걸치기만 하는 사용처도 창 안에 글자가 보이므로 센다.
 */
export function windowUnknown(
  site: { conceptId: string; lineStart: number },
  block: LineSpan | undefined,
  index: LineIndex,
  layerOf: LayerOf,
): number {
  const win = windowRange(site.lineStart, block);
  const ids = new Set<string>();
  for (let n = win.from; n <= win.to; n += 1) {
    for (const id of index.get(n) ?? []) if (id !== site.conceptId) ids.add(id);
  }
  return [...ids].filter((id) => layerOf(id) === 0).length;
}

export function unknownCount(site: RankableSite, layerOf: LayerOf, dict: Dict): number {
  // Prerequisites from the computed namespaces (`cs/`·`proto/`·…) are what lies *under* the
  // syntax, not what is needed to read the line — they have no site of their own and are
  // reached through the ladder and the site-less queue branch (D154·D157). Counting them
  // here would push ordinary lines over `MAX_UNKNOWN_FOR_NEW` the moment the dictionary
  // links a language concept to the machine beneath it (D173).
  const candidates = new Set([
    ...site.lineConcepts,
    ...[...prereqClosure(dict, site.conceptId, PREREQ_DEPTH)].filter((id) => !isComputed(id)),
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
