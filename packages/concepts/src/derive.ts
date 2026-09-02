/**
 * 캡처 → 사용처 (03 §3.3~§3.5). Rust 는 캡처 행만 쓰고, 그것이 무엇을 뜻하는지는
 * 여기서 정해진다 (D1).
 *
 * 파일 하나가 한 단위다. 파일을 넘는 계산(개념 순위·구멍 지도)은 이 결과 위에서 따로 돈다.
 */
import type { Capture } from '@chickadee/ipc-client';
import { fnv1a32, tokenize, type Tok } from '@chickadee/text';

import { OVERSIZE_SITE_LINES } from './ingest-defaults.js';

/** 시스템 쿼리 — 개념이 아니라 파이프라인의 부품이다 (03 §3.2). */
export const SYSTEM_QUERIES = ['_imports', '_blocks'] as const;

/** `concept_site` 한 행 중 파생 층이 정할 수 있는 것 전부. */
export interface DerivedSite {
  conceptId: string;
  siteKey: string;
  lineStart: number;
  lineEnd: number;
  colStart: number;
  colEnd: number;
  tsNodeKind: string | null;
  form: string | null;
  shape: string;
  occurrence: number;
  excerpt: string;
  picks: Record<number, string>;
  hole: string | null;
  ctx: Record<string, string>;
  lineConcepts: string[];
  uncoveredRatio: number;
  confidence: 'syntactic' | 'heuristic';
  isOversize: boolean;
  /** 파일 안 바이트 범위 — 겹침 계산에 쓰고 저장하지는 않는다. */
  startByte: number;
  endByte: number;
}

/** `_imports` 캡처 한 건. 경로 해석은 M4 `resolve-imports.ts` 의 몫이다. */
export interface RawImport {
  specifier: string;
  form: string | null;
  line: number;
}

/** `_blocks` 캡처 한 건. 분절과 AST 캐시는 M3 이 채운다. */
export interface RawBlock {
  name: string | null;
  lineStart: number;
  lineEnd: number;
  startByte: number;
  endByte: number;
}

export interface DeriveResult {
  sites: DerivedSite[];
  imports: RawImport[];
  blocks: RawBlock[];
}

/** 개념 하나가 휴리스틱(`#match?`)에 기대는지 — 첫 노출에서 후순위로 민다 (03 위험표). */
export type ConfidenceOf = (conceptId: string) => 'syntactic' | 'heuristic';

interface Match {
  queryId: string;
  matchId: number;
  patternIndex: number;
  form: string | null;
  site: Capture | null;
  picks: Map<number, Capture>;
  hole: Capture | null;
  ctx: Map<string, Capture>;
  imports: Capture[];
  blockRange: Capture | null;
  blockName: Capture | null;
}

/**
 * 파일 하나의 캡처를 사용처로 바꾼다.
 *
 * `path` 가 인자에 있는 이유는 `siteKey` 가 경로를 포함하기 때문이다 — 줄 번호가 아니라
 * 모양과 등장 순서로 정체성을 잡아야 줄이 밀려도 학습 기록이 살아남는다 (03 §1.6).
 */
export function deriveFile(
  path: string,
  captures: readonly Capture[],
  confidenceOf: ConfidenceOf = () => 'syntactic',
): DeriveResult {
  const matches = group(captures);
  const sites: DerivedSite[] = [];
  const imports: RawImport[] = [];
  const blocks: RawBlock[] = [];
  const contexts: Match[] = [];

  for (const match of matches) {
    if (match.queryId === '_imports') {
      for (const cap of match.imports) {
        imports.push({ specifier: unquote(cap.excerpt), form: match.form, line: cap.startLine });
      }
      continue;
    }
    if (match.queryId === '_blocks') {
      if (match.blockRange) {
        blocks.push({
          name: match.blockName?.excerpt ?? null,
          lineStart: match.blockRange.startLine,
          lineEnd: match.blockRange.endLine,
          startByte: match.blockRange.startByte,
          endByte: match.blockRange.endByte,
        });
      }
      continue;
    }
    // 복구 영역 안의 매치는 토큰 위치를 믿을 수 없다 (03 §2.3).
    if (match.site === null) contexts.push(match);
    else if (!match.site.inError) sites.push(bare(match, match.site, confidenceOf));
  }

  // 정렬은 (시작, 끝) 오름차순 — 같은 자리에서 시작하면 안쪽이 먼저다 (03 §3.2).
  sites.sort((a, b) => a.startByte - b.startByte || a.endByte - b.endByte);
  mergeContexts(sites, contexts);
  countLineConcepts(sites);
  numberOccurrences(path, sites);
  return { sites, imports, blocks };
}

function group(captures: readonly Capture[]): Match[] {
  const out = new Map<string, Match>();
  for (const cap of captures) {
    const key = `${cap.queryId}#${cap.matchId}`;
    let match = out.get(key);
    if (!match) {
      match = {
        queryId: cap.queryId, matchId: cap.matchId, patternIndex: cap.patternIndex,
        form: cap.form, site: null, picks: new Map(), hole: null, ctx: new Map(),
        imports: [], blockRange: null, blockName: null,
      };
      out.set(key, match);
    }
    if (cap.name === 'site') match.site = cap;
    else if (cap.name === 'hole') match.hole = cap;
    else if (cap.name === 'import.source') match.imports.push(cap);
    else if (cap.name === 'block.function') match.blockRange = cap;
    else if (cap.name === 'block.name') match.blockName = cap;
    else if (cap.name.startsWith('pick.')) match.picks.set(Number(cap.name.slice(5)), cap);
    else if (cap.name.startsWith('ctx.')) match.ctx.set(cap.name.slice(4), cap);
  }
  return [...out.values()];
}

function bare(match: Match, site: Capture, confidenceOf: ConfidenceOf): DerivedSite {
  const picks: Record<number, string> = {};
  for (const [n, cap] of match.picks) picks[n] = cap.excerpt;
  const ctx: Record<string, string> = {};
  for (const [name, cap] of match.ctx) ctx[name] = cap.excerpt;
  return {
    conceptId: match.queryId,
    siteKey: '',
    lineStart: site.startLine,
    lineEnd: site.endLine,
    colStart: site.startCol,
    colEnd: site.endCol,
    tsNodeKind: site.nodeKind,
    form: match.form,
    shape: shapeOf(site.excerpt),
    occurrence: 0,
    excerpt: site.excerpt,
    picks,
    hole: match.hole?.excerpt ?? null,
    ctx,
    lineConcepts: [],
    uncoveredRatio: 0,
    confidence: confidenceOf(match.queryId),
    isOversize: site.endLine - site.startLine + 1 > OVERSIZE_SITE_LINES,
    startByte: site.startByte,
    endByte: site.endByte,
  };
}

/**
 * 맥락 패턴(`@site` 없이 `@ctx.*` 만)의 값을 같은 개념 사용처에 붙인다.
 * 사용처가 스스로 잡은 ctx 가 우선이다 (03 §3.4-2).
 *
 * **근사다.** 문서는 「매치의 최외곽 노드 범위 안」이라고 적었는데, 캡처 행에는 그 노드가
 * 없다 — 맥락 패턴은 `@ctx.*` 만 잡으므로 매치의 뿌리 범위를 알 길이 없다. 대신
 * 「같은 줄이고, 사용처가 맥락 캡처보다 앞에서 시작한다」를 쓴다. `a?.b ?? c` 처럼
 * 맥락이 표현식의 오른쪽에 오는 실제 형태에서는 같은 답이 나오고, 한 줄에 서로 무관한
 * 같은 개념 표현식이 둘 있을 때만 넓게 붙는다.
 */
function mergeContexts(sites: DerivedSite[], contexts: readonly Match[]): void {
  for (const match of contexts) {
    for (const [name, cap] of match.ctx) {
      for (const site of sites) {
        if (site.conceptId !== match.queryId) continue;
        if (site.lineStart !== cap.startLine) continue;
        if (site.startByte >= cap.endByte) continue;
        if (!(name in site.ctx)) site.ctx[name] = cap.excerpt;
      }
    }
  }
}

/**
 * 같은 줄에 있는 다른 개념들과, 사전이 설명하지 못한 비율.
 * 바닥 개념(`ts/call-expression` 같은 것)이 여기서 덮개 노릇을 한다 (03 §3.4-3).
 */
function countLineConcepts(sites: DerivedSite[]): void {
  const byLine = new Map<number, DerivedSite[]>();
  for (const site of sites) {
    for (let line = site.lineStart; line <= site.lineEnd; line += 1) {
      const at = byLine.get(line) ?? [];
      at.push(site);
      byLine.set(line, at);
    }
  }
  for (const site of sites) {
    const near = byLine.get(site.lineStart) ?? [];
    site.lineConcepts = [...new Set(near.map((s) => s.conceptId))]
      .filter((id) => id !== site.conceptId)
      .sort();
    site.uncoveredRatio = uncovered(site, near);
  }
}

/**
 * 사용처의 토큰 중 **다른 어떤 사용처에도 덮이지 않은** 비율.
 * 1 에 가까울수록 이 줄에 대해 사전이 아는 것이 적다는 뜻이고, 미지 개념 수에 +1 을 부른다.
 */
function uncovered(site: DerivedSite, near: readonly DerivedSite[]): number {
  const toks = meaningful(tokenize(site.excerpt));
  if (toks.length === 0) return 0;
  const others = near.filter((s) => s !== site && s.conceptId !== site.conceptId);
  if (others.length === 0) return 1;
  let covered = 0;
  for (const tok of toks) {
    // `tok.col` 은 문자열 인덱스(UTF-16)이고 `startByte` 는 UTF-8 바이트다.
    // 한글이나 이모지가 든 줄에서 두 단위를 그냥 더하면 어긋난다.
    const at = site.startByte + utf8Length(site.excerpt.slice(0, tok.col));
    if (others.some((s) => s.startByte <= at && at < s.endByte)) covered += 1;
  }
  return 1 - covered / toks.length;
}

const utf8 = new TextEncoder();
const utf8Length = (text: string): number => utf8.encode(text).length;

/** 개념이 붙을 수 있는 토큰. 구두점은 개념이 아니라 구조라 덮개 계산에서 뺀다. */
const meaningful = (toks: readonly Tok[]): Tok[] =>
  toks.filter((t) => t.k !== 'ws' && t.k !== 'cmt' && t.k !== 'punct');

/** 모양에 남는 토큰. 구두점은 **남긴다** — `f(a)` 와 `f a` 는 같은 모양이 아니다. */
const structural = (toks: readonly Tok[]): Tok[] =>
  toks.filter((t) => t.k !== 'ws' && t.k !== 'cmt');

/**
 * 식별자는 `_`, 리터럴은 `#`. 「같은 모양의 두 번째 사용처」를 세기 위한 정규형이다 —
 * `products.map(p => …)` 스무 줄이 카드 스무 장이 되지 않게 한다 (03 §3.5).
 */
export function shapeOf(text: string): string {
  return structural(tokenize(text))
    .map((t) => {
      if (t.k === 'id') return '_';
      if (t.k === 'num' || t.k === 'str' || t.k === 'tpl') return '#';
      return t.t;
    })
    .join('');
}

function numberOccurrences(path: string, sites: DerivedSite[]): void {
  const seen = new Map<string, number>();
  for (const site of sites) {
    const key = `${site.conceptId} ${site.shape}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    site.occurrence = n;
    site.siteKey = siteKey(site.conceptId, path, site.shape, n);
  }
}

/**
 * 사용처의 정체성. 줄 번호가 들어가지 않으므로 줄이 밀려도 학습 기록이 따라온다 (03 §1.6).
 *
 * 문서는 sha1 이라고 적었지만 여기서는 **동기 64비트 FNV-1a 두 벌**을 쓴다 (D70) —
 * 웹뷰의 `crypto.subtle` 은 비동기라 사용처 5만 건에 프로미스 5만 개가 생기고,
 * 이 값에 필요한 성질은 충돌 회피이지 암호학적 강도가 아니다.
 */
export function siteKey(conceptId: string, path: string, shape: string, occurrence: number): string {
  const body = `${conceptId} ${path} ${shape} ${occurrence}`;
  const lo = fnv1a32(body);
  const hi = fnv1a32(`${body}`);
  return `${hi.toString(16).padStart(8, '0')}${lo.toString(16).padStart(8, '0')}`;
}

/** `'./x.js'` · `"./x.js"` → `./x.js` */
function unquote(text: string): string {
  const first = text.at(0);
  return first === "'" || first === '"' || first === '`' ? text.slice(1, -1) : text;
}
