/**
 * 블록 선정 · 분절 · 대표 개념 (04 §3.1).
 *
 * 후보는 `block.candidates` statement 가 긷는다 — 여기서는 SQL 이 재지 않은 것만 잰다.
 * 겹 평균 · ly 0 개념 수 · 첫 노출 제한 · 대표 개념(D27)이 그것이다.
 *
 * 04 §3.1 은 순위를 「A → B → C → D」 로 이어 놓았지만 넷의 종류가 다르다. B(ly 0 개념
 * ≤ 3개)와 D(첫 노출 ≤ 25줄)는 **넘으면 후보가 아닌 조건**이고, A(겹 평균)와 C(최근 커밋)는
 * **정렬 키**다. 아래에서 `DROPS` 와 `compare` 로 나눠 두었다 — 섞어 놓으면 「탈락인가
 * 뒤로 밀리는가」를 코드에서 읽을 수 없다.
 */
import { t } from '@chickadee/i18n';
import type { Concept } from '@chickadee/dictionary';

import { keepKinds } from './t1-mask.js';
import type { BlockCandidate, BlockConcept } from './t1-types.js';

/** 04 §3.1 「12 ≤ 줄수 ≤ 40」. */
export const MIN_BLOCK_LINES = 12;
export const MAX_BLOCK_LINES = 40;
/** 04 §3.1 「첫 노출은 ≤ 25줄」. */
export const FIRST_PRINT_LINES = 25;
/** 04 §3.1 「ly 0 개념 ≤ 3개」. 못 읽는 코드를 필사시키면 타자 연습이 된다. */
export const MAX_UNKNOWN_CONCEPTS = 3;
/** 「…이어서」 헤더가 차지하는 줄. */
const HEADER_LINES = 1;

// ───────── 분절 (04 §3.1 「41줄 이상 함수는 본문 최상위 문장 경계로」) ─────────

export interface Segment {
  /** 시그니처 + 문장[i..j] + 닫힘. 2번째 조각부터 `lines[0]` 이 「이어서」 주석 헤더다. */
  lines: string[];
  /**
   * 이 조각의 **본문** 파일 줄 범위 (1-based, 양끝 포함). 시그니처·닫힘 줄은 조각마다
   * 되풀이되므로 범위에서 뺀다 — 그래야 `UNIQUE(file_id, line_start, text_hash)` 가
   * 조각들을 서로 다른 행으로 본다.
   */
  lineStart: number;
  lineEnd: number;
  /** 「이어서」 헤더가 붙은 조각인가. 첫 조각만 `false` 다. */
  continued: boolean;
  kind: 'segment';
}

export interface SegmentOptions {
  grammar: string;
  /** 블록 첫 줄의 파일 줄 번호 (1-based). 기본 1. */
  lineStart?: number;
}

/** 「이어서」 헤더 줄인가. 주석 접두를 떼고 표시만 본다 — 접두는 언어가, 표시는 로케일이 정한다. */
export const isContinuedHeader = (line: string): boolean =>
  line.replace(/^\s*(\/\/|#|--)\s*/, '').trim() === t('t1.continued');

/**
 * 주석 접두. 04 §3.1 이 적은 `// …이어서` 는 ts 예시다.
 *
 * 세 갈래다 — `#`(파이썬), `--`(SQL), 나머지는 `//`. SQL 이 `//` 를 받으면 「이어서」 헤더가
 * 주석이 아니라 **구문 오류**가 되어 붙는다 (D156 조사).
 */
const COMMENT_PREFIX: Readonly<Record<string, string>> = { python: '#', sql: '--' };

function commentPrefix(grammar: string): string {
  return COMMENT_PREFIX[grammar] ?? '//';
}

const indentOf = (line: string): number => (/^\s*/.exec(line)?.[0] ?? '').length;

/**
 * 시그니처 줄 범위 (양끝 포함). 첫 시그니처 행(데코레이터·`#[attr]` 포함)부터 본문이 열리는
 * 행(`{` 또는 `:` 로 끝나는 행)까지다 — 04 §3.1 표의 「시그니처 범위」 열.
 *
 * 본문이 같은 줄에서 열리고 닫히는 한 줄 함수는 열리는 행을 못 찾으므로 첫 행에서 멈춘다.
 * 앞머리 주석은 범위 밖이다 — 스펙 카드(§3.3)의 `signature` 가 이 범위만 쓴다.
 */
export function signatureRange(
  lines: readonly string[],
  grammar: string,
): { start: number; end: number } | null {
  const kinds = keepKinds(lines, grammar);
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const kind = kinds[i];
    if (kind === 'signature') { start = i; break; }
    if (kind === 'comment' || kind === 'blank') continue;
    break;
  }
  if (start < 0) return null;
  const limit = Math.min(lines.length, start + 6);
  for (let i = start; i < limit; i += 1) {
    if (/[{:]\s*$/.test(lines[i] ?? '')) return { start, end: i };
  }
  return { start, end: start };
}

/** 닫힘 줄이 시작하는 색인. 뒤에서부터 닫힘·빈 줄만 세어 올라간다. */
function closingStart(lines: readonly string[], kinds: readonly (string | null)[]): number {
  let at = lines.length;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const kind = kinds[i];
    if (kind === 'close' || kind === 'blank') { at = i; continue; }
    break;
  }
  return at;
}

/**
 * 본문을 최상위 문장 묶음으로 자른다. 문장 시작 = 본문 첫 줄과 들여쓰기가 같은 비어 있지
 * 않은 줄. 더 깊은 줄과 빈 줄은 앞 문장에 붙는다.
 */
function statements(body: readonly string[]): string[][] {
  const base = body.find((l) => l.trim() !== '');
  if (base === undefined) return body.length > 0 ? [[...body]] : [];
  const baseIndent = indentOf(base);
  const out: string[][] = [];
  for (const line of body) {
    const starts = line.trim() !== '' && indentOf(line) === baseIndent;
    if (starts || out.length === 0) out.push([line]);
    else out[out.length - 1]?.push(line);
  }
  return out;
}

/**
 * 41줄 이상이면 조각으로 나눈다. 각 조각은 시그니처 + 문장 묶음 + 닫힘이고 12~40줄을
 * 노린다. 40줄 이하이면 입력 그대로 한 조각을 돌려준다 — 부르는 쪽은 조각 수로 분절
 * 여부를 안다.
 *
 * 문장 하나가 예산보다 길면 그 조각만 40줄을 넘긴다. 문장 가운데를 자르면 필사할 수 없는
 * 조각이 나오므로 넘기는 쪽을 고른다.
 */
export function segment(lines: readonly string[], opts: SegmentOptions): Segment[] {
  const from = opts.lineStart ?? 1;
  const whole: Segment[] = [{
    lines: [...lines], lineStart: from, lineEnd: from + lines.length - 1,
    continued: false, kind: 'segment',
  }];
  if (lines.length <= MAX_BLOCK_LINES) return whole;

  const kinds = keepKinds(lines, opts.grammar);
  const sig = signatureRange(lines, opts.grammar);
  const sigEnd = sig === null ? -1 : sig.end;
  const closeAt = closingStart(lines, kinds);
  if (sigEnd < 0 || closeAt <= sigEnd + 1) return whole;

  const signature = lines.slice(0, sigEnd + 1);
  const closing = lines.slice(closeAt);
  const body = lines.slice(sigEnd + 1, closeAt);
  const overhead = signature.length + closing.length;
  const budgetRest = MAX_BLOCK_LINES - overhead - HEADER_LINES;
  if (budgetRest < 1) return whole;

  const groups = statements(body);
  if (groups.length < 2) return whole;

  // 조각 수를 먼저 정하고 그 수로 고르게 나눈다 — 앞에서부터 40줄씩 채우면 마지막 조각이
  // 한두 줄로 남는다.
  const budgetFirst = MAX_BLOCK_LINES - overhead;
  let count = 1;
  while (budgetFirst + (count - 1) * budgetRest < body.length) count += 1;
  const target = Math.ceil(body.length / count);

  const chunks: string[][] = [];
  let at = 0;
  while (at < groups.length) {
    const budget = chunks.length === 0 ? budgetFirst : budgetRest;
    let end = at + 1;
    let size = groups[at]?.length ?? 0;
    while (end < groups.length) {
      const next = groups[end]?.length ?? 0;
      if (size + next > budget || size >= target) break;
      size += next;
      end += 1;
    }
    chunks.push(groups.slice(at, end).flat());
    at = end;
  }

  // 마지막 조각이 12줄에 못 미치면 앞 조각에 되붙인다. 붙여서 40줄을 넘기면 그대로 둔다.
  const tail = chunks[chunks.length - 1];
  const prev = chunks[chunks.length - 2];
  if (tail && prev && overhead + HEADER_LINES + tail.length < MIN_BLOCK_LINES
    && overhead + HEADER_LINES + prev.length + tail.length <= MAX_BLOCK_LINES) {
    chunks.splice(chunks.length - 2, 2, [...prev, ...tail]);
  }

  const header = `${commentPrefix(opts.grammar)} ${t('t1.continued')}`;
  const out: Segment[] = [];
  let offset = sigEnd + 1;
  for (const [i, chunk] of chunks.entries()) {
    const continued = i > 0;
    out.push({
      lines: continued
        ? [header, ...signature, ...chunk, ...closing]
        : [...signature, ...chunk, ...closing],
      lineStart: from + offset,
      lineEnd: from + offset + chunk.length - 1,
      continued,
      kind: 'segment',
    });
    offset += chunk.length;
  }
  return out;
}

// ───────── 블록 순위 (04 §3.1) ─────────

export interface RankOptions {
  /** 페이딩 단계. 1 이면 첫 노출 제한이 걸린다. */
  stage: 1 | 2 | 3;
  /** `card_state.prints`. 없으면 `stage === 1` 을 첫 노출로 읽는다. */
  prints?: number;
}

export interface RankResult {
  blocks: BlockCandidate[];
  /** 탈락한 후보와 사유. `generateT1` 이 「판 없음」 사유로 요약한다. */
  dropped: { blockId: number; reason: string }[];
}

const unknownCount = (c: BlockCandidate): number =>
  c.concepts.filter((k) => k.layer === 0).length;

const meanLayer = (c: BlockCandidate): number =>
  (c.concepts.length === 0 ? 0
    : c.concepts.reduce((sum, k) => sum + k.layer, 0) / c.concepts.length);

/**
 * 탈락 조건. 04 §3.1 의 「ly 0 개념 ≤ 3개」·「첫 노출은 ≤ 25줄」 + 줄수 규칙이다.
 *
 * 「200줄 초과 파일은 블록만 낸다(파일 전체 필사 금지)」는 별도 조건이 필요 없다 —
 * 파일 전체를 필사하는 후보는 `kind === 'file'`(함수가 없는 파일) 뿐이고, 그 후보도 12~40줄
 * 규칙을 그대로 받으므로 200줄 파일은 여기서 이미 떨어진다. 후보 행에 파일 줄 수가 없으니
 * 따로 잴 방법도 없다.
 */
function dropReason(c: BlockCandidate, opts: RankOptions): string | null {
  if (c.lines.length === 0) return t('t1.dropNoLines');
  const n = c.lines.length;
  if (n < MIN_BLOCK_LINES || n > MAX_BLOCK_LINES) {
    return t('t1.dropLineCount', { n: String(n), min: String(MIN_BLOCK_LINES), max: String(MAX_BLOCK_LINES) });
  }
  if (c.concepts.length === 0) return t('t1.dropNoConcepts');
  const unknown = unknownCount(c);
  if (unknown > MAX_UNKNOWN_CONCEPTS) {
    return t('t1.dropTooManyUnknown', { n: String(unknown), max: String(MAX_UNKNOWN_CONCEPTS) });
  }
  const first = opts.prints === undefined ? opts.stage === 1 : opts.prints === 0;
  if (first && n > FIRST_PRINT_LINES) {
    return t('t1.dropFirstPrintTooLong', { max: String(FIRST_PRINT_LINES), n: String(n) });
  }
  return null;
}

/**
 * 정렬 키. ① 겹 평균 높은 순 ② 최근 커밋에 닿은 것 ③ blockId (결정성).
 * 커밋을 모르는 후보는 뒤로 — 「최근 커밋에 닿은 것」의 반대다.
 */
function compare(a: BlockCandidate, b: BlockCandidate): number {
  const layer = meanLayer(b) - meanLayer(a);
  if (layer !== 0) return layer;
  const commit = (b.lastCommitAt ?? -1) - (a.lastCommitAt ?? -1);
  if (commit !== 0) return commit;
  return a.blockId - b.blockId;
}

export function rankBlocks(
  candidates: readonly BlockCandidate[],
  opts: RankOptions,
): RankResult {
  const blocks: BlockCandidate[] = [];
  const dropped: { blockId: number; reason: string }[] = [];
  for (const candidate of candidates) {
    const reason = dropReason(candidate, opts);
    if (reason === null) blocks.push(candidate);
    else dropped.push({ blockId: candidate.blockId, reason });
  }
  blocks.sort(compare);
  return { blocks, dropped };
}

// ───────── 대표 개념 (D27 · 04 §3.1) ─────────

export interface PickOptions {
  /** `_lang.yaml.essential` 을 합친 것. */
  essential: ReadonlySet<string>;
  concepts: ReadonlyMap<string, Concept>;
}

export interface PickedConcept {
  /** 숙련도가 붙는 개념. */
  primary: BlockConcept;
  /** `card_concept(role='secondary')` 로만 남는 나머지. 겹 반영 없음. */
  secondary: BlockConcept[];
}

const byConceptId = (a: BlockConcept, b: BlockConcept): number =>
  (a.conceptId < b.conceptId ? -1 : a.conceptId > b.conceptId ? 1 : 0);

/**
 * D27 — 블록 안 Site 개념 중 `essential` 에 있고 사전 `difficulty` 가 가장 높은 것,
 * 동률은 Site 수 많은 것. 그래도 동률이면 개념 id 오름차순(결정성).
 *
 * 사전에 없는 개념은 `difficulty` 를 모르므로 대표가 되지 못한다 — 필수 문법 목록에
 * 있으나 사전 항목이 아직 없는 개념이 그렇다. 그런 개념도 부수 개념으로는 남는다.
 */
export function pickConcept(
  candidate: BlockCandidate,
  opts: PickOptions,
): PickedConcept | { reason: string } {
  const eligible = candidate.concepts.filter(
    (k) => opts.essential.has(k.conceptId) && opts.concepts.has(k.conceptId),
  );
  if (eligible.length === 0) {
    return { reason: t('t1.dropNoDictConcept') };
  }
  const difficultyOf = (k: BlockConcept): number => opts.concepts.get(k.conceptId)?.difficulty ?? 0;
  const primary = [...eligible].sort((a, b) =>
    difficultyOf(b) - difficultyOf(a)
    || b.siteCount - a.siteCount
    || byConceptId(a, b))[0];
  if (!primary) return { reason: t('t1.dropNoDictConcept') };
  return {
    primary,
    secondary: candidate.concepts
      .filter((k) => k.conceptId !== primary.conceptId)
      .sort(byConceptId),
  };
}
