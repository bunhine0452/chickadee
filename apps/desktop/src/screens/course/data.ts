/**
 * 코스 화면이 원장과 닿는 자리 (D171). IPC 를 아는 유일한 코스 코드다 — 컴포넌트는 props 만 본다.
 *
 * 규칙은 하나도 여기 없다: 통과·재검·막힘은 `@chickadee/concepts` 의 `progress.ts`,
 * 오늘 15분은 `@chickadee/scheduler` 의 `course-plan.ts`, 판정은 `@chickadee/grading` 의
 * `gradeStage` 다. 이 파일은 statement 결과를 그 함수들의 모양으로 옮기고 되돌린다.
 */
import {
  deferChapter, fromChapterRow, readingTally, recordStageResult, passTarget,
  type Advance, type ChapterProgress, type ChapterStage, type RecheckGrade,
} from '@chickadee/concepts';
import { loadDict, textOf, type Dict } from '@chickadee/dictionary';
import { ipc, log, type RowOf } from '@chickadee/ipc-client';
import {
  EST_RECHECK_MIN, planCourseDay, recheckGrade, recheckTally, scheduleRecheck,
  type CourseItem, type RecheckItem, type StageItem,
} from '@chickadee/scheduler';
import { fromCardRow, type ConceptId, type StageNo } from '@chickadee/store-sql';

import { pickPlateNow } from '../../data/manual.js';
import { loadScheduler, loadSettings } from '../../data/settings.js';
import { startSession } from '../../session-flow.js';
import { useUi } from '../../store.js';
import { planGates, type Gate } from './gate.js';
import { EST_GATE_MIN, toView, type StageCardView } from './run.js';

/** 코스 판정에 필요한 만큼의 챕터 한 장. `chapter.list` + 단마다 판 수 + 어휘 겹. */
export interface ChapterView {
  unitId: number;
  name: string;
  orderIdx: number;
  origin: 'entry' | 'dir';
  row: ChapterProgress;
  deferredDay: string | null;
  /** 단 → 구운 판 수. 「4단 문항이 있는가」(D165)와 「N판 · 약 M분」이 여기서 나온다. */
  counts: Readonly<Record<StageNo, number>>;
  /** 이 챕터에 붙은 어휘(t0 개념)와 그중 1겹 이상인 것. 1단의 통과선이다 (mastery.md §3.2). */
  vocab: { total: number; inked: number; zero: ConceptId[] };
  hasRepair: boolean;
  /** 앞 챕터가 아직 통과 전이라 닫혀 있나. 해금은 열이 아니라 순서다 (`chapter.today`). */
  locked: boolean;
}

export type DeadRow = RowOf<'path.dead_list'>;
export type PathRow = RowOf<'path.list_by_unit'>;
export type RangeRow = RowOf<'path.ranges_by_unit'>;

export interface CourseData {
  chapters: ChapterView[];
  /** 오늘 밟을 챕터 (`chapter.today`). 코스가 끝났으면 `null`. */
  todayUnitId: number | null;
  due: RecheckItem[];
  plan: CourseItem[];
  budgetMin: number;
  gates: Map<number, Gate>;
  dead: DeadRow[];
}

const STAGES: readonly StageNo[] = [1, 2, 3, 4, 5];

/**
 * 챕터 한 벌. 챕터마다 statement 둘(판 수·어휘 겹)을 더 부른다 — 코스 하나에 열 안팎이라
 * 스무 번이고, 목차를 열 때 한 번이다.
 */
export async function loadCourse(
  repoId: number, dayKey: string, now: number,
): Promise<CourseData> {
  const settings = await loadSettings();
  const [rows, todayRows, dueRows, dead] = await Promise.all([
    ipc.store.query('chapter.list', { repoId }),
    ipc.store.query('chapter.today', { repoId, dayKey }),
    ipc.store.query('chapter.due', { repoId, now, dayKey }),
    ipc.store.query('path.dead_list', { repoId }),
  ]);

  let lockedFrom = false;
  const chapters: ChapterView[] = [];
  for (const r of rows) {
    const [countRows, layerRows] = await Promise.all([
      ipc.store.query('card.stage_counts', { unitId: r.unit_id }),
      ipc.store.query('chapter.reading_layers', { unitId: r.unit_id }),
    ]);
    const counts: Record<StageNo, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const c of countRows) {
      if (STAGES.includes(c.stage_no as StageNo)) counts[c.stage_no as StageNo] = c.n;
    }
    const zero = layerRows.filter((l) => l.layer < 1).map((l) => l.concept_id as ConceptId);
    const row = fromChapterRow(r);
    // 앞 챕터가 통과 전이면 그 뒤는 닫힌다. 디렉터리 챕터(막간·부록)는 순서에 안 걸린다 —
    // 기능 폐포가 아니라 곁가지라 언제든 열 수 있다.
    const locked = r.origin === 'entry' && lockedFrom;
    if (r.origin === 'entry' && row.passedAt === null) lockedFrom = true;
    chapters.push({
      unitId: r.unit_id, name: r.name, orderIdx: r.order_idx,
      origin: r.origin === 'dir' ? 'dir' : 'entry',
      row, deferredDay: r.deferred_day, counts,
      vocab: { total: layerRows.length, inked: layerRows.length - zero.length, zero },
      hasRepair: counts[4] > 0,
      locked,
    });
  }

  const gates = new Map<number, Gate>();
  for (const g of planGates(chapters.map((c) => ({ unitId: c.unitId, zero: c.vocab.zero })))) {
    gates.set(g.unitId, g);
  }

  const due: RecheckItem[] = dueRows.map((d) => ({
    kind: 'recheck', unitId: d.unit_id, dueAt: d.due_at ?? now, estMin: EST_RECHECK_MIN,
  }));
  const todayUnitId = todayRows[0]?.unit_id ?? null;
  const today = chapters.find((c) => c.unitId === todayUnitId) ?? null;
  const next = today === null ? [] : await nextStageItems(today, gates.get(today.unitId) ?? null);
  const plan = planCourseDay({ budgetMin: settings.budgetMin, due, next });

  return { chapters, todayUnitId, due, plan, budgetMin: settings.budgetMin, gates, dead };
}

/** 오늘 챕터의 다음 단을 판 단위로. 1단은 관문 판이고, 2~5단은 구운 판이다. */
async function nextStageItems(chapter: ChapterView, gate: Gate | null): Promise<StageItem[]> {
  const stage = nextStage(chapter);
  if (stage === null) return [];
  if (stage === 1) {
    return (gate?.concepts ?? []).map((c) => ({
      kind: 'stage', unitId: chapter.unitId, stage: 1, ref: c, estMin: EST_GATE_MIN,
    }));
  }
  const cards = await loadStageCards(chapter.unitId, stage);
  return cards.map((c) => ({
    kind: 'stage', unitId: chapter.unitId, stage, ref: String(c.id), estMin: c.estMin,
  }));
}

/**
 * 다음에 밟을 단. 통과선(3 또는 4, D165)을 넘었으면 5단까지 열려 있되 게이트는 아니다.
 * 5단까지 다 밟았으면 `null`.
 */
export function nextStage(chapter: ChapterView): StageNo | null {
  const n = chapter.row.stageReached + 1;
  return n >= 1 && n <= 5 ? (n as StageNo) : null;
}

/** 한 단의 판 전부. 판 전환에 IPC 0회가 되도록 한 번에 긷는다. */
export async function loadStageCards(unitId: number, stageNo: StageNo): Promise<StageCardView[]> {
  const rows = await ipc.store.query('card.by_unit_stage', { unitId, stageNo });
  const out: StageCardView[] = [];
  for (const r of rows) {
    try {
      const view = toView(fromCardRow(r));
      if (view !== null) out.push(view);
    } catch (e) {
      // 모양이 어긋난 행은 걸지 않는다 — 판 하나 때문에 단 전체가 안 열리면 안 된다.
      log.warn('코스 판을 읽지 못했다', { cardId: r.id, message: e instanceof Error ? e.message : String(e) });
    }
  }
  return out;
}

/**
 * 재검 두 장 — 2단 추적 1 + 3단 예측 1 (`mastery.md` §4 ②). 새 문항을 만들지 않는다.
 * 어느 판인지는 `reps` 로 돌린다: 재검마다 다른 판이 나오되 같은 날에는 같은 판이다.
 */
export async function loadRecheckCards(chapter: ChapterView): Promise<StageCardView[]> {
  const [trace, predict] = await Promise.all([
    loadStageCards(chapter.unitId, 2), loadStageCards(chapter.unitId, 3),
  ]);
  const hops = trace.filter((c) => c.type === 'hop');
  const tracePool = hops.length > 0 ? hops : trace;
  const pick = <T,>(pool: readonly T[]): T | undefined =>
    pool.length === 0 ? undefined : pool[chapter.row.reps % pool.length];
  const out: StageCardView[] = [];
  const a = pick(tracePool);
  const b = pick(predict);
  if (a !== undefined) out.push(a);
  if (b !== undefined) out.push(b);
  return out;
}

export const loadPaths = (unitId: number): Promise<PathRow[]> =>
  ipc.store.query('path.list_by_unit', { unitId });

export const loadRanges = (unitId: number): Promise<RangeRow[]> =>
  ipc.store.query('path.ranges_by_unit', { unitId });

/**
 * 코스가 원장에 쓸 세션 행. `stage_log.session_id` 가 NOT NULL 이라 있어야 하고,
 * 클론 코스(D120)와 같이 **태어날 때부터 `done`** 이다 — `active` 로 두면
 * `session.open_today` 가 그것을 「이어 찍을 세션」으로 집어 일일 큐가 코스에 끌려간다.
 * 예산도 0 이라 `stats.days` 의 하루 분 합계를 움직이지 않는다.
 */
export async function openCourseSession(repoId: number, dayKey: string, now: number): Promise<number> {
  const seq = (await ipc.store.query('session.next_seq', { repoId, dayKey }))[0]?.n ?? 1;
  const made = await ipc.store.exec('session.insert', {
    repoId, dayKey, seqInDay: seq, startedAt: now,
    budgetMin: 0, plannedMin: 0, status: 'done', planJson: JSON.stringify([]),
  });
  return made.lastId;
}

// ───────── 1단 · 어휘 관문 ─────────

export interface GateOpened {
  placed: number;
  /** 교정쇄가 열렸나. 열렸으면 화면이 이미 그 판을 보이고 있다. */
  opened: boolean;
}

/**
 * 관문을 연다 — 0겹 개념마다 「이 판 찍기」(`role='manual'`)로 오늘 큐에 끼우고 교정쇄를
 * 연다. **새 판 화면을 만들지 않는다** (D171 ③): 판·사다리·겹·LIFER 는 기존 교정쇄의 것이고,
 * 그 판이 올린 겹이 곧 1단의 통과선이다.
 */
export async function openGate(
  repoId: number, rootPath: string, concepts: readonly ConceptId[],
): Promise<GateOpened> {
  let placed = 0;
  let opened = false;
  for (const conceptId of concepts) {
    const r = await pickPlateNow({ repoId, rootPath, conceptId, siteId: null });
    if (!r.ok) continue;
    placed += 1;
    if (r.opened) opened = true;
  }
  if (placed > 0 && !opened && useUi.getState().session === null) {
    opened = await startSession(repoId, rootPath);
  }
  return { placed, opened };
}

export interface JudgeDeps {
  sessionId: number;
  dayKey: string;
  now: number;
}

/**
 * 읽기 단 판정 — 어휘 전부가 1겹 이상인가. 어휘가 하나도 없는 챕터는 판정할 것이 없어
 * 통과로 센다(`asked` 0 은 `stagePasses` 가 거짓이라 여기서 1/1 로 적는다 — 원장에는
 * 「물은 것 없음」이 `detail` 로 남는다).
 */
export async function judgeReading(deps: JudgeDeps, chapter: ChapterView): Promise<Advance> {
  const layers = await ipc.store.query('chapter.reading_layers', { unitId: chapter.unitId });
  const t = readingTally(layers);
  const empty = t.asked === 0;
  return recordStageResult({
    sessionId: deps.sessionId, dayKey: deps.dayKey, now: deps.now, row: chapter.row,
    result: {
      unitId: chapter.unitId, stage: 1,
      asked: empty ? 1 : t.asked, correct: empty ? 1 : t.correct, durationMs: 0,
      detail: { kind: 'reading', asked: t.asked, correct: t.correct },
    },
    kind: 'first', hasRepair: chapter.hasRepair,
  });
}

// ───────── 2~5단 · 재검 ─────────

export interface StageOutcome {
  unitId: number;
  stage: ChapterStage;
  asked: number;
  correct: number;
  durationMs: number;
  detail: unknown;
}

export async function finishStage(
  deps: JudgeDeps, row: ChapterProgress, hasRepair: boolean, outcome: StageOutcome,
): Promise<Advance> {
  return recordStageResult({
    sessionId: deps.sessionId, dayKey: deps.dayKey, now: deps.now, row,
    result: outcome, kind: 'first', hasRepair,
  });
}

export interface RecheckOutcome {
  traceOk: boolean;
  predictOk: boolean;
  durationMs: number;
}

/** 재검 한 번 — 등급은 `recheckGrade`, 일정은 `scheduleRecheck`(FSRS 그대로), 원장은 `recordStageResult`. */
export async function finishRecheck(
  deps: JudgeDeps, row: ChapterProgress, hasRepair: boolean, outcome: RecheckOutcome,
): Promise<{ advance: Advance; grade: RecheckGrade }> {
  const settings = await loadSettings();
  const scheduler = await loadScheduler(deps.now, settings.desiredRetention);
  const grade = recheckGrade(outcome);
  const schedule = scheduleRecheck(scheduler, row, grade, deps.now);
  const tally = recheckTally(outcome);
  const advance = await recordStageResult({
    sessionId: deps.sessionId, dayKey: deps.dayKey, now: deps.now, row,
    result: {
      unitId: row.unitId, stage: 2, asked: tally.asked, correct: tally.correct,
      durationMs: outcome.durationMs, detail: { kind: 'recheck', ...outcome },
    },
    kind: 'recheck', hasRepair, recheck: { grade, schedule },
  });
  return { advance, grade };
}

/** 세 번 막혀 오늘은 접는다 (`mastery.md` §5). */
export const foldChapter = (unitId: number, dayKey: string, now: number): Promise<void> =>
  deferChapter(unitId, dayKey, now);

/** 3단 막힘 — 그 판이 딛는 개념의 판을 오늘 큐에 끼운다 (§3.3 「그 개념의 판만 큐 앞에」). */
export async function queueConceptPlate(
  repoId: number, rootPath: string, conceptId: ConceptId,
): Promise<boolean> {
  const r = await pickPlateNow({ repoId, rootPath, conceptId, siteId: null });
  return r.ok;
}

/** 통과선 — 화면의 「3단까지가 통과」 문구가 이것을 본다. */
export const targetOf = (chapter: ChapterView): 3 | 4 => passTarget(chapter.hasRepair);

/** 개념 이름 한 줄. 사전에 없으면 id 그대로 — 화면이 빈 칸을 내지 않는다. */
export function conceptName(dict: Dict, conceptId: string): string {
  const c = dict.concepts.get(conceptId);
  return c === undefined ? conceptId : textOf(c.name, dict.locale).text;
}

/** 사전 1층 — 3단 막힘이 판 위에 펴는 한 줄. */
export function conceptOneLiner(dict: Dict, conceptId: string): string | null {
  const c = dict.concepts.get(conceptId);
  if (c === undefined) return null;
  const line = textOf(c.dict.one_liner, dict.locale).text;
  return line === '' ? null : line;
}

export const dictNow = (): Dict => loadDict();
