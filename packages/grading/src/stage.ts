/**
 * 코스 문항 채점 (D164 · `docs/program/exercises.md` §2·§3) — 16유형이 `gradeStage` 하나로 온다.
 *
 * 새 판정기는 거의 없다. 선택형은 인덱스 하나, `hop` 은 `gradeFlow`, `caller` 는 `gradePicks`,
 * `exec` 은 `gradeT0`, 4·5단은 T1 사다리(`compareLine`·`gradeT1`)다. 여기가 더하는 것은 셋 —
 * ① 단의 통과 규칙(2단은 전부 맞음 · `mastery.md` §3.2) ② `patch-place` 의 스코프 검사
 * (실행 없이 여러 답을 허용하는 유일한 장치) ③ `reimpl-layer` 의 연결 검사 ⓑⓒⓓ.
 *
 * 순수 함수다 — IPC 도 SQL 도 부르지 않는다. `stage_log` 에 적는 것은 진도(D165)의 몫이고
 * 여기서는 판정만 돌려준다.
 */
import { t } from '@chickadee/i18n';
import type { CardPayload } from '@chickadee/store-sql';

import { gradeT0, type T0Verdict } from './t0.js';
import type { AstPair } from './t1-ast.js';
import { compareLine, type LineCompare } from './t1-line.js';
import { buildProt } from './t1-prot.js';
import { gradeT1 } from './t1-result.js';
import type { T1Result } from './t1-types.js';
import { gradeFlow, gradePicks } from './t2.js';
import type { T2Result } from './t2-types.js';

type Choice = Extract<CardPayload, { kind: 'twin' | 'origin' | 'cut' | 'reorder' | 'contract' }>;
type Repair = Extract<CardPayload, { kind: 'repair' }>;
type Reimpl = Extract<CardPayload, { kind: 'reimpl' }>;

/** 화면이 넘기는 답. 판 모양마다 하나씩 — 모양이 안 맞으면 `wrong-shape` 로 떨어진다. */
export type StageAnswer =
  | { kind: 'choice'; sel: number; reasonSel?: number }
  | { kind: 'order'; ordered: readonly string[] }
  | { kind: 'picks'; selected: readonly string[]; hints?: number }
  | { kind: 'lines'; lines: readonly string[] }
  | { kind: 'place'; at: number }
  | { kind: 'handoff'; lines?: readonly string[] };

export type StageDetail =
  | { kind: 'choice'; sel: number; answer: number; reasonOk: boolean | null }
  | { kind: 't0'; verdict: T0Verdict }
  | { kind: 't2'; result: T2Result }
  | { kind: 'line'; compare: LineCompare }
  | { kind: 'place'; at: number; target: number; reason: 'exact' | 'scope-ok' | 'before-decl' | 'after-use' | 'off' }
  | { kind: 't1'; result: T1Result; links: { name: string; ok: boolean }[] }
  | { kind: 'handoff'; prompt: string }
  | { kind: 'wrong-shape' };

export interface StageVerdict {
  ok: boolean;
  /** 표시값. `handoff` 는 `null`. */
  pct: number | null;
  /** 오답 진단 — 「그것이 참이 되는 조건」. 정답이면 `null`. */
  diagnosis: string | null;
  /** 정답 해설과 규칙. 판정란이 언제나 싣는다 (T0 와 같다). */
  okText: string | null;
  rule: string | null;
  detail: StageDetail;
}

export interface StageOptions {
  /** 4·5단 AST 승격 (04 §4.5). 없으면 정규식층만 돈다. */
  ast?: AstPair;
  /** 접힌 폴더 노드 — `caller` 만. */
  foldedOf?: Readonly<Record<string, readonly string[]>>;
  /** 측정용 시계. 골든이 deep-equal 이려면 고정한다. */
  clock?: () => number;
}

const wrongShape = (): StageVerdict =>
  ({ ok: false, pct: 0, diagnosis: t('grading.stageWrongShape'), okText: null, rule: null, detail: { kind: 'wrong-shape' } });

export function gradeStage(payload: CardPayload, answer: StageAnswer, opts: StageOptions = {}): StageVerdict {
  switch (payload.track) {
    case 't0': {
      if (answer.kind !== 'choice') return wrongShape();
      const verdict = gradeT0(payload, answer.sel);
      return {
        ok: verdict.correct, pct: verdict.correct ? 100 : 0,
        diagnosis: verdict.diag?.t ?? null, okText: verdict.ok, rule: verdict.rule,
        detail: { kind: 't0', verdict },
      };
    }
    case 't2':
      return gradeTrace(payload, answer, opts);
    case 't1':
      return wrongShape();
    case 't3':
      if (payload.kind === 'repair') return gradeRepair(payload, answer, opts);
      if (payload.kind === 'reimpl') return gradeReimpl(payload, answer, opts);
      return gradeChoice(payload, answer);
    default:
      return wrongShape();
  }
}

// ───────── 선택형 (t3 다섯) ─────────

function gradeChoice(payload: Choice, answer: StageAnswer): StageVerdict {
  if (answer.kind !== 'choice') return wrongShape();
  const placeOk = answer.sel === payload.answer;
  const reason = payload.reason;
  const reasonOk = reason === undefined ? null : answer.reasonSel === reason.answer;
  const ok = placeOk && reasonOk !== false;
  let diagnosis: string | null = null;
  if (!placeOk) diagnosis = payload.why[answer.sel]?.t ?? payload.rule;
  else if (reason !== undefined && reasonOk === false) {
    diagnosis = reason.why[answer.reasonSel ?? -1]?.t ?? t('grading.stageReasonWrong');
  }
  return {
    ok, pct: ok ? 100 : placeOk ? 50 : 0, diagnosis, okText: payload.ok, rule: payload.rule,
    detail: { kind: 'choice', sel: answer.sel, answer: payload.answer, reasonOk },
  };
}

// ───────── 2단 추적 (t2 모양 빌림) ─────────

function gradeTrace(payload: Extract<CardPayload, { track: 't2' }>, answer: StageAnswer, opts: StageOptions): StageVerdict {
  if (payload.kind === 'flow') {
    if (answer.kind !== 'order') return wrongShape();
    const result = gradeFlow({ payload, ordered: [...answer.ordered], hints: 0 });
    // 2단은 부분점수가 없다 — 하나만 틀려도 「무엇이 언제 도는가」를 놓친 것이다 (mastery.md §3.2).
    const ok = result.pct === 100 && result.wrong.length === 0 && result.missed.length === 0;
    return {
      ok, pct: result.pct,
      diagnosis: ok ? null : t('grading.stageHopPartial', { pct: String(result.pct) }),
      okText: null, rule: null, detail: { kind: 't2', result },
    };
  }
  if (payload.kind === 'radius') {
    if (answer.kind !== 'picks') return wrongShape();
    const result = gradePicks({
      kind: 'radius', payload, selected: answer.selected, hints: answer.hints ?? 0,
      ...(opts.foldedOf ? { foldedOf: opts.foldedOf } : {}),
    });
    const ok = result.missed.length === 0 && result.wrong.length === 0;
    return {
      ok, pct: result.pct, diagnosis: ok ? null : t('grading.stageCallerPartial'),
      okText: null, rule: null, detail: { kind: 't2', result },
    };
  }
  return wrongShape();
}

// ───────── 4단 수정 ─────────

const DECL = /\b(?:const|let|var|final|int|long|double|float|boolean|char|String|[A-Z][A-Za-z0-9_]*(?:<[^>]*>)?)\s+([A-Za-z_$][\w$]*)\s*=/;
const PY_DECL = /^\s*([A-Za-z_][\w]*)\s*=[^=]/;
const IDENT = /[A-Za-z_$][A-Za-z0-9_$]*/g;

/** 줄이 만드는 이름 — 선언·첫 대입. 없으면 `null`. */
export function declaredName(line: string): string | null {
  return DECL.exec(line)?.[1] ?? PY_DECL.exec(line)?.[1] ?? null;
}

const identsIn = (line: string): Set<string> => new Set([...line.matchAll(IDENT)].map((m) => m[0]));

export interface PlaceCheck {
  ok: boolean;
  reason: 'exact' | 'scope-ok' | 'before-decl' | 'after-use' | 'off';
  name?: string;
  /** 창 안 0-based 줄 — 진단문이 파일 줄로 바꿔 쓴다. */
  line?: number;
}

/**
 * `patch-place` 의 스코프 검사 (`exercises.md` §3 ⓐ) — 실행 없이 여러 답을 허용하는 장치.
 *
 * 넣을 줄이 **쓰는** 이름은 그 앞에서 만들어져 있어야 하고, 넣을 줄이 **만드는** 이름은 그 뒤에서
 * 쓰여야 한다. 둘 다 지키는 자리는 전부 정답이다. 이름이 하나도 안 걸리면 원래 자리만 정답이다 —
 * 그때는 기계가 아는 것이 없다.
 */
export function checkPlace(lines: readonly string[], inserted: string, at: number, target: number): PlaceCheck {
  if (at === target) return { ok: true, reason: 'exact' };
  if (at < 0 || at > lines.length) return { ok: false, reason: 'off', line: target };
  const declared = lines.map(declaredName);
  const uses = identsIn(inserted);
  let constrained = false;
  // ⓐ 쓰는 이름은 앞에서 만들어졌나.
  for (let i = 0; i < lines.length; i += 1) {
    const name = declared[i];
    if (name === null || name === undefined || !uses.has(name)) continue;
    constrained = true;
    if (at <= i) return { ok: false, reason: 'before-decl', name, line: i };
  }
  // ⓑ 만드는 이름은 뒤에서 쓰이나.
  const made = declaredName(inserted);
  if (made !== null) {
    for (let i = 0; i < lines.length; i += 1) {
      if (!identsIn(lines[i] as string).has(made)) continue;
      constrained = true;
      if (at > i) return { ok: false, reason: 'after-use', name: made, line: i };
    }
  }
  return constrained ? { ok: true, reason: 'scope-ok' } : { ok: false, reason: 'off', line: target };
}

function gradeRepair(payload: Repair, answer: StageAnswer, opts: StageOptions): StageVerdict {
  if (payload.type === 'patch-place') {
    if (answer.kind !== 'place') return wrongShape();
    const check = checkPlace(payload.lines, payload.expected[0] ?? '', answer.at, payload.target);
    const lineNo = (i: number): string => String(payload.from + i);
    let diagnosis: string | null = null;
    if (check.reason === 'before-decl') diagnosis = t('grading.stagePlaceBeforeDecl', { name: check.name ?? '', line: lineNo(check.line ?? 0) });
    else if (check.reason === 'after-use') diagnosis = t('grading.stagePlaceAfterUse', { name: check.name ?? '', line: lineNo(check.line ?? 0) });
    else if (check.reason === 'off') diagnosis = t('grading.stagePlaceOff', { line: lineNo(payload.target - 1) });
    return {
      ok: check.ok, pct: check.ok ? 100 : 0, diagnosis,
      okText: check.reason === 'scope-ok' ? t('grading.stagePlaceOk') : null, rule: null,
      detail: { kind: 'place', at: answer.at, target: payload.target, reason: check.reason },
    };
  }
  if (answer.kind !== 'lines') return wrongShape();
  if (payload.type === 'patch-line') {
    const expected = payload.expected[0] ?? '';
    const user = answer.lines[payload.target] ?? '';
    if (user.trim() === '') {
      return { ok: false, pct: 0, diagnosis: t('grading.stagePatchNoLine'), okText: null, rule: null, detail: { kind: 'line', compare: compareLine(expected, user, new Set()) } };
    }
    const prot = buildProt({ original: [expected], grammar: payload.grammar });
    const compare = compareLine(expected, user, prot);
    const ok = compare.status === 'exact' || compare.status === 'equiv';
    return {
      ok, pct: ok ? 100 : 0,
      diagnosis: ok ? null : t('grading.stagePatchDiffer', { reason: compare.reasons.map((r) => r.code).join(', ') || 'DIFFER' }),
      okText: ok ? t('grading.stagePatchOk') : null, rule: null,
      detail: { kind: 'line', compare },
    };
  }
  // rollback — 창 전체를 이전 모양과 견준다 (T1 사다리, 3단계 기준).
  const result = ladder(payload.expected, answer.lines, payload.grammar, opts);
  const ok = result.verdict === 'advance';
  return {
    ok, pct: result.pct, diagnosis: null, okText: ok ? t('grading.stagePatchOk') : null, rule: null,
    detail: { kind: 't1', result, links: [] },
  };
}

function ladder(original: readonly string[], user: readonly string[], grammar: string, opts: StageOptions): T1Result {
  return gradeT1({
    blockId: 0, stage: 3, original, user, grammar, peeks: 0, downgraded: false,
    ...(opts.ast ? { ast: opts.ast } : {}),
    ...(opts.clock ? { clock: opts.clock } : {}),
  });
}

// ───────── 5단 재구현 ─────────

const hasWord = (text: string, name: string): boolean =>
  new RegExp(`(^|[^A-Za-z0-9_$])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9_$]|$)`).test(text);

/** 연결 검사 ⓑⓒⓓ — 이웃 층과 같이 쓰는 이름이 답에 그대로 있는가. 「층 사이의 계약은 이름이다」. */
export function checkLinks(links: readonly string[], user: readonly string[]): { name: string; ok: boolean }[] {
  const text = user.join('\n');
  return links.map((name) => ({ name, ok: hasWord(text, name) }));
}

function gradeReimpl(payload: Reimpl, answer: StageAnswer, opts: StageOptions): StageVerdict {
  if (payload.type === 'handoff') {
    const mine = answer.kind === 'handoff' || answer.kind === 'lines' ? (answer.lines ?? []) : [];
    return {
      ok: true, pct: null, diagnosis: null, okText: t('grading.stageHandoff'), rule: null,
      detail: { kind: 'handoff', prompt: buildHandoffPrompt(payload, mine) },
    };
  }
  if (answer.kind !== 'lines') return wrongShape();
  const result = ladder(payload.original, answer.lines, payload.grammar, opts);
  const links = payload.type === 'reimpl-layer' ? checkLinks(payload.links, answer.lines) : [];
  const broken = links.find((l) => !l.ok);
  const ok = result.verdict === 'advance' && broken === undefined;
  return {
    ok, pct: result.pct,
    diagnosis: broken === undefined ? null : t('grading.stageLinkMissing', { name: broken.name }),
    okText: links.length > 0 ? t('grading.stageLinks', { ok: String(links.filter((l) => l.ok).length), n: String(links.length) }) : null,
    rule: null,
    detail: { kind: 't1', result, links },
  };
}

/**
 * `handoff` 의 프롬프트 — 원본 **앞뒤 4줄**(`promptLines`, D8)과 내 답과 물음. 파일은 이름만 —
 * 디렉터리 경로·리포명은 안 나간다 (정본 §3-1 ④). 자동 전송은 없다.
 */
export function buildHandoffPrompt(payload: Reimpl, mine: readonly string[]): string {
  const file = payload.file.slice(payload.file.lastIndexOf('/') + 1);
  return [
    t('grading.handoffOriginal', { file, from: String(Math.max(1, payload.from - 4)) }),
    ...payload.promptLines,
    '',
    t('grading.handoffMine'),
    ...mine,
    '',
    payload.question.replace(/<[^>]+>/g, ''),
    t('stage.handoffAsk'),
  ].join('\n');
}
