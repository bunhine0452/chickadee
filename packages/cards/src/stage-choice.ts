/**
 * 선택형 다섯 (D164) — 1단 `twin` · 2단 `origin` · 3단 `cut`·`reorder`·`contract`.
 *
 * 다섯이 한 payload 모양(`track: 't3'` 선택형)을 나눠 쓴다. 정답지는 전부 결정론이다 —
 * 사용처·이름 자리·가드 카탈로그·AST·HTTP 양끝. 오답마다 「그것이 참이 되는 조건」(정본 §3-2)이
 * 붙고, 그 문장은 개념마다 다르지 않으므로 사전이 아니라 i18n 카탈로그가 댄다 (`exec.*` 선례).
 *
 * **모르면 안 낸다.** 보기 넷을 못 채우거나 정답지가 흔들리면 사유를 남기고 카드를 안 만든다.
 */
import { t } from '@chickadee/i18n';
import type { AstLite, CardPayload, ConceptId } from '@chickadee/store-sql';

import { blockOf, dialectOf, functionsIn, lineIndex, statementsOf } from './exec-facts.js';
import { finishStage, hopOrder, pathFiles, shortNode, shuffled, stageSeed, viewOf } from './stage-common.js';
import type { StageBlock, StageCard, StageDrop, StageFile, StageRequest, StageSite } from './stage-types.js';
import type { FocusLine } from './types.js';

type Choice = Extract<CardPayload, { track: 't3'; kind: 'twin' | 'origin' | 'cut' | 'reorder' | 'contract' }>;
type Option = Choice['options'][number];

const OPTIONS = 4;

/** 상한 — 한 챕터의 한 단에 같은 유형이 너무 많으면 챕터가 외우기가 된다. */
export const MAX_TWIN = 3;
export const MAX_ORIGIN = 2;
export const MAX_CUT = 3;
export const MAX_REORDER = 2;
export const MAX_CONTRACT = 2;

// ───────── 1단 · 쌍둥이 ─────────

const optOf = (path: string, line: number, text: string): Option =>
  ({ t: `${shortNode(path, line)}  ${text.trim()}`, mono: true, f: path, l: line });

/**
 * 「같은 일을 하는 줄이 어디 또 있나」. 정답 = 같은 개념의 다른 사용처 하나, 함정 셋 = 다른
 * 개념의 사용처. `exercises.md` 는 「상위 3 + 함정 1」이라 적었지만 그러면 정답이 셋이라 보기별
 * 진단을 붙일 자리가 없다(04 §1 이 answerSet 을 버린 이유). 정답 하나 · 함정 셋으로 낸다.
 */
export function buildTwins(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const sites = (req.sites ?? []).filter((s) => req.files.has(s.path));
  const order = hopOrder(req.paths);
  const onPath = sites.filter((s) => order.has(s.path))
    .sort((a, b) => (order.get(a.path) ?? 0) - (order.get(b.path) ?? 0)
      || a.path.localeCompare(b.path) || a.site.lineStart - b.site.lineStart);
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  const used = new Set<string>();

  for (const focus of onPath) {
    if (cards.length >= MAX_TWIN) break;
    if (used.has(focus.site.conceptId)) continue;
    const twins = sites.filter((s) => s.site.conceptId === focus.site.conceptId
      && s.site.id !== focus.site.id
      && !(s.path === focus.path && s.site.lineStart === focus.site.lineStart));
    if (twins.length === 0) { drops.push({ type: 'twin', reason: t('stage.twinNoOther') }); continue; }
    // 다른 파일의 쌍둥이를 먼저 — 「어휘는 파일을 가로지른다」가 이 문항의 뜻이다.
    const twin = [...twins].sort((a, b) => Number(a.path === focus.path) - Number(b.path === focus.path)
      || a.path.localeCompare(b.path) || a.site.lineStart - b.site.lineStart)[0] as StageSite;
    const traps = pickTraps(sites, focus, twin);
    if (traps.length < OPTIONS - 1) { drops.push({ type: 'twin', reason: t('stage.twinFewTraps') }); continue; }

    const raw: Option[] = [optOf(twin.path, twin.site.lineStart, twin.site.excerpt),
      ...traps.map((s) => optOf(s.path, s.site.lineStart, s.site.excerpt))];
    const whys: (null | { t: string })[] = [null, ...traps.map((s) => ({
      t: t('stage.twinWhy', { concept: req.concepts.get(s.site.conceptId)?.name.ko ?? s.site.conceptId }),
    }))];
    const seed = stageSeed(req, 'twin', focus.site.siteKey);
    const mixed = shuffled(raw.map((o, i) => ({ o, w: whys[i] ?? null })), 0, seed);
    const file = req.files.get(focus.path) as StageFile;
    const view = viewOf(file, focus.site.lineStart);
    cards.push(finishStage({
      req, type: 'twin', key: focus.site.siteKey,
      conceptId: focus.site.conceptId as ConceptId, fileId: file.fileId, siteId: focus.site.id,
      payload: {
        track: 't3', kind: 'twin', stage: 1, file: focus.path, focus: focus.site.lineStart,
        lines: view.lines, promptLines: view.promptLines,
        q: t('stage.twinQ', { focus: String(focus.site.lineStart) }),
        hint: t('stage.twinHint'),
        options: mixed.items.map((x) => x.o), answer: mixed.answer,
        why: mixed.items.map((x) => x.w),
        ok: t('stage.twinOk'), rule: t('stage.twinRule'),
      },
    }));
    used.add(focus.site.conceptId);
  }
  return { cards, drops };
}

/** 함정 — 다른 개념의 사용처, 정답과 같은 파일을 먼저(모양이 닮은 것이 함정이다), 개념은 서로 다르게. */
function pickTraps(sites: readonly StageSite[], focus: StageSite, twin: StageSite): StageSite[] {
  const out: StageSite[] = [];
  const seen = new Set<string>();
  const pool = sites.filter((s) => s.site.conceptId !== focus.site.conceptId)
    .sort((a, b) => Number(b.path === twin.path) - Number(a.path === twin.path)
      || a.path.localeCompare(b.path) || a.site.lineStart - b.site.lineStart);
  for (const s of pool) {
    const key = `${s.path}:${s.site.lineStart}`;
    if (seen.has(s.site.conceptId) || seen.has(key)) continue;
    seen.add(s.site.conceptId);
    seen.add(key);
    out.push(s);
    if (out.length === OPTIONS - 1) break;
  }
  return out;
}

// ───────── 2단 · 처음 정해지는 자리 ─────────

/**
 * 「이 값은 어디서 처음 정해지나」. 정답 = 요청 순서에서 가장 앞선 `define`. 오답은 읽는 자리·
 * 옮겨 싣는 자리·다른 경로의 자리이고, 문항의 초점은 화면 쪽에서 그 이름을 읽는 첫 줄이다 —
 * 「`authService.js:36` 의 `role` 은 어디서 정해지나」의 모양이다.
 */
export function buildOrigins(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  const order = hopOrder(req.paths);
  const at = (path: string): number => order.get(path) ?? Number.MAX_SAFE_INTEGER;
  const byName = new Map<string, typeof uses>();
  const uses = (req.names ?? []).filter((u) => req.files.has(u.path));
  for (const u of uses) byName.set(u.name, [...(byName.get(u.name) ?? []), u]);

  for (const [name, group] of [...byName.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (cards.length >= MAX_ORIGIN) break;
    const defines = group.filter((u) => u.role === 'define' && order.has(u.path))
      .sort((a, b) => at(a.path) - at(b.path) || a.line - b.line);
    // 정해지는 자리는 요청 순서에서 **마지막** 층 쪽이 아니라 가장 먼저 만나는 define 이다.
    const define = defines[0];
    if (define === undefined) { drops.push({ type: 'origin', reason: t('stage.originNoDefine', { name }) }); continue; }
    const reads = group.filter((u) => u !== define)
      .sort((a, b) => at(a.path) - at(b.path) || a.line - b.line);
    // 초점은 화면 쪽에서 읽는 첫 줄 — 없으면 define 자체가 초점이다.
    const anchor = reads.find((u) => u.role === 'read' && order.has(u.path)) ?? define;
    const others = reads.filter((u) => u !== anchor).slice(0, OPTIONS - 1);
    if (others.length < OPTIONS - 1) { drops.push({ type: 'origin', reason: t('stage.originFewOptions') }); continue; }

    const raw: Option[] = [optOf(define.path, define.line, define.text), ...others.map((u) => optOf(u.path, u.line, u.text))];
    const whys: (null | { t: string })[] = [null, ...others.map((u) => ({
      t: !order.has(u.path) ? t('stage.originOtherPath')
        : u.role === 'carry' ? t('stage.originCarries', { name }) : t('stage.originReads', { name }),
    }))];
    const key = `${name}@${define.path}:${define.line}`;
    const mixed = shuffled(raw.map((o, i) => ({ o, w: whys[i] ?? null })), 0, stageSeed(req, 'origin', key));
    const file = req.files.get(anchor.path) as StageFile;
    const view = viewOf(file, anchor.line);
    cards.push(finishStage({
      req, type: 'origin', key, fileId: file.fileId,
      payload: {
        track: 't3', kind: 'origin', stage: 2, file: anchor.path, focus: anchor.line,
        lines: view.lines, promptLines: view.promptLines,
        q: t('stage.originQ', { name }), hint: t('stage.originHint'),
        options: mixed.items.map((x) => x.o), answer: mixed.answer, why: mixed.items.map((x) => x.w),
        ok: t('stage.originOk'), rule: t('stage.originRule'),
      },
    }));
  }
  return { cards, drops };
}

// ───────── 3단 · 지우면 (가드 카탈로그) ─────────

type GuardKind = 'soft' | 'throw' | 'null' | 'orElse';

interface Guard {
  kind: GuardKind;
  file: StageFile;
  line: FocusLine;
  /** 「막던 입력」 문장. 오답 진단이 쓴다. */
  blocked: string;
  /** 정답 해설. */
  ok: string;
}

const OPT_KEY: Readonly<Record<GuardKind, 'stage.cutOptSoft' | 'stage.cutOptThrow' | 'stage.cutOptNull' | 'stage.cutOptOrElse'>> = {
  soft: 'stage.cutOptSoft', throw: 'stage.cutOptThrow', null: 'stage.cutOptNull', orElse: 'stage.cutOptOrElse',
};

const SOFT_NULL = /\bAND\s+([A-Za-z_][A-Za-z0-9_.]*)\s+IS\s+NULL\b/i;
const NULL_GUARD = /\bif\s*\(\s*([A-Za-z_$][\w$.]*)\s*(?:!==?|<>)\s*(?:null|None)\s*(?:&&|and)\b/;
const THROW_GUARD = /^\s*if\s*\((.+)\)\s*\{?\s*(?:throw|raise|return)\b/;
const OR_ELSE = /\.orElseThrow\(/;

/**
 * 가드 카탈로그 넷 (`exercises.md` §2). 사전이 아니라 여기 두는 이유는 실행 추적이 `WrongBecause`
 * 넷을 카탈로그에 둔 것과 같다 — 「soft delete 가드를 지우면 지운 행이 살아난다」는 개념마다
 * 다르지 않고 언어에도 안 매인다. 글자 모양으로 잡는다(정규식) — 가드는 관용구라 모양이 곧 뜻이다.
 */
export function findGuards(files: readonly StageFile[]): Guard[] {
  const out: Guard[] = [];
  for (const file of files) {
    const text = file.lines.map((l) => l.t);
    for (let i = 0; i < file.lines.length; i += 1) {
      const line = file.lines[i] as FocusLine;
      const soft = SOFT_NULL.exec(line.t);
      if (soft !== null) {
        const col = (soft[1] as string).replace(/^[A-Za-z_]+\./, '');
        // 같은 파일에 그 열에 시각을 넣는 갱신이 있어야 soft delete 다 — 없으면 그냥 조건이다.
        const setAt = file.lines.find((l) => new RegExp(`SET\\s+${col}\\s*=\\s*(NOW\\(\\)|CURRENT_TIMESTAMP|SYSDATE|datetime\\()`, 'i').test(l.t));
        if (setAt !== undefined) {
          out.push({
            kind: 'soft', file, line, blocked: t('stage.cutBlockedSoft', { col }),
            ok: t('stage.cutSoftOk', { line: String(setAt.n), col }),
          });
          continue;
        }
      }
      const nul = NULL_GUARD.exec(line.t);
      if (nul !== null) {
        const name = nul[1] as string;
        out.push({ kind: 'null', file, line, blocked: t('stage.cutBlockedNull', { name }), ok: t('stage.cutNullOk', { name }) });
        continue;
      }
      if (OR_ELSE.test(line.t)) {
        out.push({ kind: 'orElse', file, line, blocked: t('stage.cutBlockedOrElse'), ok: t('stage.cutOrElseOk') });
        continue;
      }
      const thr = THROW_GUARD.exec(line.t) ?? throwOnNext(line.t, text[i + 1]);
      if (thr !== null) {
        const cond = (thr[1] as string).trim();
        out.push({ kind: 'throw', file, line, blocked: t('stage.cutBlockedThrow', { cond }), ok: t('stage.cutThrowOk', { cond }) });
      }
    }
  }
  return out;
}

/** `if (...)` 다음 줄이 `throw` 로 시작하면 그 둘이 한 가드다. */
function throwOnNext(line: string, next: string | undefined): RegExpExecArray | null {
  if (next === undefined || !/^\s*(throw|raise)\b/.test(next)) return null;
  return /^\s*if\s*\((.+)\)\s*\{?\s*$/.exec(line);
}

export function buildCuts(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  const guards = findGuards(pathFiles(req));
  if (guards.length === 0) return { cards, drops: [{ type: 'cut', reason: t('stage.cutNoGuard') }] };
  const kinds = [...new Set(guards.map((g) => g.kind))];
  const seenKind = new Set<GuardKind>();

  for (const g of guards) {
    if (cards.length >= MAX_CUT) break;
    if (seenKind.has(g.kind)) continue;
    seenKind.add(g.kind);
    // 넷째 보기는 **다른** 가드의 결과다. 카탈로그에 하나뿐인 리포면 목록에서 다음 것을 빌린다.
    const other = (kinds.find((k) => k !== g.kind) ?? (['soft', 'throw', 'null', 'orElse'] as const).find((k) => k !== g.kind)) as GuardKind;
    const raw: Option[] = [
      { t: t(OPT_KEY[g.kind]) },
      { t: t('stage.cutNothing') },
      { t: t('stage.cutCompile') },
      { t: t(OPT_KEY[other]) },
    ];
    const whys: (null | { t: string })[] = [
      null,
      { t: t('stage.cutNothingWhy', { blocked: g.blocked }) },
      { t: t('stage.cutCompileWhy') },
      { t: t('stage.cutOtherGuardWhy', { blocked: g.blocked }) },
    ];
    const key = `${g.file.path}#${g.line.t.trim()}`;
    const mixed = shuffled(raw.map((o, i) => ({ o, w: whys[i] ?? null })), 0, stageSeed(req, 'cut', key));
    const view = viewOf(g.file, g.line.n);
    cards.push(finishStage({
      req, type: 'cut', key, fileId: g.file.fileId,
      payload: {
        track: 't3', kind: 'cut', stage: 3, file: g.file.path, focus: g.line.n,
        lines: view.lines, promptLines: view.promptLines,
        q: t('stage.cutQ', { focus: String(g.line.n) }), hint: t('stage.cutHint'),
        options: mixed.items.map((x) => x.o), answer: mixed.answer, why: mixed.items.map((x) => x.w),
        ok: g.ok, rule: t('stage.cutRule'),
      },
    }));
  }
  return { cards, drops };
}

// ───────── 3단 · 뒤집으면 (AST 선언–사용) ─────────

type Swap = 'breaks' | 'stale' | 'same';

interface Pair {
  a: number;
  b: number;
  what: Swap;
  name: string;
}

const isIdent = (n: AstLite): boolean => n.text !== undefined && /identifier$/.test(n.kind);

function leaves(n: AstLite, out: string[] = []): string[] {
  if (isIdent(n)) out.push(n.text as string);
  for (const c of n.children) leaves(c, out);
  return out;
}

const DECL = /(lexical|variable|local_variable|const|let)_declaration$|^variable_declarator$|^assignment$/;
const ASSIGN = /^(assignment|augmented_assignment)(_expression)?$/;
const MUTATOR = /^(push|add|set|put|append|remove|delete|clear|splice|pop|shift|unshift|sort|reverse|fill|extend|insert|update)$/;

/** 이 statement 가 **만드는** 이름 — 선언자의 첫 식별자. */
function declares(stmt: AstLite): string | null {
  const walk = (n: AstLite): string | null => {
    if (DECL.test(n.kind)) {
      const first = n.children.find(isIdent) ?? n.children.map((c) => c.children.find(isIdent)).find((c) => c !== undefined);
      if (first !== undefined) return first.text as string;
    }
    for (const c of n.children) {
      const got = walk(c);
      if (got !== null) return got;
    }
    return null;
  };
  return walk(stmt);
}

/** 이 statement 가 **바꾸는** 이름 — 재대입의 왼쪽, 또는 `x.push(...)` 류의 수신자. */
function mutates(stmt: AstLite): string | null {
  const walk = (n: AstLite): string | null => {
    if (ASSIGN.test(n.kind)) {
      const first = n.children.find(isIdent);
      if (first !== undefined) return first.text as string;
    }
    const ids = n.children.filter(isIdent);
    // `x.push(` — 수신자 식별자 뒤에 곧바로 변경 메서드 이름이 온다.
    for (let i = 0; i + 1 < ids.length; i += 1) {
      if (MUTATOR.test(ids[i + 1]?.text ?? '') && /call/.test(n.kind)) return ids[i]?.text ?? null;
    }
    for (const c of n.children) {
      const got = walk(c);
      if (got !== null) return got;
    }
    return null;
  };
  return walk(stmt);
}

/**
 * 이웃 statement 쌍의 관계 — 블록 기준 바이트 오프셋으로 돌려준다. 줄 번호는 부르는 쪽이
 * 원문으로 옮긴다(`lineIndex`). 조건·반복·중첩 함수는 건너뛴다 — 「뒤집으면」의 뜻이 흐려진다.
 */
export function swapPairs(block: StageBlock): Pair[] | null {
  if (block.ast === null) return null;
  const d = dialectOf(block.grammar);
  if (d === null) return null;
  const fn = functionsIn(block.ast, d).find((f) => f.depth === 0)?.node ?? block.ast;
  const body = blockOf(fn, d) ?? (d.block.has(block.ast.kind) ? block.ast : null);
  if (body === null) return null;
  const stmts = statementsOf(body).filter((s) => !d.fn.has(s.kind));
  const pairs: Pair[] = [];
  for (let i = 0; i + 1 < stmts.length; i += 1) {
    const s1 = stmts[i] as AstLite;
    const s2 = stmts[i + 1] as AstLite;
    // 둘 중 하나라도 조건·반복이면 「뒤집으면」의 뜻이 흐려진다 — 안 낸다.
    if (d.branching.has(s1.kind) || d.branching.has(s2.kind) || d.terminator.has(s1.kind)) continue;
    const uses2 = new Set(leaves(s2));
    const made = declares(s1);
    if (made !== null && uses2.has(made)) { pairs.push({ a: s1.start, b: s2.start, what: 'breaks', name: made }); continue; }
    const changed = mutates(s1);
    if (changed !== null && uses2.has(changed) && declares(s2) !== changed) {
      pairs.push({ a: s1.start, b: s2.start, what: 'stale', name: changed });
      continue;
    }
    const uses1 = new Set(leaves(s1));
    const shared = [...uses2].filter((n) => uses1.has(n));
    if (shared.length === 0) pairs.push({ a: s1.start, b: s2.start, what: 'same', name: [...uses2][0] ?? '' });
  }
  return pairs;
}

export function buildReorders(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  const order = hopOrder(req.paths);
  const blocks = (req.blocks ?? []).filter((b) => order.has(b.path))
    .sort((a, b) => (order.get(a.path) ?? 0) - (order.get(b.path) ?? 0) || a.window.from - b.window.from);
  const seenWhat = new Set<Swap>();

  for (const block of blocks) {
    if (cards.length >= MAX_REORDER) break;
    const file = req.files.get(block.path);
    if (file === undefined) continue;
    const pairs = swapPairs(block);
    if (pairs === null) continue;
    const text = file.lines.filter((l) => l.n >= block.window.from && l.n <= block.window.to).map((l) => l.t).join('\n');
    const rel = lineIndex(text);
    const at = (offset: number): number => block.window.from + rel(offset) - 1;
    // 「깨진다」를 먼저, 다음에 「옛 값」, 「안 달라진다」는 앞의 둘이 없을 때만 — 늘 깨진다고 답하는
    // 학습자를 잡으려면 셋이 섞여야 하지만, 한 챕터 안에서는 종류가 겹치지 않게만 한다.
    const wanted: Swap[] = ['breaks', 'stale', 'same'];
    for (const what of wanted) {
      if (cards.length >= MAX_REORDER || seenWhat.has(what)) continue;
      const pair = pairs.find((p) => p.what === what);
      if (pair === undefined) continue;
      const a = at(pair.a);
      const b = at(pair.b);
      if (a === b) continue;
      const name = pair.name;
      const raw: Option[] = [
        { t: t('stage.reorderBreaks', { name }) },
        { t: t('stage.reorderStale', { name }) },
        { t: t('stage.reorderSame') },
        { t: t('stage.reorderNeither') },
      ];
      const answerAt = what === 'breaks' ? 0 : what === 'stale' ? 1 : 2;
      const vars = { a: String(a), b: String(b), name };
      const whys: (null | { t: string })[] = [
        answerAt === 0 ? null : { t: what === 'same' ? t('stage.reorderSameWhy') : t('stage.reorderStaleWhy', vars) },
        answerAt === 1 ? null : { t: what === 'same' ? t('stage.reorderSameWhy') : t('stage.reorderBreaksWhy', vars) },
        answerAt === 2 ? null : { t: what === 'breaks' ? t('stage.reorderBreaksWhy', vars) : t('stage.reorderStaleWhy', vars) },
        { t: t('stage.reorderNeitherWhy') },
      ];
      const key = `${block.hash}#${pair.a}-${pair.b}`;
      const mixed = shuffled(raw.map((o, i) => ({ o, w: whys[i] ?? null })), answerAt, stageSeed(req, 'reorder', key));
      const view = viewOf(file, a, [], { from: Math.min(a, b) - 1, to: Math.max(a, b) + 1 });
      cards.push(finishStage({
        req, type: 'reorder', key, fileId: file.fileId,
        payload: {
          track: 't3', kind: 'reorder', stage: 3, file: block.path, focus: a,
          lines: view.lines, promptLines: view.promptLines,
          q: t('stage.reorderQ', { a: String(a), b: String(b) }), hint: t('stage.reorderHint'),
          options: mixed.items.map((x) => x.o), answer: mixed.answer, why: mixed.items.map((x) => x.w),
          ok: t('stage.reorderOk'), rule: t('stage.reorderRule'),
        },
      }));
      seenWhat.add(what);
    }
  }
  if (cards.length === 0) drops.push({ type: 'reorder', reason: t('stage.reorderNoPair') });
  return { cards, drops };
}

// ───────── 3단 · 응답 계약 ─────────

/**
 * 「응답에서 이 이름을 빼면 화면 쪽 어디가 먼저 깨지나」. 정답 = 그 이름을 읽는 첫 자리(요청
 * 순서, 같은 파일이면 앞 줄). 함정 = 같은 이름의 뒤 자리 · 다른 이름을 읽는 자리 · 만드는 자리.
 * 둘째 물음(이유 4지)은 고정이다 — 「JSON 이라 컴파일러가 안 잡는다」가 이 유형이 가르치는 것이다.
 */
export function buildContracts(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  const order = hopOrder(req.paths);
  const at = (path: string): number => order.get(path) ?? Number.MAX_SAFE_INTEGER;
  const keys = [...(req.responseKeys ?? [])].filter((k) => k.reads.length > 0 && req.files.has(k.maker.path))
    .sort((a, b) => b.reads.length - a.reads.length || a.key.localeCompare(b.key));
  if (keys.length === 0) return { cards, drops: [{ type: 'contract', reason: t('stage.contractNoKey') }] };

  for (const k of keys) {
    if (cards.length >= MAX_CONTRACT) break;
    const reads = [...k.reads].sort((a, b) => at(a.path) - at(b.path) || a.path.localeCompare(b.path) || a.line - b.line);
    const first = reads[0];
    if (first === undefined) continue;
    const later = reads.slice(1);
    const otherKeys = keys.filter((o) => o !== k).flatMap((o) => o.reads.map((r) => ({ ...r, key: o.key })))
      .filter((r) => !(r.path === first.path && r.line === first.line));
    const raw: Option[] = [optOf(first.path, first.line, first.text)];
    const whys: (null | { t: string })[] = [null];
    for (const r of later) {
      if (raw.length >= OPTIONS) break;
      raw.push(optOf(r.path, r.line, r.text));
      whys.push({ t: t('stage.contractLaterWhy', { key: k.key }) });
    }
    for (const r of otherKeys) {
      if (raw.length >= OPTIONS) break;
      raw.push(optOf(r.path, r.line, r.text));
      whys.push({ t: t('stage.contractOtherKeyWhy', { other: r.key, key: k.key }) });
    }
    if (raw.length < OPTIONS) {
      raw.push(optOf(k.maker.path, k.maker.line, k.maker.text));
      whys.push({ t: t('stage.contractMakerWhy', { key: k.key }) });
    }
    if (raw.length < OPTIONS) { drops.push({ type: 'contract', reason: t('stage.originFewOptions') }); continue; }

    const key = `${k.key}@${k.maker.path}:${k.maker.line}`;
    const seed = stageSeed(req, 'contract', key);
    const mixed = shuffled(raw.map((o, i) => ({ o, w: whys[i] ?? null })), 0, seed);
    const reasonRaw = [
      { t: t('stage.contractReasonJson'), w: null },
      { t: t('stage.contractReasonType'), w: { t: t('stage.contractReasonTypeWhy') } },
      { t: t('stage.contractReasonServer'), w: { t: t('stage.contractReasonServerWhy') } },
      { t: t('stage.contractReasonCache'), w: { t: t('stage.contractReasonCacheWhy') } },
    ];
    const reason = shuffled(reasonRaw, 0, seed + 1);
    const file = req.files.get(first.path) ?? (req.files.get(k.maker.path) as StageFile);
    const view = viewOf(file, first.line);
    cards.push(finishStage({
      req, type: 'contract', key, fileId: file.fileId,
      payload: {
        track: 't3', kind: 'contract', stage: 3, file: first.path, focus: first.line,
        lines: view.lines, promptLines: view.promptLines,
        q: t('stage.contractQ', { key: k.key }), hint: t('stage.contractHint'),
        options: mixed.items.map((x) => x.o), answer: mixed.answer, why: mixed.items.map((x) => x.w),
        ok: t('stage.contractOk'), rule: t('stage.contractRule'),
        reason: {
          q: t('stage.contractReasonQ'),
          options: reason.items.map((x) => ({ t: x.t })), answer: reason.answer,
          why: reason.items.map((x) => x.w),
        },
      },
    }));
  }
  return { cards, drops };
}

/** 1단의 재료 — 경로 위 사용처의 개념, 요청 순서 → 줄 순서. 판은 예전 T0 카드가 댄다 (D164 ③). */
export function conceptsOnPath(req: StageRequest): ConceptId[] {
  const order = hopOrder(req.paths);
  const out: ConceptId[] = [];
  const sites = (req.sites ?? []).filter((s) => order.has(s.path))
    .sort((a, b) => (order.get(a.path) ?? 0) - (order.get(b.path) ?? 0) || a.site.lineStart - b.site.lineStart);
  for (const s of sites) if (!out.includes(s.site.conceptId)) out.push(s.site.conceptId);
  return out;
}

