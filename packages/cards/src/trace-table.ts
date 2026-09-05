/**
 * `trace-table` — **시간 × 열** 격자 (D187 ⑱ · `docs/program/fundamentals.md` §13).
 *
 * ## 왜 2단인가
 *
 * `pedagogy.md` §1.2 가 잰 어긋남 하나다 — 연구의 tracing(Lister 2004 · Lopez 2008 ·
 * Venables 2009)은 **값과 상태를 손으로 굴리는 것**인데 앱의 2단 넷(`exec`·`hop`·`origin`·
 * `caller`)은 전부 **경로**다. 값을 굴리는 판이 하나도 없었다. 이 파일이 그 자리를 채운다.
 *
 * ## 실행이 필요 없다 — 묻는 것이 값이 아니라 **어느 상자인가**라서
 *
 * `java-learning.md` §12.5 가 로그인 챕터에서 그 자리를 찾아 두었다.
 * `AuthService.login` 의 `:87` 이 DB 를 고치고 `:90` 이 **같은 이름을 다른 상자에** 묶는다.
 * 열을 「`user` 가 가리키는 상자」·「`role` 이 있나」·「`token` 이 있나」로 잡으면 **모든 칸이
 * 코드에서 결정된다.** DB 의 실제 수(`coin`)는 못 묻는다 — 그것은 러너와 데이터의 일이다.
 *
 * ## 상자 라벨은 글자가 아니라 **분할**이다
 *
 * 학습자가 A·B 로 쓰든 1·2 로 쓰든 「같은 상자끼리 같은 이름」이면 맞다. 그래서 칸마다
 * `carry` 를 싣는다 — 값이 안 바뀐 칸은 **앞 칸의 답**이 기댓값이다. `step` 형식의 이월
 * 채점(`fundamentals.md` §4)을 격자에 그대로 옮긴 것이고, 첫 칸 하나를 다르게 부른 사람이
 * 판 전체를 잃지 않게 한다.
 *
 * ## 예측 모드 — 바뀐 칸만 가린다
 *
 * 그림의 I2 규칙(구조는 남고 값이 사라진다)과 같다. `hidden` 은 **값이 바뀌는 칸**
 * (`carry === null`)뿐이고 나머지는 채워진 채로 남아 **예측의 재료**가 된다.
 *
 * 재료 둘 — 챕터의 블록(여기 `buildTraces`)과 0부 카탈로그의 `FoldStep` 사다리
 * (`buildLadderTrace`, 순수 함수). 앞은 「같은 이름, 다른 상자」를, 뒤는 「식이 접히는 걸음」을
 * 시간축으로 쓴다.
 */
import { t } from '@chickadee/i18n';
import type { CardPayload, TraceCell } from '@chickadee/store-sql';

import { buildValueItems, FUND_DIALECTS, type FundLang } from './fundamentals.js';
import { codeLines, promptLines } from './lines.js';
import { finishStage, hopOrder } from './stage-common.js';
import type { StageBlock, StageCard, StageDrop, StageFile, StageRequest } from './stage-types.js';
import { baseName } from './vars.js';

type TracePayload = Extract<CardPayload, { kind: 'trace' }>;

/** 격자의 상한. 720 폭에서 이름 열 + 다섯 열이 가로 스크롤 없이 선다 (05 §9). */
export const MAX_TRACE_COLS = 5;
/** 한 판의 시간 칸. 8 을 넘으면 한 판이 2분을 넘는다. */
export const MAX_TRACE_ROWS = 8;
/** 한 챕터가 내는 값 추적 판. 2단은 경로 판이 이미 넷이라 한 장이면 충분하다. */
export const MAX_TRACE = 1;
/** 상자 이름 — 화면과 채점기가 같은 글자를 쓴다. 학습자는 아무 글자나 써도 된다(분할 일치). */
export const BOX_LABELS = ['A', 'B', 'C', 'D'] as const;

// ───────── 글자로만 보는 선언·대입 (stage-common 과 같은 규칙) ─────────

/** `const x = ` · `let x: T = ` · `var x = ` · `val x = `. 타입 주석은 건너뛴다. */
const KEYWORD_DECL = /^\s*(?:export\s+)?(?:const|let|var|val)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=(?!=)/u;
/** `User user = ` · `String role = ` — 타입이 앞에 오는 C 계열. 타입은 대문자로 시작한다. */
const TYPED_DECL = /^\s*(?:final\s+)?[A-Z][\w$]*(?:<[^>]*>)?(?:\[\])?\s+([a-z_$][\w$]*)\s*=(?!=)/u;
/** `user = ` — 앞에 아무 것도 없는 대입. 파이썬의 첫 대입이 곧 선언이다. */
const BARE_ASSIGN = /^\s*([A-Za-z_$][\w$]*)\s*=(?!=)/u;
const IDENT = /[A-Za-z_$][\w$]*/gu;

/** 이 줄이 만드는(또는 다시 묶는) 이름. 없으면 `null`. */
export function boundName(text: string): string | null {
  return KEYWORD_DECL.exec(text)?.[1] ?? TYPED_DECL.exec(text)?.[1] ?? BARE_ASSIGN.exec(text)?.[1] ?? null;
}

const readsName = (text: string, name: string): boolean =>
  [...text.matchAll(IDENT)].some((m) => m[0] === name);

interface Bind { line: number; kind: 'decl' | 'assign' }

/** 한 이름의 묶임과 읽힘. 창 안 줄만 본다. */
interface Name {
  name: string;
  binds: Bind[];
  reads: number[];
}

/** 창 안의 이름 표. 먼저 나온 순서를 지킨다 — 열의 순서가 곧 코드의 순서다. */
export function scanNames(lines: readonly { n: number; t: string }[]): Name[] {
  const out: Name[] = [];
  const at = new Map<string, Name>();
  for (const line of lines) {
    const bound = boundName(line.t);
    if (bound !== null) {
      let entry = at.get(bound);
      if (entry === undefined) {
        entry = { name: bound, binds: [], reads: [] };
        at.set(bound, entry);
        out.push(entry);
      }
      entry.binds.push({ line: line.n, kind: entry.binds.length === 0 ? 'decl' : 'assign' });
    }
    // 묶는 줄도 **다른 이름은 읽는다** — `String token = f(user, role);` 이 그 자리다.
    // 묶이는 이름 자신은 안 센다(그 줄은 이미 묶임으로 들어갔다).
    for (const entry of out) {
      if (entry.name !== bound && readsName(line.t, entry.name)) entry.reads.push(line.n);
    }
  }
  return out;
}

/**
 * 이 창에서 격자를 세울 수 있나. 조건 하나 — **같은 이름에 두 번 대입하는 자리**가 있어야
 * 한다. 없으면 상자가 안 바뀌고, 상자가 안 바뀌면 이 형식이 가르칠 것이 없다.
 */
function pickColumns(names: readonly Name[]): { obj: Name[]; vars: Name[] } | null {
  const obj = names.filter((n) => n.binds.length >= 2).slice(0, 2);
  if (obj.length === 0) return null;
  const firstObjLine = obj[0]?.binds[0]?.line ?? 0;
  const vars = names
    .filter((n) => !obj.includes(n) && n.binds.length === 1 && n.reads.length > 0
      && (n.binds[0]?.line ?? 0) > firstObjLine)
    .slice(0, Math.max(0, MAX_TRACE_COLS - obj.length));
  return { obj, vars };
}

/**
 * 시간 칸을 고른다 — **묶는 줄 전부** + 각 묶임의 직전·직후 읽기 + 상자 열의 마지막 읽기.
 * 직전 읽기가 이 형식의 요점이다: `:87` 이 없으면 「DB 가 바뀌어도 상자는 안 바뀐다」를 못 묻는다.
 */
export function pickRows(cols: readonly Name[]): number[] {
  const binds = cols.flatMap((c) => c.binds.map((b) => b.line));
  const reads = [...new Set(cols.flatMap((c) => c.reads))].sort((a, b) => a - b);
  const keep = new Set(binds);
  for (const line of binds) {
    const before = [...reads].reverse().find((r) => r < line);
    const after = reads.find((r) => r > line);
    if (before !== undefined) keep.add(before);
    if (after !== undefined) keep.add(after);
  }
  const last = cols[0]?.reads[(cols[0]?.reads.length ?? 1) - 1];
  if (last !== undefined) keep.add(last);
  const all = [...keep].sort((a, b) => a - b);
  if (all.length <= MAX_TRACE_ROWS) return all;
  // 넘치면 **읽기 줄**부터 가운데에서 뺀다 — 묶는 줄은 격자의 뼈다.
  const bindSet = new Set(binds);
  const optional = all.filter((n) => !bindSet.has(n));
  const drop = new Set(optional.slice(1, 1 + (all.length - MAX_TRACE_ROWS)));
  return all.filter((n) => !drop.has(n));
}

/** 상자 열의 칸 — 선언 앞은 「없음」, 그 뒤는 대입마다 다음 라벨. */
function boxCells(col: Name, rows: readonly number[]): TraceCell[] {
  const none = t('chapter.traceNone');
  return rows.map((line) => {
    const seen = col.binds.filter((b) => b.line <= line).length;
    if (seen === 0) return { t: 'none', accept: [none, '-', '—', 'x'] };
    const label = BOX_LABELS[Math.min(seen, BOX_LABELS.length) - 1] as string;
    return { t: 'box', label, accept: [label] };
  });
}

/** 있나 열의 칸 — 선언 앞은 거짓, 그 뒤는 참. 코드만 보고 정해지는 유일한 값이다. */
function hasCells(col: Name, rows: readonly number[]): TraceCell[] {
  const decl = col.binds[0]?.line ?? 0;
  return rows.map((line) => ({ t: 'bool', v: line >= decl }));
}

const sameCell = (a: TraceCell, b: TraceCell): boolean => JSON.stringify(a) === JSON.stringify(b);

/** 열 하나를 칸 배열로 접는다 — `carry` 는 값이 안 바뀐 칸이 가리키는 앞 칸이다. */
function foldColumn(
  colKey: string, rows: readonly string[], values: readonly TraceCell[],
): { cells: TracePayload['cells']; hidden: string[] } {
  const cells: TracePayload['cells'] = [];
  const hidden: string[] = [];
  values.forEach((v, i) => {
    const prev = values[i - 1];
    const rowKey = rows[i] as string;
    const carry = prev !== undefined && sameCell(prev, v) ? (rows[i - 1] as string) : null;
    cells.push({ r: rowKey, c: colKey, v, carry });
    if (carry === null) hidden.push(`${rowKey}|${colKey}`);
  });
  return { cells, hidden };
}

/**
 * 챕터의 값 추적 판. 요청 줄기 위의 블록을 앞에서부터 보고 **처음으로 격자가 서는 블록**
 * 하나만 굽는다. 안 서면 사유를 남긴다 — 판을 숨기지 않는 것이 D186 ④ 다.
 */
export function buildTraces(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  const order = hopOrder(req.paths);
  const blocks = (req.blocks ?? [])
    .filter((b) => order.has(b.path))
    .sort((a, b) => (order.get(a.path) ?? 0) - (order.get(b.path) ?? 0) || a.window.from - b.window.from);
  if (blocks.length === 0) {
    return { cards, drops: [{ type: 'trace-table', reason: t('chapter.traceNoBlock') }] };
  }

  for (const block of blocks) {
    if (cards.length >= MAX_TRACE) break;
    const file = req.files.get(block.path);
    if (file === undefined) continue;
    const made = makeTrace(req, block, file);
    if (made === null) continue;
    cards.push(made);
  }
  if (cards.length === 0) {
    drops.push({ type: 'trace-table', reason: t('chapter.traceNoRebind') });
  }
  return { cards, drops };
}

function makeTrace(req: StageRequest, block: StageBlock, file: StageFile): StageCard | null {
  const window = file.lines.filter((l) => l.n >= block.window.from && l.n <= block.window.to);
  if (window.length === 0) return null;
  const picked = pickColumns(scanNames(window));
  if (picked === null) return null;
  const rowLines = pickRows([...picked.obj, ...picked.vars]);
  if (rowLines.length < 2) return null;

  const rowKeys = rowLines.map((n) => `r${String(n)}`);
  const textOf = (n: number): string => (window.find((l) => l.n === n)?.t ?? '').trim();
  const rows: TracePayload['rows'] = rowLines.map((n, i) => ({
    k: rowKeys[i] as string, line: n, t: textOf(n),
  }));

  const cols: TracePayload['cols'] = [];
  const cells: TracePayload['cells'] = [];
  const hidden: string[] = [];
  for (const col of picked.obj) {
    const key = `c_${col.name}`;
    cols.push({ k: key, axis: 'obj', t: t('chapter.traceColBox', { name: col.name }) });
    const folded = foldColumn(key, rowKeys, boxCells(col, rowLines));
    cells.push(...folded.cells);
    hidden.push(...folded.hidden);
  }
  for (const col of picked.vars) {
    const key = `c_${col.name}`;
    cols.push({ k: key, axis: 'var', t: t('chapter.traceColHas', { name: col.name }) });
    const folded = foldColumn(key, rowKeys, hasCells(col, rowLines));
    cells.push(...folded.cells);
    hidden.push(...folded.hidden);
  }

  const focus = picked.obj[0]?.binds[0]?.line ?? rowLines[0] ?? block.window.from;
  const rebind = picked.obj[0]?.binds[1]?.line ?? focus;
  const payload: TracePayload = {
    track: 't3', kind: 'trace', stage: 2,
    q: t('chapter.traceQ', { name: picked.obj[0]?.name ?? '', file: baseName(block.path) }),
    hint: t('chapter.traceHint'),
    file: block.path,
    lines: codeLines(file.lines, focus, [], block.window),
    cols, rows, cells, hidden,
    ok: t('chapter.traceOk', { name: picked.obj[0]?.name ?? '', line: String(rebind) }),
    rule: t('chapter.traceRule'),
    promptLines: promptLines(file.lines, rebind),
  };
  return finishStage({
    req, type: 'trace-table', key: block.hash, fileId: file.fileId, payload,
  });
}

/**
 * 0부의 값 추적 — 재료는 카탈로그의 `FoldStep` 사다리다. 시간축이 **식이 접히는 걸음**이고
 * 열은 「값」과 「그때의 타입」 둘이다. **순수 함수이고 리포를 안 본다**
 * (`buildValueItems` 와 같은 자리이며 앱에 아직 안 걸려 있다).
 */
export function buildLadderTrace(lang: FundLang): TracePayload[] {
  const dialect = FUND_DIALECTS[lang];
  const out: TracePayload[] = [];
  for (const item of buildValueItems(lang).items) {
    if (item.fold.length < 2) continue;
    const rowKeys = item.fold.map((_, i) => `s${String(i)}`);
    const rows: TracePayload['rows'] = item.fold.map((step, i) => ({
      k: rowKeys[i] as string, line: null, t: step.code,
    }));
    const value = foldColumn('c_v', rowKeys, item.fold.map((s): TraceCell => ({ t: 'string', v: s.code })));
    const type = foldColumn('c_ty', rowKeys, item.fold.map((s): TraceCell => ({ t: 'string', v: s.type })));
    out.push({
      track: 't3', kind: 'trace', stage: 2,
      q: t('chapter.traceFoldQ', { name: item.target.name, lang: dialect.name }),
      hint: t('chapter.traceHint'),
      file: `${item.id}.${lang}`,
      lines: item.code.map((text, i) => ({ n: i + 1, t: text, ...(i === item.focus ? { target: true as const } : {}) })),
      cols: [
        { k: 'c_v', axis: 'var', t: t('chapter.traceColValue') },
        { k: 'c_ty', axis: 'var', t: t('chapter.traceColType') },
      ],
      rows,
      cells: [...value.cells, ...type.cells],
      hidden: [...value.hidden, ...type.hidden],
      ok: t('chapter.traceFoldOk', { name: item.target.name }),
      rule: t('chapter.traceRule'),
      promptLines: [...item.code],
    });
  }
  return out;
}
