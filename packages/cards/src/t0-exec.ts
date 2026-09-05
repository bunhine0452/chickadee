/**
 * 실행 추적 문항 (D151). `exec-facts.ts` 가 낸 **사실** 위에서만 돈다.
 *
 * 층을 가른 규칙: 문법 이름을 아는 것은 `exec-facts` 뿐이고(그래서 진짜 파스 트리로 잰다),
 * 이 파일은 그 결과만 받는다. 새 언어가 들어와도 여기는 안 고친다.
 *
 * **산문은 i18n 이 댄다 — 사전이 아니다.** 오답마다 「그것이 참이 되는 조건」(정본 §3-2)을
 * 내야 하는데, `WrongBecause` 네 이유는 **개념마다 다르지 않고 언어에도 매이지 않는다**
 * (정의는 어느 언어에서도 실행이 아니다). 사전에 두면 개념 수만큼 같은 문장을 복제하게 된다.
 * 생성기가 문항을 만드는 `arch/*`(T2)가 같은 이유로 진단을 카탈로그에 두는 선례다.
 * 사전은 개념 산문(`dict`·`rule`·`ok`·`misconceptions`)만 댄다.
 */
import { t, type MessageKey } from '@chickadee/i18n';
import type { AstLite, ConceptId, ConceptSite } from '@chickadee/store-sql';

import { blockOf, dialectOf, execFacts, functionsIn, lineIndex } from './exec-facts.js';
import type { ExecFacts } from './exec-facts.js';
import { codeLines, type Span } from './lines.js';
import { commonPayload, finish } from './payload.js';
import { buildVars, Renderer } from './vars.js';
import type { FocusLine, GenResult, LineWindow, SiteInput, T0Request } from './types.js';

/** 오답이 참이 되는 조건. 산문은 사전의 `diag` 가 이 키로 댄다. */
export type WrongBecause =
  /** 실제로 도는 줄이다 — 다만 첫 번째가 아니다. */
  | 'runs'
  /** 조건·반복 안이라 「돌 수도 있다」다. */
  | 'conditional'
  /** 정의는 실행이 아니다 — 부르는 자리에서 돈다. */
  | 'definition'
  /** 중첩 함수 안이라 그 함수를 부를 때만 돈다. */
  | 'nested';

export interface ExecPick {
  /** 1-based 줄. */
  line: number;
  /** `null` 이면 정답이다. */
  because: WrongBecause | null;
}

export interface ExecQuestion {
  focus: number;
  window: LineWindow;
  /** **줄 번호 오름차순.** 위치가 정보이고 `← →` 이동 순서와 같아야 한다 (04 §1.1). */
  picks: ExecPick[];
  /** `picks` 안에서 정답의 자리. */
  answer: number;
}

/** 오답 셋을 못 채우면 「어느 걸 짚어도 맞다」가 되어 진단을 붙일 자리가 없다 (`t0-point.ts` 와 같은 값). */
const WRONG_N = 3;

export interface FirstRunInput {
  facts: ExecFacts;
  /** 함수 정의 노드 — 그 머리 줄이 「정의는 실행이 아니다」 오답이 된다. */
  fn: AstLite;
  /** 노드 → 1-based 줄. `exec-facts` 의 `lineIndex` 를 그대로 넘긴다. */
  at: (offset: number) => number;
  /** 창. 부르는 쪽이 `block` 범위를 준다 (D141). */
  window: LineWindow;
}

/**
 * 「이 함수를 부르면 **가장 먼저** 도는 줄은?」
 *
 * 정답이 흔들리지 않는 이유: `facts.first` 는 블록의 **직계 첫 statement** 이고, 그것이 조건이든
 * 아니든 **가장 먼저 닿는 것**은 그 줄이다. 안쪽 줄이 도느냐 마느냐는 다음 문제이고, 그 구분이
 * 오답 진단이 된다.
 *
 * 못 내면 `null` 이다 — 오답 셋을 못 채우거나 줄이 겹치면 안 낸다.
 */
export function buildFirstRun(input: FirstRunInput): ExecQuestion | null {
  const { facts, fn, at, window } = input;
  if (facts.first === null) return null;

  const answerLine = at(facts.first.start);
  const byLine = new Map<number, WrongBecause>();
  const put = (line: number, because: WrongBecause): void => {
    // 정답 줄과 겹치는 오답은 버린다 — 같은 줄을 짚고 틀렸다고 할 수는 없다.
    if (line !== answerLine && !byLine.has(line)) byLine.set(line, because);
  };

  // ① 정의 줄. 「정의는 실행이 아니다」는 초보가 가장 자주 걸리는 자리라 늘 후보로 둔다.
  put(at(fn.start), 'definition');
  // ② 첫 줄 뒤에도 반드시 도는 줄 — 도는 것은 맞지만 첫 번째가 아니다.
  for (const s of facts.unconditional) put(at(s.start), 'runs');
  // ③ 조건·반복에 걸린 줄 — 「돌 수도 있다」.
  for (const s of facts.conditional) put(at(s.start), 'conditional');
  // ④ 흐름이 끊긴 뒤. 안 도는 줄이라 오답 중에서도 가장 멀다.
  for (const s of facts.unreachable) put(at(s.start), 'runs');

  if (byLine.size < WRONG_N) return null;

  const picks: ExecPick[] = [...byLine.entries()]
    .slice(0, WRONG_N)
    .map(([line, because]) => ({ line, because }));
  picks.push({ line: answerLine, because: null });
  picks.sort((a, b) => a.line - b.line);

  const answer = picks.findIndex((p) => p.because === null);
  return { focus: answerLine, window, picks, answer };
}

/** 오답 이유 → 카탈로그 키. 문항 문구와 함께 로케일을 탄다 (D117). */
const WHY_KEY: Readonly<Record<WrongBecause, MessageKey>> = {
  definition: 'exec.whyDefinition',
  runs: 'exec.whyRuns',
  conditional: 'exec.whyConditional',
  nested: 'exec.whyNested',
};

export interface RenderedExec {
  q: string;
  hint: string;
  /** `picks` 와 같은 자리·같은 순서. 정답 자리는 `null` 이다 (`payload.why` 규약). */
  why: (string | null)[];
}

/**
 * 문항과 진단을 사람 말로. **카탈로그를 부르는 시점이 여기다** — 모듈이 열리는 시점은
 * 로케일이 정해지는 시점보다 이르다(`t0-point.ts` 의 `roleName` 과 같은 이유).
 */
export function renderFirstRun(question: ExecQuestion): RenderedExec {
  return {
    q: t('exec.orderQ'),
    hint: t('exec.orderHint'),
    why: question.picks.map((p) => (p.because === null ? null : t(WHY_KEY[p.because]))),
  };
}

/**
 * 추적 카드의 `site_id`. 원장에는 `NULL` 로 들어간다 — 대응하는 `concept_site` 행이 없다.
 * 합성(-1)과 다른 음수라 둘이 섞이지 않고, 진짜 사용처 id(자동 증가, 1부터)와도 안 겹친다.
 */
export const EXEC_SITE_ID = -2;

export interface ExecRequest extends Omit<T0Request, 'sites' | 'previewSiteId'> {
  /** 블록의 원문 줄. `n` 은 **파일 기준** 1-based 다. */
  lines: readonly FocusLine[];
  /** `block.ast_json`. 블록만 따로 파싱한 것이라 오프셋이 **블록 기준**이다. */
  ast: AstLite;
  grammar: string;
  path: string;
  /** 블록 범위 = 창 (D141). */
  window: LineWindow;
  /**
   * `block.text_hash`. 시드와 재생성 계약의 키다 — 줄이 밀려도 같은 카드가 다시 나와야
   * 하므로(D70) 줄 번호가 아니라 **내용 해시**라야 한다.
   */
  blockHash: string;
}

/** 짚을 줄 하나를 「들여쓰기를 뺀 코드 부분」으로. 들여쓰기까지 짚게 하면 빈칸을 짚는 셈이다. */
function spanOfLine(line: FocusLine, pick: number): Span | null {
  const from = line.t.length - line.t.trimStart().length;
  const to = line.t.trimEnd().length;
  return to > from ? { line: line.n, from, to, pick } : null;
}

/**
 * 실행 추적 카드 (D151). 사이트가 없으므로 **센티넬 사이트를 지어** 정상 경로를 그대로 쓴다 —
 * 합성 카드(D137)가 같은 방식이다. `commonPayload`·`finish` 를 재사용하니 시드·해시·사전 3층의
 * 계약이 전부 그대로 걸린다.
 *
 * 못 내면 사유를 낸다. **모르면 안 낸다** — 문법을 모르거나, 함수가 없거나, 오답 셋을 못 채우면
 * 카드를 만들지 않는다.
 */
export function makeExecCard(req: ExecRequest): GenResult {
  const d = dialectOf(req.grammar);
  if (d === null) return { reason: t('exec.noGrammar') };

  const fn = functionsIn(req.ast, d).find((f) => f.depth === 0)?.node;
  if (fn === undefined) return { reason: t('exec.noFunction') };
  const body = blockOf(fn, d);
  if (body === null) return { reason: t('exec.noFunction') };

  // 오프셋은 블록 기준이라 창의 첫 줄을 더해 파일 줄로 옮긴다.
  const rel = lineIndex(req.lines.map((l) => l.t).join('\n'));
  const at = (offset: number): number => req.window.from + rel(offset) - 1;

  const question = buildFirstRun({ facts: execFacts(body, d), fn, at, window: req.window });
  if (question === null) return { reason: t('exec.noTrace') };

  const byLine = new Map(req.lines.map((l) => [l.n, l]));
  const spans: Span[] = [];
  question.picks.forEach((p, i) => {
    const line = byLine.get(p.line);
    const span = line ? spanOfLine(line, i + 1) : null;
    if (span) spans.push(span);
  });
  // 짚을 자리를 하나라도 못 만들면 보기 번호가 어긋난다 — 그럴 바엔 안 낸다.
  if (spans.length !== question.picks.length) return { reason: t('exec.noTrace') };

  const site: ConceptSite = {
    id: EXEC_SITE_ID, repoId: req.repoId, fileId: 0,
    conceptId: req.concept.id as ConceptId, siteKey: req.blockHash,
    lineStart: question.focus, lineEnd: req.window.to, colStart: 0, colEnd: 0,
    tsNodeKind: null, form: null, shape: 'exec', occurrence: 0,
    excerpt: byLine.get(question.focus)?.t.trim() ?? '',
    picks: {}, hole: null, ctx: {}, lineConcepts: [], uncoveredRatio: 0,
    confidence: 'syntactic', parseQuality: 'ok', isDirty: false, isOversize: false,
    commitId: null, unknownCount: 0, isAlive: true, updatedAt: 0,
  };
  const input: SiteInput = { site, path: req.path, lines: req.lines, block: req.window };
  const full: T0Request = { ...req, sites: [input] };
  const r = new Renderer(buildVars(input, req.concept));
  const rendered = renderFirstRun(question);

  return {
    card: finish(full, input, 'point', {
      track: 't0',
      kind: 'point',
      ...commonPayload(full, input, r),
      lines: codeLines(req.lines, question.focus, spans, req.window),
      q: rendered.q,
      hint: rendered.hint,
      answer: question.answer,
      why: rendered.why.map((w) => (w === null ? null : { t: w })),
    }),
  };
}
