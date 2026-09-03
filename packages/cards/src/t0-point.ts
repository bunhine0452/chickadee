/**
 * 지목형 (04 §1.1). 코드 위의 토큰 하나를 짚는다 — 보기는 코드 자체라
 * `payload.options` 가 없고, `seg[].pick` 번호가 곧 보기 번호다.
 *
 * 셔플하지 않는 이유: 위치가 정보이고 `← →` 이동 순서와 같아야 한다.
 */
import { mulberry32, tokenize, josa } from '@chickadee/text';
import type { Concept } from '@chickadee/dictionary';

import { codeLines, lineAt, type Span } from './lines.js';
import { commonPayload, finish, renderDiag, seedFor, type Diag } from './payload.js';
import { buildVars, Renderer } from './vars.js';
import type { FocusLine, GenResult, SiteInput, T0Request } from './types.js';

/** 오답을 셋 채우지 못하면 「어느 걸 짚어도 맞다」가 되어 진단을 붙일 자리가 없다. */
const WRONG_N = 3;
/** 후보로 쓸 토큰의 최소 길이. 한 글자는 짚기도 어렵고 뜻도 없다. */
const MIN_TOKEN = 2;

type CandKind = 'op' | 'id' | 'lit' | 'other';

interface Candidate extends Span {
  text: string;
  source: 'pick' | 'confusion' | 'token';
  pickN?: number;
  conceptId?: string;
  kind: CandKind;
}

const ROLE: Readonly<Record<CandKind, string>> = {
  op: '기호', id: '이름', lit: '값', other: '조각',
};

function classify(text: string): CandKind {
  const tokens = tokenize(text).filter((t) => t.k !== 'ws');
  const only = tokens.length === 1 ? tokens[0] : undefined;
  if (!only) return 'other';
  if (only.k === 'op') return 'op';
  if (only.k === 'id' || only.k === 'kw') return 'id';
  if (only.k === 'num' || only.k === 'str' || only.k === 'tpl') return 'lit';
  return 'other';
}

const overlaps = (a: Span, b: Span): boolean =>
  a.line === b.line && a.from < b.to && b.from < a.to;

/** 이미 잡힌 자리를 피해 처음 나오는 자리를 찾는다. */
function place(line: FocusLine, text: string, taken: readonly Span[]): Span | null {
  for (let at = line.t.indexOf(text); at !== -1; at = line.t.indexOf(text, at + 1)) {
    const span = { line: line.n, from: at, to: at + text.length };
    if (!taken.some((t) => overlaps(t, span))) return span;
  }
  return null;
}

/**
 * 초점에서 `window` 줄 안의 후보 전부. 순서: 내 pick → 혼동 개념 pick → 리터럴·식별자.
 *
 * 04 §1.1 은 토큰을 「부족할 때만」 넣으라고 적지만 여기서는 늘 모아 둔다 — 아래
 * `tierOf` 가 토큰을 ③④⑤로 내려 두므로 pick·혼동이 셋을 채우면 토큰은 뽑히지 않는다.
 * 결과는 같고, 후보 수를 세는 자리가 한 곳으로 준다.
 */
function collect(input: SiteInput, concept: Concept, window: number): Candidate[] {
  const focus = input.site.lineStart;
  const lines = input.lines.filter((l) => Math.abs(l.n - focus) <= window);
  const out: Candidate[] = [];

  const focusLine = lineAt(lines, focus);
  if (focusLine) {
    for (const [n, text] of Object.entries(input.site.picks)) {
      const span = place(focusLine, text, out);
      if (span) out.push({ ...span, text, source: 'pick', pickN: Number(n), kind: classify(text) });
    }
  }
  const confusions = new Set(concept.confusions);
  for (const site of input.lineSites ?? []) {
    if (!confusions.has(site.conceptId)) continue;
    for (const text of Object.values(site.picks)) {
      const line = lines.find((l) => l.t.includes(text));
      const span = line ? place(line, text, out) : null;
      if (span) {
        out.push({ ...span, text, source: 'confusion', conceptId: site.conceptId, kind: classify(text) });
      }
    }
  }
  for (const line of lines) {
    for (const token of tokenize(line.t)) {
      if (!['id', 'num', 'str', 'tpl'].includes(token.k)) continue;
      if (token.t.length < MIN_TOKEN) continue;
      const span = { line: line.n, from: token.col, to: token.col + token.t.length };
      if (out.some((c) => overlaps(c, span))) continue;
      out.push({ ...span, text: token.t, source: 'token', kind: classify(token.t) });
    }
  }
  return out;
}

/** 04 §1.1 오답 선정 순서 ①진단 있는 pick ②혼동 토큰 ③같은 종류 ④리터럴. */
function tierOf(c: Candidate, answer: Candidate, hasDiag: (n: number) => boolean): number {
  if (c.pickN !== undefined && hasDiag(c.pickN)) return 1;
  if (c.source === 'confusion') return 2;
  if (c.kind === answer.kind) return 3;
  if (c.kind === 'lit') return 4;
  return 5;
}

const byPosition = (a: Candidate, b: Candidate): number => a.line - b.line || a.from - b.from;

/** 「가까운 순」 — 다른 줄은 같은 줄보다 언제나 멀다. */
const distance = (c: Candidate, answer: Candidate): number =>
  Math.abs(c.line - answer.line) * 1_000 + Math.abs(c.from - answer.from);

export function genPoint(req: T0Request, input: SiteInput): GenResult {
  const { concept } = req;
  if (concept.point.length === 0) return { reason: '사전에 지목형 문항이 없다' };
  const seed = seedFor(req, 'point', input);
  const rng = mulberry32(seed);
  const entry = concept.point[Math.floor(rng() * concept.point.length)] ?? concept.point[0];
  if (!entry) return { reason: '사전에 지목형 문항이 없다' };

  const answerN = Number(entry.answer.slice('pick.'.length));
  const hasDiag = (n: number): boolean => entry.diag?.[`pick.${n}`] !== undefined;

  // 후보가 셋에 못 미치면 초점 ±1 줄로 넓힌다 (04 §1.1).
  let candidates: Candidate[] = [];
  let answer: Candidate | undefined;
  for (const window of [0, 1]) {
    candidates = collect(input, concept, window);
    answer = candidates.find((c) => c.pickN === answerN);
    if (answer && candidates.length - 1 >= WRONG_N) break;
  }
  if (!answer) return { reason: `정답 토큰 ${entry.answer} 이 초점 줄에 없다` };
  const chosen = answer;
  const pool = candidates.filter((c) => c !== chosen);
  if (pool.length < WRONG_N) return { reason: '짚을 후보가 3개에 못 미친다' };

  const wrong = [...pool]
    .sort((a, b) =>
      tierOf(a, chosen, hasDiag) - tierOf(b, chosen, hasDiag)
      || distance(a, chosen) - distance(b, chosen)
      || byPosition(a, b))
    .slice(0, WRONG_N);

  const picks = [chosen, ...wrong].sort(byPosition);
  const spans: Span[] = picks.map((c, i) => ({ line: c.line, from: c.from, to: c.to, pick: i + 1 }));
  const answerIndex = picks.indexOf(chosen);

  const vars = buildVars(input, concept);
  const r = new Renderer(vars);
  const why = picks.map((c, i) => (i === answerIndex ? null : diagFor(c, chosen, entry, req, input, r)));
  const common = commonPayload(req, input, r);
  const q = r.need(entry.q);
  const hint = entry.hint === undefined ? '' : r.need(entry.hint);
  if (!r.ok) return { reason: r.reason };

  return {
    card: finish(req, input, 'point', {
      track: 't0', kind: 'point', ...common,
      lines: codeLines(input.lines, input.site.lineStart, spans),
      q, hint, answer: answerIndex, why,
    }),
  };
}

/**
 * 04 §2.1 진단 선택 표. ①사전 `point[].diag` ②같은 줄 혼동 개념의 `dict.one_liner`
 * + `misconceptions` ③`_lang.yaml.diag_default.point`.
 */
function diagFor(
  c: Candidate,
  answer: Candidate,
  entry: Concept['point'][number],
  req: T0Request,
  input: SiteInput,
  r: Renderer,
): Diag {
  const entryDiag = c.pickN === undefined ? undefined : entry.diag?.[`pick.${c.pickN}`];
  if (entryDiag) return renderDiag(entryDiag, r);

  const confused = c.conceptId === undefined ? undefined : req.concepts.get(c.conceptId);
  // 혼동 개념의 문장은 **그 개념의** 변수를 참조할 수 있다. 변수가 든 문장은 이 사용처의
  // 값으로 채우면 뜻이 뒤집히므로 쓰지 않고 폴백으로 내려간다.
  if (confused && !confused.dict.one_liner.includes('{{')) {
    const first = confused.misconceptions.find((m) => !m.includes('{{'));
    return { t: first ? `${confused.dict.one_liner} ${first}` : confused.dict.one_liner };
  }

  // 조사는 앞 값이 정한다 — 하드코딩하면 「«map» 은」·「«useState» 은」이 둘 다 나온다 (03 §4.3).
  const plain = `«${c.text}»${josa(c.text, '은', '는')} ${ROLE[c.kind]} 자리입니다. `
    + `정답은 «${answer.text}» 입니다.`;
  const template = req.diagDefault?.point;
  if (template === undefined) return { t: plain };
  const soft = new Renderer(buildVars(input, req.concept, {
    extra: { pick: c.text, role: ROLE[c.kind], answer: answer.text, rule: r.need(req.concept.rule) },
  }));
  const text = soft.maybe(template);
  return { t: text ?? plain };
}
