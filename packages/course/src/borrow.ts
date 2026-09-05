/**
 * 사용처 없는 개념의 자리 (D172 ⑤).
 *
 * 규약(`proto/`)은 근거 낱말이 보이는 블록이 자리다(`t0-proto.ts`). 기계(`cs/`)는 낱말도
 * 없다 — 자기를 `prereq` 로 가리키는 언어 개념의 사용처 창을 **빌린다**(D157 ②). 여기는
 * 그 역방향 조회와 「어느 창을 빌리나」의 규칙이다. 순수 함수만 있다.
 */
import { PROTO_SITE_ID } from '@chickadee/cards';
import type { FocusLine, LineWindow, SiteInput } from '@chickadee/cards';
import type { Concept } from '@chickadee/dictionary';
import { langOf } from '@chickadee/dictionary';
import type { ConceptSite } from '@chickadee/store-sql';

/** `cs/` 개념 → 자기를 선행으로 가리키는 언어 개념 id (경로 오름차순). 가리키는 것이 없으면 빠진다. */
export function lenders(
  concepts: ReadonlyMap<string, Concept>,
  namespace = 'cs',
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const c of concepts.values()) {
    if (langOf(c.id) === namespace) continue;
    for (const p of c.prereq) {
      if (langOf(p) !== namespace || !concepts.has(p)) continue;
      out.set(p, [...(out.get(p) ?? []), c.id]);
    }
  }
  for (const v of out.values()) v.sort();
  return new Map([...out.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export interface LenderSite {
  conceptId: string;
  site: ConceptSite;
  path: string;
}

/**
 * 빌릴 창 하나 — 미지가 가장 적은 사용처(02 §6.2 의 첫 노출 규칙과 같다), 같으면 짧은 줄,
 * 같으면 id. 추정 캡처와 파싱이 나쁜 자리는 뜻 고르기가 거부하므로(`genMeaning`) 애초에 뺀다.
 */
export function pickLender(sites: readonly LenderSite[]): LenderSite | null {
  const ok = sites.filter((s) => s.site.confidence === 'syntactic' && s.site.parseQuality === 'ok' && s.site.isAlive);
  ok.sort((a, b) => a.site.unknownCount - b.site.unknownCount
    || (a.site.lineEnd - a.site.lineStart) - (b.site.lineEnd - b.site.lineStart)
    || a.site.id - b.site.id);
  return ok[0] ?? null;
}

/**
 * 빌린 창을 뜻 고르기 생성기의 입력으로. 사용처의 id 는 규약과 같은 자리표(`PROTO_SITE_ID`)다 —
 * 원장에는 `NULL` 로 들어가고, `siteKey` 에 빌려준 자리를 남겨 같은 창을 두 번 안 굽는다.
 */
export function borrowedInput(
  target: string,
  lender: LenderSite,
  lines: readonly FocusLine[],
  block: LineWindow | undefined,
): SiteInput {
  const site: ConceptSite = {
    ...lender.site,
    id: PROTO_SITE_ID,
    conceptId: target as ConceptSite['conceptId'],
    siteKey: `borrow:${lender.conceptId}:${lender.site.siteKey}`,
    shape: 'proto',
    picks: {}, hole: null, ctx: {}, lineConcepts: [],
  };
  return { site, path: lender.path, lines, ...(block === undefined ? {} : { block }) };
}

/** 근거 낱말이 보이는 첫 줄의 블록. 규약 카드의 자리다. */
export function evidenceBlock<T extends { lines: readonly FocusLine[] }>(
  concept: Concept,
  blocks: readonly T[],
): T | null {
  if (concept.evidence.length === 0) return null;
  for (const b of blocks) {
    if (b.lines.some((l) => concept.evidence.some((mark) => l.t.includes(mark)))) return b;
  }
  return null;
}
