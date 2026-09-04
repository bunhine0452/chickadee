/**
 * 클론 코스 — 목차·조각·채점을 원장에 잇는 자리 (D120).
 *
 * 코스는 일일 큐 **밖**의 모드다. 예산(D12)도 하루 새 판 상한(`newPerDay`)도 건드리지
 * 않고, 결과만 원장을 거쳐 개념 겹에 반영한다. 그 「밖」을 지키는 자리가 셋이다.
 *
 *  1. **세션은 태어날 때부터 `done` 이다.** `review_log.session_id` 가 NOT NULL 이라 코스도
 *     `session` 한 행이 있어야 하는데, `active` 로 두면 `session.open_today`·`open_any` 가
 *     그것을 「이어 찍을 세션」으로 집어 일일 큐가 코스 판을 찍는다. `budget_min`·
 *     `elapsed_s` 도 0 으로 둔다 — `stats.days` 의 하루 분 합계가 예산의 얼굴이다.
 *     코스가 쓴 시간은 `clone_step.elapsed_s` 에 있다.
 *  2. **`session_item.role` 은 `manual` 이다.** CHECK 목록에 갇혀 있고 SQLite 는 CHECK 를
 *     ALTER 로 못 고친다. `new` 를 쓰면 `queue.new_count_today` 가 세어 하루 새 판 상한이
 *     코스에 먹힌다. 코스 소속은 `clone_step.review_log_id` 로 가른다.
 *  3. **`card_state.stage` 를 옮기지 않는다** (`keepCardStage`). 코스와 큐는 같은 카드를
 *     공유하고, 코스가 자기 단계를 밀어 넣으면 큐의 사다리가 코스에 끌려간다.
 *
 * 규칙은 하나도 여기서 만들지 않는다 — 순서는 `@chickadee/concepts` 의 `clone-order`,
 * 조각 나누기는 `@chickadee/cards` 의 `segment()`, 판정은 `@chickadee/grading` 의
 * `gradeT1`, 겹과 등급은 `@chickadee/scheduler` 다. 이 파일은 그 넷을 원장에 옮긴다.
 */
import {
  buildSpec, contentHash, fnv1a64, keepKinds, pickConcept, segment,
  genericWhyHelp, genericWhyQ, GEN_VERSION,
  type BlockCandidate, type BlockConcept, type Segment, type SpecCard, type T1Payload,
} from '@chickadee/cards';
import {
  courseOrder, courseStage, keepCardStage, type CourseStep,
} from '@chickadee/concepts';
import type { Dict } from '@chickadee/dictionary';
import { gradeT1, toT1Detail, type T1Result } from '@chickadee/grading';
import { ipc, log, type AstLite, type RowOf } from '@chickadee/ipc-client';
import { estMinFor, type Scheduler } from '@chickadee/scheduler';
import { fromMasteryRow, type ConceptId, type DayKey, type Mastery } from '@chickadee/store-sql';

import { essentialOf, originalAst, parseSnippet } from './blocks.js';
import { emptyMastery, finishPlate, type FinishResult } from './plate.js';

/** 코스 판의 `session_item.role`. CHECK 목록 안에서 큐 집계에 안 잡히는 유일한 값이다. */
export const COURSE_ROLE = 'manual';

export interface CloneDeps {
  repoId: number;
  rootPath: string;
  dict: Dict;
  dictVersion: string;
  now: number;
  day: DayKey;
}

export type CloneScope = { kind: 'repo' } | { kind: 'unit'; unitId: number };

export interface CloneRun {
  id: number;
  repoId: number;
  sessionId: number;
  mode: 'commit' | 'dep';
  scope: 'repo' | 'unit';
  unitId: number | null;
  status: 'active' | 'paused' | 'done' | 'abandoned';
  /** 목차 = `order_json`. `clone_step.seq` 가 이 배열의 색인이다. */
  steps: CourseStep[];
  startedAt: number;
  finishedAt: number | null;
}

export type CloneStepRow = RowOf<'clone.steps'>;

// ───────── 목차 ─────────

/** 순서 산출에 필요한 넷을 긷고 `courseOrder` 에 넘긴다. 규칙은 그쪽이 정한다. */
export async function planCourse(
  repoId: number,
  scope: CloneScope,
): Promise<{ mode: 'commit' | 'dep'; steps: CourseStep[] }> {
  const fileRows = scope.kind === 'unit'
    ? await ipc.store.query('clone.course_files_in_unit', { repoId, unitId: scope.unitId })
    : await ipc.store.query('clone.course_files', { repoId });
  const files = fileRows.map((f) => ({ fileId: f.id, path: f.path, unitId: f.unit_id }));
  const commitCount = (await ipc.store.query('clone.commit_count', { repoId }))[0]?.n ?? 0;
  // 커밋 순으로 갈 때만 커밋 재료를 긷는다 — 큰 리포에서 이 질의가 제일 무겁다.
  const touches = commitCount > 0
    ? (await ipc.store.query('clone.commit_touches', { repoId })).map((t) => ({
        sha: t.sha, authoredAt: t.authored_at, path: t.path, fileId: t.id,
      }))
    : [];
  const units = (await ipc.store.query('clone.units', { repoId }))
    .map((u) => ({ id: u.id, name: u.name, orderIdx: u.order_idx }));
  const edges = (await ipc.store.query('clone.import_edges', { repoId }))
    .map((e) => ({ fromFileId: e.from_file_id, toFileId: e.to_file_id }));
  return courseOrder({ files, commitCount, touches, units, edges });
}

/**
 * 코스를 연다. `session` 한 행과 `clone_run` 한 행이 같이 태어난다 —
 * 원장이 세션 없이는 아무것도 못 받기 때문이지 코스가 세션이어서가 아니다.
 */
export async function startCourse(deps: CloneDeps, scope: CloneScope): Promise<CloneRun | null> {
  const order = await planCourse(deps.repoId, scope);
  if (order.steps.length === 0) return null;

  const seq = (await ipc.store.query('session.next_seq', {
    repoId: deps.repoId, dayKey: deps.day,
  }))[0]?.n ?? 1;
  const session = await ipc.store.exec('session.insert', {
    repoId: deps.repoId,
    dayKey: deps.day,
    seqInDay: seq,
    startedAt: deps.now,
    // 예산은 코스의 것이 아니다 (D120). 0 이라 `stats.days` 의 하루 분 합계도 움직이지 않는다.
    budgetMin: 0,
    plannedMin: 0,
    status: 'done',
    planJson: JSON.stringify([]),
  });
  const unitId = scope.kind === 'unit' ? scope.unitId : null;
  const run = await ipc.store.exec('clone.run_insert', {
    repoId: deps.repoId,
    sessionId: session.lastId,
    mode: order.mode,
    scope: scope.kind,
    unitId,
    status: 'active',
    orderJson: JSON.stringify(order.steps),
    startedAt: deps.now,
  });
  return {
    id: run.lastId,
    repoId: deps.repoId,
    sessionId: session.lastId,
    mode: order.mode,
    scope: scope.kind,
    unitId,
    status: 'active',
    steps: order.steps,
    startedAt: deps.now,
    finishedAt: null,
  };
}

const toRun = (row: RowOf<'clone.run_get'>): CloneRun => ({
  id: row.id,
  repoId: row.repo_id,
  sessionId: row.session_id,
  mode: row.mode === 'commit' ? 'commit' : 'dep',
  scope: row.scope === 'unit' ? 'unit' : 'repo',
  unitId: row.unit_id,
  status: row.status as CloneRun['status'],
  steps: JSON.parse(row.order_json) as CourseStep[],
  startedAt: row.started_at,
  finishedAt: row.finished_at,
});

/** 이어할 코스. 없으면 `null` — 부르는 쪽이 `startCourse` 를 고른다. */
export async function openCourse(repoId: number): Promise<CloneRun | null> {
  const rows = await ipc.store.query('clone.run_open', { repoId });
  const row = rows[0];
  return row === undefined ? null : toRun(row);
}

/** 코스 하나를 id 로. 끝난 코스를 다시 볼 때의 문이다. */
export async function getCourse(runId: number): Promise<CloneRun | null> {
  const row = (await ipc.store.query('clone.run_get', { id: runId }))[0];
  return row === undefined ? null : toRun(row);
}

/** 목차의 파일 하나에 딸린 조각들. 화면이 그 줄만 펼칠 때 쓴다. */
export const courseStepsAt = (runId: number, seq: number): Promise<CloneStepRow[]> =>
  ipc.store.query('clone.steps_at', { runId, seq });

export async function closeCourse(
  runId: number,
  status: 'paused' | 'done' | 'abandoned',
  at: number,
): Promise<void> {
  await ipc.store.exec('clone.run_update', {
    id: runId, status, finishedAt: status === 'paused' ? null : at,
  });
}

export const courseSteps = (runId: number): Promise<CloneStepRow[]> =>
  ipc.store.query('clone.steps', { runId });

export async function courseProgress(
  runId: number,
): Promise<{ total: number; done: number; elapsedS: number }> {
  const row = (await ipc.store.query('clone.progress', { runId }))[0];
  return { total: row?.total ?? 0, done: row?.done ?? 0, elapsedS: row?.elapsed_s ?? 0 };
}

// ───────── 조각 (지연 생성) ─────────

/** 조각 원문의 해시. 재인제스트로 파일이 바뀌면 이 값이 어긋나고 그 조각은 다시 잘린다. */
export const segmentHash = (lines: readonly string[]): string => fnv1a64(lines.join('\n'));

async function readLines(
  rootPath: string, relPath: string, from: number, to: number,
): Promise<string[]> {
  try {
    const chunk = await ipc.file.readLines({ rootPath, relPath, from, to: to + 1 });
    return chunk.lines;
  } catch (e) {
    log.warn('코스가 원문을 읽지 못했다', {
      errorCode: e instanceof Error && 'code' in e ? String(e.code) : 'UNKNOWN',
    });
    return [];
  }
}

/**
 * 블록 하나를 12~40줄 조각으로 자른다. 40줄 이하면 조각 하나 — `segment()` 가 그렇게
 * 계약되어 있다(04 §3.1). 여기서 새로 자르는 규칙을 만들지 않는다.
 */
async function cutBlock(
  deps: CloneDeps,
  path: string,
  grammar: string,
  block: { line_start: number; line_end: number },
): Promise<Segment[]> {
  const lines = await readLines(deps.rootPath, path, block.line_start, block.line_end);
  if (lines.length === 0) return [];
  return segment(lines, { grammar, lineStart: block.line_start });
}

/**
 * 목차의 `seq` 번째 파일을 조각으로 펼쳐 넣는다. 파일 안의 순서는 블록의 줄 번호 순이고,
 * 블록마다 `segment()` 결과가 이어 붙는다 — `part` 는 그 파일 전체를 통틀어 0부터다.
 *
 * 코스를 열 때 리포 전체를 자르지 않는 이유(clone-plate-lazy): 파일마다 원문을 읽어야
 * 하므로 2,000 파일이면 IPC 가 2,000회다. 목차는 SQL 넷으로 서고, 자르기는 그 파일에
 * 닿을 때 한 번씩 한다.
 */
export async function materializeFile(
  deps: CloneDeps,
  run: CloneRun,
  seq: number,
): Promise<number> {
  const file = run.steps[seq];
  if (file === undefined) return 0;
  const blocks = await ipc.store.query('block.by_file', { fileId: file.fileId });
  const grammar = (await ipc.store.query('clone.file_grammar', { fileId: file.fileId }))[0]
    ?.grammar ?? 'typescript';

  let part = 0;
  for (const block of [...blocks].sort((a, b) => a.line_start - b.line_start)) {
    for (const piece of await cutBlock(deps, file.path, grammar, block)) {
      await ipc.store.exec('clone.step_insert', {
        runId: run.id,
        seq,
        part,
        fileId: file.fileId,
        blockId: block.id,
        lineStart: piece.lineStart,
        lineEnd: piece.lineEnd,
        textHash: segmentHash(piece.lines),
      });
      part += 1;
    }
  }
  return part;
}

/**
 * 다음에 칠 조각. 아직 안 끝난 조각이 있으면 그것이고, 없으면 아직 안 잘린 파일을
 * 앞에서부터 잘라 본다. 블록이 하나도 없는 파일은 조각을 못 내므로 다음 파일로 넘어간다.
 */
export async function nextStep(deps: CloneDeps, run: CloneRun): Promise<CloneStepRow | null> {
  const pending = (await ipc.store.query('clone.step_next', { runId: run.id }))[0];
  if (pending !== undefined) return pending;
  let seq = ((await ipc.store.query('clone.max_seq', { runId: run.id }))[0]?.n ?? -1) + 1;
  while (seq < run.steps.length) {
    if (await materializeFile(deps, run, seq) > 0) {
      const made = (await ipc.store.query('clone.step_next', { runId: run.id }))[0];
      if (made !== undefined) return made;
    }
    seq += 1;
  }
  return null;
}

/** 자동 저장. 원장에는 아무것도 쓰지 않는다 (P4 이어하기가 이 초안을 되읽는다). */
export const saveDraft = (
  stepId: number, elapsedS: number, draft: string | null,
): Promise<unknown> =>
  ipc.store.exec('clone.step_save', { id: stepId, status: 'active', elapsedS, draftText: draft });

// ───────── 판 ─────────

export interface CoursePlate {
  step: CloneStepRow;
  /** 코스 기본은 2단계(뼈대만), 대표 개념이 겹 3 이상이면 3단계(백지). */
  stage: 2 | 3;
  grammar: string;
  payload: T1Payload;
  spec: SpecCard;
  /** 숙련도가 붙는 개념. 사전에 있는 필수 문법이 조각에 하나도 없으면 `null` 이다. */
  conceptId: ConceptId | null;
  secondary: ConceptId[];
  contentHash: string;
  /** 원본 AST. 없으면 채점이 정규식층만 돈다 (04 §4.5). */
  ast: AstLite | null;
}

/** `pickConcept` 는 후보 한 장을 받는다 — 조각에서 그것이 쓰는 필드만 채운다. */
const asCandidate = (concepts: BlockConcept[]): BlockCandidate => ({
  blockId: 0, fileId: 0, path: '', rev: null, name: null, kind: 'segment',
  lineStart: 0, lineEnd: 0, textHash: '', lastCommitAt: null, concepts, lines: [],
});

/**
 * 조각 한 장. 원문은 `clone_step` 에 없다 — 줄 범위만 저장하고 여기서 다시 자른다.
 * `segment()` 가 순수 함수라 같은 원문이면 같은 조각이 나오고, 어긋나면 `text_hash` 가
 * 잡는다(재인제스트로 파일이 바뀐 자리 — 그 조각은 `stale` 이다).
 */
export async function buildCoursePlate(
  deps: CloneDeps,
  step: CloneStepRow,
): Promise<CoursePlate | { stale: true } | null> {
  const block = (await ipc.store.query('block.get', { id: step.block_id }))[0];
  if (block === undefined) return null;
  const grammar = step.grammar ?? 'typescript';
  const piece = (await cutBlock(deps, step.path, grammar, block))[step.part];
  if (piece === undefined || segmentHash(piece.lines) !== step.text_hash) {
    // 재인제스트로 원문이 바뀌었다. 안 끝낸 조각만 무효로 두고 다음 파일로 넘어간다 —
    // 그 자리를 **다시 자르는** 것은 P4(clone-resume-stale)다.
    await ipc.store.exec('clone.step_stale', { runId: step.run_id, fileId: step.file_id });
    return { stale: true };
  }

  const concepts: BlockConcept[] = (await ipc.store.query('clone.segment_concepts', {
    fileId: step.file_id, lineStart: piece.lineStart, lineEnd: piece.lineEnd,
  })).map((c) => ({ conceptId: c.concept_id, layer: c.layer, siteCount: c.n, siteId: c.site_id }));

  const picked = pickConcept(asCandidate(concepts), {
    essential: essentialOf(deps.dict), concepts: deps.dict.concepts,
  });
  const primary = 'reason' in picked ? null : picked.primary;
  const stage = courseStage(primary?.layer ?? 0);

  const kinds = keepKinds(piece.lines, grammar);
  const show2: number[] = [];
  const masked: number[] = [];
  for (const [i, kind] of kinds.entries()) {
    if (kind === null) masked.push(i);
    else show2.push(i);
  }

  const payload: T1Payload = {
    track: 't1',
    kind: 'transcribe',
    blockId: step.block_id,
    file: step.path,
    fn: block.name === '' ? step.path.slice(step.path.lastIndexOf('/') + 1) : `${block.name}()`,
    original: [...piece.lines],
    show2,
    // 코스에는 왜 게이트가 없다 (04 §6 은 큐의 것이다). 페이로드 모양은 지켜야 하므로
    // 일반 템플릿을 채워 둔다 — 화면이 이 판을 열 때 게이트를 띄울지는 P3 이 정한다.
    // 문구는 부를 때 고른다 — 모듈 상수로 얼려 두면 `setLocale()` 보다 먼저 굳는다.
      why: { line: masked[0] ?? 0, q: genericWhyQ(), help: genericWhyHelp(), choices: [] },
  };
  const spec = buildSpec({
    lines: piece.lines,
    grammar,
    concepts,
    dict: deps.dict.concepts,
    path: step.path,
    ...(piece.continued ? { header: (piece.lines[0] ?? '').trim() } : {}),
  });

  return {
    step,
    stage,
    grammar,
    payload,
    spec,
    conceptId: (primary?.conceptId ?? null) as ConceptId | null,
    secondary: 'reason' in picked ? [] : picked.secondary.map((k) => k.conceptId as ConceptId),
    contentHash: contentHash({
      conceptId: primary?.conceptId ?? '',
      kind: 'transcribe',
      siteId: primary?.siteId ?? 0,
      genVersion: GEN_VERSION,
      payload,
    }),
    // 조각은 블록보다 작다 — 나뉜 블록의 `ast_json` 캐시는 이 조각의 AST 가 아니다.
    ast: piece.continued || step.part > 0
      ? await parseSnippet(grammar, piece.lines.join('\n'))
      : await originalAst(step.block_id, grammar, piece.lines.join('\n')),
  };
}

// ───────── 채점 ─────────

export interface CourseAnswer {
  /** 사용자가 친 줄. */
  user: readonly string[];
  peeks: number;
  downgraded: boolean;
  elapsedS: number;
  durationMs: number;
}

export interface CourseGraded {
  result: T1Result;
  /** 개념이 없는 조각은 원장에 남지 않는다 — 그때 `null` 이다. */
  finish: FinishResult | null;
}

/** 카드 한 장을 확보한다. 같은 조각이 큐에도 있으면 `content_hash` 가 같아 그 행을 다시 쓴다. */
async function cardFor(deps: CloneDeps, plate: CoursePlate, conceptId: ConceptId): Promise<number | null> {
  const found = (await ipc.store.query('card.by_hash', {
    repoId: deps.repoId, contentHash: plate.contentHash,
  }))[0];
  if (found !== undefined) return found.id;
  await ipc.store.exec('card.insert', {
    repoId: deps.repoId,
    unitId: null,
    track: 't1',
    kind: 'transcribe',
    conceptId,
    level: plate.stage,
    siteId: null,
    fileId: plate.step.file_id,
    commitId: null,
    payloadJson: JSON.stringify(plate.payload),
    genVersion: GEN_VERSION,
    contentHash: plate.contentHash,
    createdAt: deps.now,
  });
  const rows = await ipc.store.query('card.by_hash', {
    repoId: deps.repoId, contentHash: plate.contentHash,
  });
  const cardId = rows[0]?.id ?? null;
  if (cardId === null) return null;
  for (const secondary of plate.secondary) {
    await ipc.store.exec('block.card_concept_insert', { cardId, conceptId: secondary });
  }
  return cardId;
}

async function masteryOf(conceptId: ConceptId): Promise<Mastery> {
  const rows = await ipc.store.query('review.mastery_get', {
    conceptIds: JSON.stringify([conceptId]),
  });
  const row = rows[0];
  return row === undefined ? emptyMastery(conceptId, null) : fromMasteryRow(row);
}

/**
 * 조각 하나를 채점하고 원장에 남긴다.
 *
 * 판정은 `gradeT1` 그대로다 — 문턱(D83)도 정렬도 AST 승격도 큐와 같은 코드다. 다른 것은
 * 원장에 남기는 모양뿐이고, 그 모양은 이 함수 머리의 셋(세션 `done` · role `manual` ·
 * `card_state.stage` 유지)이 전부다.
 *
 * **겹은 하루 한 번만 오른다** — 그것은 여기서 막는 것이 아니라 `@chickadee/scheduler` 의
 * `dayCeiling`(R1)이 이미 막는다. 같은 개념을 오늘 큐에서 맞히고 코스에서 또 맞혀도
 * `layer_after` 는 한 번만 오른다. 그래서 코스가 따로 중복을 검사하지 않는다.
 */
export async function gradeCourseStep(
  deps: CloneDeps,
  run: CloneRun,
  plate: CoursePlate,
  answer: CourseAnswer,
  scheduler: Scheduler,
): Promise<CourseGraded> {
  const draft = answer.user.join('\n');
  // 답안 AST 는 채점 직전에 한 번 판다 (04 §4.5 · D87). 양쪽이 다 있어야 승격이 돌고,
  // 하나라도 없으면 정규식층만 도는 것이 폴백이다.
  const userAst = await parseSnippet(plate.grammar, draft);
  const result = gradeT1({
    blockId: plate.step.block_id,
    stage: plate.stage,
    original: plate.payload.original,
    user: answer.user,
    grammar: plate.grammar,
    peeks: answer.peeks,
    downgraded: answer.downgraded,
    ...(plate.ast !== null && userAst !== null
      ? {
          ast: {
            original: plate.ast, originalText: plate.payload.original,
            user: userAst, userText: answer.user,
          },
        }
      : { astFallback: 'PARSE_LANG_UNSUPPORTED' as const }),
  });
  if (plate.conceptId === null) {
    // 사전에 있는 필수 문법이 조각에 없으면 겹이 붙을 개념이 없다. 점수는 남기고
    // 원장에는 아무것도 쓰지 않는다 — 개념 없는 원장 행은 만들 수 없다(NOT NULL).
    await ipc.store.exec('clone.step_finish', {
      id: plate.step.id, pct: result.pct, elapsedS: answer.elapsedS,
      draftText: draft, doneAt: deps.now,
    });
    return { result, finish: null };
  }

  const cardId = await cardFor(deps, plate, plate.conceptId);
  if (cardId === null) return { result, finish: null };

  const state = (await ipc.store.query('card.state_get', { cardId }))[0];
  const pos = (await ipc.store.query('clone.next_pos', { sessionId: run.sessionId }))[0]?.n ?? 0;
  await ipc.store.exec('session.item_insert', {
    sessionId: run.sessionId,
    pos,
    cardId,
    conceptId: plate.conceptId,
    track: 't1',
    role: COURSE_ROLE,
    estMin: estMinFor('t1', COURSE_ROLE, state?.est_min_ema ?? null),
    parentItemId: null,
    createdAt: deps.now,
  });
  const itemId = (await ipc.store.query('clone.item_at', {
    sessionId: run.sessionId, pos,
  }))[0]?.id;
  if (itemId === undefined) return { result, finish: null };
  await ipc.store.exec('clone.step_link_item', { id: plate.step.id, sessionItemId: itemId });

  const finish = await finishPlate({
    repoId: deps.repoId,
    sessionId: run.sessionId,
    item: {
      id: itemId, cardId, conceptId: plate.conceptId, track: 't1', role: COURSE_ROLE,
    },
    state: { t1Draft: draft, t1Stage: plate.stage, peeks: answer.peeks },
    mastery: await masteryOf(plate.conceptId),
    scheduler,
    now: deps.now,
    day: deps.day,
    ok: result.verdict === 'advance',
    dunno: false,
    transfer: false,
    detail: toT1Detail(result, { text: '', pick: null }, []),
    durationMs: answer.durationMs,
    elapsedS: answer.elapsedS,
    site: { filePath: plate.step.path, lineNo: plate.step.line_start },
    liferShown: 0,
    grade: {
      pct: result.pct, passPct: result.passPct, assists: answer.peeks,
      downgraded: answer.downgraded, swap: result.rows.some((r) => r.swap === true),
    },
    stage: plate.stage,
    // 큐의 사다리를 코스가 밀지 않는다 — 지금 값 그대로 되쓴다.
    stageAfter: keepCardStage(state?.stage),
    lastPct: result.pct,
  });

  await ipc.store.exec('clone.step_finish', {
    id: plate.step.id, pct: result.pct, elapsedS: answer.elapsedS,
    draftText: draft, doneAt: deps.now,
  });
  return { result, finish };
}
