/**
 * 행 ↔ 객체 (02 §8.1). **테이블마다 `fromXxxRow()` 하나**, ORM 없음.
 *
 * 경계 변환은 전부 여기서만 일어난다 — 다른 층은 `number`·`boolean`·`ConceptId`·`DayKey` 만 본다.
 *   `INTEGER` unix ms  → `number`
 *   `TEXT 'YYYY-MM-DD'`→ `DayKey`  ·  개념 id `TEXT` → `ConceptId`
 *   `INTEGER 0/1`      → `boolean`
 *   `*_json TEXT`      → zod 로 파싱한 객체 (실패는 오류 — 무음 손상 금지)
 *   `REAL`             → `number` 그대로
 *
 * **열 이름 규약**: 입력 행의 키는 DDL 의 열 이름 그대로(snake_case)다. §8.1 의
 * 「Rust 는 `Vec<serde_json::Value>`(열 이름 키)를 돌려준다」가 근거이며, 그래서 변환기가
 * statement 마다가 아니라 **테이블마다** 하나로 성립한다. `SELECT` 를 새로 쓸 때 열에 camelCase
 * 별칭을 붙이면 이 층이 읽지 못한다 — 별칭 없이 고르거나 `SELECT *` 를 쓴다.
 * (예외 하나: `settings` 는 이미 `settings.get_all` 이 별칭을 붙여 두었고 KV 라 행↔객체 1:1 도
 *  아니다. `fromSettingsRows` 만 그 statement 의 행 타입을 받는다.)
 */
import type { Capture, ParamsOf, RowOf } from '@chickadee/ipc-client';
import type { z } from 'zod';

import { ColumnTypeError, type RowId } from './errors.js';
import {
  DAY_KEY_PATTERN, astLiteSchema, cardPayloadSchema, ctxSchema, holeSchema, itemStateSchema,
  lineConceptsSchema, parseJsonColumn, picksSchema, planSchema, reasonsSchema, reviewDetailSchema,
  SETTINGS_KEYS, settingsFieldFor, settingsValueSchema, snapshotSchema, touchedSchema,
  type SettingsField,
} from './schemas.js';
import type {
  Appeal, AstLite, Card, CardKind, CodeLine, Concept, ConceptId, ConceptSite, CommitFile, DayKey,
  DunnoEvent, Gap, Grade, ImportEdge, ItemState, LadderEvent, Layer, Lifer, Mastery, PerfSample,
  PlannedItem, ReviewDetail, ReviewLog, Session, SessionItem, Settings, WhyAnswer,
  CardPayload, Block,
} from './types.js';

/** Rust 가 돌려주는 행 하나 (열 이름 키). */
export type Row = Record<string, unknown>;

// ───────── 브랜드 생성자 ─────────

/** 검사 없는 브랜드 부여. DB 에서 온 값에는 `read().conceptId()` 를 쓴다. */
export const asConceptId = (v: string): ConceptId => v as ConceptId;
export const isDayKey = (v: string): boolean => DAY_KEY_PATTERN.test(v);
/** 'YYYY-MM-DD' 가 아니면 던진다. */
export function asDayKey(v: string): DayKey {
  if (!isDayKey(v)) throw new TypeError("store-sql: DayKey 는 'YYYY-MM-DD' 여야 한다");
  return v as DayKey;
}

// ───────── 열 읽기 ─────────

const TRACKS = ['t0', 't1', 't2', 't3'] as const;
const LAYERS = [0, 1, 2, 3, 4] as const;
const GRADES = [1, 2, 3, 4] as const;
const RUNGS = [1, 2, 3, 4] as const;
const LEVELS = [1, 2, 3] as const;
const ROLES = ['review', 'new', 'retry', 'prereq', 'manual', 'gap'] as const;
const CARD_KINDS = [
  'meaning', 'blank', 'point', 'transcribe', 'placement', 'radius', 'flow', 'direction', 'repair', 'reimpl',
] as const;

/** 오류 메시지에 쓸 행 식별자. 값이 아니라 키만 싣는다 (01 §6). */
function keyOf(row: Row, cols: readonly string[]): RowId {
  const parts: string[] = [];
  for (const c of cols) {
    const v = row[c];
    if (typeof v === 'number' || typeof v === 'string') parts.push(`${c}=${v}`);
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

interface Reader {
  int(c: string): number;
  intOrNull(c: string): number | null;
  real(c: string): number;
  realOrNull(c: string): number | null;
  text(c: string): string;
  textOrNull(c: string): string | null;
  bool(c: string): boolean;
  boolOrNull(c: string): boolean | null;
  oneOf<T extends string>(c: string, allowed: readonly T[]): T;
  intOneOf<T extends number>(c: string, allowed: readonly T[]): T;
  conceptId(c: string): ConceptId;
  conceptIdOrNull(c: string): ConceptId | null;
  dayKey(c: string): DayKey;
  dayKeyOrNull(c: string): DayKey | null;
  json<S extends z.ZodTypeAny>(c: string, schema: S): z.infer<S>;
  jsonOrNull<S extends z.ZodTypeAny>(c: string, schema: S): z.infer<S> | null;
}

function read(table: string, row: Row, keyCols: readonly string[] = ['id']): Reader {
  const rowId = keyOf(row, keyCols);
  const fail = (c: string, expected: string): never => {
    throw new ColumnTypeError(table, c, rowId, expected);
  };
  const present = (c: string): unknown => {
    const v = row[c];
    if (v === undefined) fail(c, '열이 있어야 한다');
    return v;
  };
  const nullable = <T>(c: string, get: (c: string) => T): T | null => (present(c) === null ? null : get(c));

  const int = (c: string): number => {
    const v = present(c);
    return typeof v === 'number' && Number.isSafeInteger(v) ? v : fail(c, '정수(2^53 미만)');
  };
  const real = (c: string): number => {
    const v = present(c);
    return typeof v === 'number' && Number.isFinite(v) ? v : fail(c, '실수');
  };
  const text = (c: string): string => {
    const v = present(c);
    return typeof v === 'string' ? v : fail(c, 'TEXT');
  };
  const bool = (c: string): boolean => {
    const v = present(c);
    if (v === 0) return false;
    if (v === 1) return true;
    return fail(c, '0 또는 1');
  };
  const dayKey = (c: string): DayKey => {
    const v = text(c);
    return isDayKey(v) ? (v as DayKey) : fail(c, "'YYYY-MM-DD'");
  };

  return {
    int, real, text, bool, dayKey,
    intOrNull: (c) => nullable(c, int),
    realOrNull: (c) => nullable(c, real),
    textOrNull: (c) => nullable(c, text),
    boolOrNull: (c) => nullable(c, bool),
    dayKeyOrNull: (c) => nullable(c, dayKey),
    conceptId: (c) => asConceptId(text(c)),
    conceptIdOrNull: (c) => nullable(c, (k) => asConceptId(text(k))),
    oneOf: <T extends string>(c: string, allowed: readonly T[]): T => {
      const v = text(c);
      return (allowed as readonly string[]).includes(v) ? (v as T) : fail(c, `${allowed.join('|')} 중 하나`);
    },
    intOneOf: <T extends number>(c: string, allowed: readonly T[]): T => {
      const v = int(c);
      return (allowed as readonly number[]).includes(v) ? (v as T) : fail(c, `${allowed.join('|')} 중 하나`);
    },
    json: (c, schema) => parseJsonColumn(schema, present(c), table, c, rowId),
    jsonOrNull: (c, schema) => (present(c) === null ? null : parseJsonColumn(schema, row[c], table, c, rowId)),
  };
}

// ───────── 사전 · 개념 ─────────

export function fromConceptRow(row: Row): Concept {
  const r = read('concept', row);
  return {
    id: r.conceptId('id'),
    lang: r.text('lang'),
    nameKo: r.text('name_ko'),
    // 0002 가 더한 열 (D118). `derive.concept_upsert` 가 아직 안 싣고 있어 지금은 늘 NULL 이다 —
    // 사전 영문화가 끝나고 화면이 en 이름을 읽을 때 그 statement 에 `name.en` 을 실으면 찬다.
    nameEn: r.textOrNull('name_en'),
    token: r.textOrNull('token'),
    kind: r.oneOf('kind', ['universal', 'lang'] as const),
    universalId: r.conceptIdOrNull('universal_id'),
    trackDefault: r.oneOf('track_default', TRACKS),
    dictVersionId: r.int('dict_version_id'),
    isRetired: r.bool('is_retired'),
  };
}

export function fromConceptSiteRow(row: Row): ConceptSite {
  const r = read('concept_site', row);
  return {
    id: r.int('id'),
    repoId: r.int('repo_id'),
    fileId: r.int('file_id'),
    conceptId: r.conceptId('concept_id'),
    siteKey: r.text('site_key'),
    lineStart: r.int('line_start'),
    lineEnd: r.int('line_end'),
    colStart: r.int('col_start'),
    colEnd: r.int('col_end'),
    tsNodeKind: r.textOrNull('ts_node_kind'),
    form: r.textOrNull('form'),
    shape: r.text('shape'),
    occurrence: r.int('occurrence'),
    excerpt: r.text('excerpt'),
    picks: r.json('picks_json', picksSchema),
    hole: r.jsonOrNull('hole_json', holeSchema),
    ctx: r.json('ctx_json', ctxSchema),
    lineConcepts: r.json('line_concepts_json', lineConceptsSchema),
    uncoveredRatio: r.real('uncovered_ratio'),
    confidence: r.oneOf('confidence', ['syntactic', 'heuristic'] as const),
    parseQuality: r.oneOf('parse_quality', ['ok', 'poor'] as const),
    isDirty: r.bool('is_dirty'),
    isOversize: r.bool('is_oversize'),
    commitId: r.intOrNull('commit_id'),
    unknownCount: r.int('unknown_count'),
    isAlive: r.bool('is_alive'),
    updatedAt: r.int('updated_at'),
  };
}

// ───────── 숙련도 ─────────

export function fromMasteryRow(row: Row): Mastery {
  const r = read('mastery', row, ['concept_id']);
  return {
    conceptId: r.conceptId('concept_id'),
    state: r.intOneOf('state', [0, 1, 2, 3] as const),
    stability: r.realOrNull('stability'),
    difficulty: r.realOrNull('difficulty'),
    dueAt: r.intOrNull('due_at'),
    lastReviewAt: r.intOrNull('last_review_at'),
    reps: r.int('reps'),
    lapses: r.int('lapses'),
    layer: r.intOneOf<Layer>('layer', LAYERS),
    dayKey: r.dayKeyOrNull('day_key'),
    dayStartLayer: r.intOneOf<Layer>('day_start_layer', LAYERS),
    dayCeiling: r.intOneOf<Layer>('day_ceiling', LAYERS),
    firstOkAt: r.intOrNull('first_ok_at'),
    lastOkDay: r.dayKeyOrNull('last_ok_day'),
    dunnoTotal: r.int('dunno_total'),
    transferFrom: r.conceptIdOrNull('transfer_from'),
    appliedLogId: r.int('applied_log_id'),
    updatedAt: r.int('updated_at'),
  };
}

// ───────── 카드 ─────────

export function fromCardRow(row: Row): Card {
  const r = read('card', row);
  return {
    id: r.int('id'),
    repoId: r.int('repo_id'),
    unitId: r.intOrNull('unit_id'),
    track: r.oneOf('track', TRACKS),
    kind: r.oneOf<CardKind>('kind', CARD_KINDS),
    conceptId: r.conceptId('concept_id'),
    level: r.intOneOf('level', LEVELS),
    siteId: r.intOrNull('site_id'),
    fileId: r.intOrNull('file_id'),
    commitId: r.intOrNull('commit_id'),
    // zod 출력의 `{ x?: T | undefined }` → §8.2 의 `{ x?: T }`. 값은 같고 선택 필드 표기만 다르다
    // (`exactOptionalPropertyTypes` — `schemas.ts` 머리말). 넓히는 방향이 아니라 좁히는 캐스트다.
    payload: r.json('payload_json', cardPayloadSchema) as CardPayload,
    snapshot: r.jsonOrNull('snapshot_json', snapshotSchema) as CodeLine[] | null,
    genVersion: r.int('gen_version'),
    contentHash: r.text('content_hash'),
    createdAt: r.int('created_at'),
    retiredAt: r.intOrNull('retired_at'),
  };
}

// ───────── 세션 · 큐 ─────────

export function fromSessionRow(row: Row): Session {
  const r = read('session', row);
  return {
    id: r.int('id'),
    repoId: r.int('repo_id'),
    dayKey: r.dayKey('day_key'),
    seqInDay: r.int('seq_in_day'),
    startedAt: r.int('started_at'),
    endedAt: r.intOrNull('ended_at'),
    budgetMin: r.real('budget_min'),
    plannedMin: r.real('planned_min'),
    elapsedS: r.int('elapsed_s'),
    status: r.oneOf('status', ['active', 'paused', 'done', 'abandoned'] as const),
    plan: r.json('plan_json', planSchema) as PlannedItem[],
    liferShown: r.int('lifer_shown'),
  };
}

export function fromSessionItemRow(row: Row): SessionItem {
  const r = read('session_item', row);
  return {
    id: r.int('id'),
    sessionId: r.int('session_id'),
    pos: r.int('pos'),
    cardId: r.int('card_id'),
    conceptId: r.conceptId('concept_id'),
    track: r.oneOf('track', TRACKS),
    role: r.oneOf('role', ROLES),
    estMin: r.real('est_min'),
    parentItemId: r.intOrNull('parent_item_id'),
    status: r.oneOf('status', ['pending', 'active', 'done', 'skipped', 'removed'] as const),
    elapsedS: r.int('elapsed_s'),
    state: r.jsonOrNull('state_json', itemStateSchema) as ItemState | null,
    reviewLogId: r.intOrNull('review_log_id'),
    createdAt: r.int('created_at'),
  };
}

// ───────── 원장 ─────────

export function fromReviewLogRow(row: Row): ReviewLog {
  const r = read('review_log', row);
  return {
    id: r.int('id'),
    sessionId: r.int('session_id'),
    sessionItemId: r.int('session_item_id'),
    cardId: r.int('card_id'),
    conceptId: r.conceptId('concept_id'),
    track: r.oneOf('track', TRACKS),
    role: r.oneOf('role', ROLES),
    reviewedAt: r.int('reviewed_at'),
    dayKey: r.dayKey('day_key'),
    grade: r.intOneOf<Grade>('grade', GRADES),
    ok: r.bool('ok'),
    dunno: r.bool('dunno'),
    early: r.bool('early'),
    elapsedDays: r.real('elapsed_days'),
    scheduledDays: r.real('scheduled_days'),
    rAtReview: r.realOrNull('r_at_review'),
    layerBefore: r.intOneOf<Layer>('layer_before', LAYERS),
    layerAfter: r.intOneOf<Layer>('layer_after', LAYERS),
    sBefore: r.realOrNull('s_before'),
    dBefore: r.realOrNull('d_before'),
    sAfter: r.real('s_after'),
    dAfter: r.real('d_after'),
    dueAfter: r.int('due_after'),
    paramsId: r.int('params_id'),
    durationMs: r.int('duration_ms'),
    detail: r.json('detail_json', reviewDetailSchema) as ReviewDetail,
  };
}

export function fromDunnoEventRow(row: Row): DunnoEvent {
  const r = read('dunno_event', row);
  return {
    id: r.int('id'),
    sessionItemId: r.int('session_item_id'),
    reviewLogId: r.intOrNull('review_log_id'),
    cardId: r.int('card_id'),
    conceptId: r.conceptId('concept_id'),
    at: r.int('at'),
    answeredBefore: r.bool('answered_before'),
    wasCorrect: r.boolOrNull('was_correct'),
    maxRung: r.intOneOf('max_rung', RUNGS),
    layerBefore: r.intOneOf<Layer>('layer_before', LAYERS),
    layerAfter: r.intOneOf<Layer>('layer_after', LAYERS),
  };
}

export function fromLadderEventRow(row: Row): LadderEvent {
  const r = read('ladder_event', row);
  return {
    id: r.int('id'),
    dunnoEventId: r.int('dunno_event_id'),
    rung: r.intOneOf('rung', RUNGS),
    action: r.oneOf('action', ['open', 'jump', 'back', 'return', 'prompt_built', 'copied'] as const),
    targetCardId: r.intOrNull('target_card_id'),
    at: r.int('at'),
  };
}

export function fromAppealRow(row: Row): Appeal {
  const r = read('appeal', row);
  return {
    id: r.int('id'),
    reviewLogId: r.int('review_log_id'),
    cardId: r.int('card_id'),
    track: r.oneOf('track', ['t1', 't2'] as const),
    lineNo: r.intOrNull('line_no'),
    originalText: r.textOrNull('original_text'),
    userText: r.textOrNull('user_text'),
    normOriginal: r.textOrNull('norm_original'),
    normUser: r.textOrNull('norm_user'),
    autoVerdict: r.oneOf('auto_verdict', ['differ', 'missing', 'extra', 'wrong-pick'] as const),
    autoReason: r.textOrNull('auto_reason'),
    reasons: r.jsonOrNull('reasons_json', reasonsSchema),
    patternKey: r.textOrNull('pattern_key'),
    engineVersion: r.textOrNull('engine_version'),
    dictVersion: r.textOrNull('dict_version'),
    status: r.oneOf('status', ['open', 'accepted', 'rejected'] as const),
    createdAt: r.int('created_at'),
    resolvedAt: r.intOrNull('resolved_at'),
    note: r.textOrNull('note'),
  };
}

export function fromWhyAnswerRow(row: Row): WhyAnswer {
  const r = read('why_answer', row);
  return {
    id: r.int('id'),
    reviewLogId: r.int('review_log_id'),
    cardId: r.int('card_id'),
    blockId: r.intOrNull('block_id'),
    lineNo: r.intOrNull('line_no'),
    questionId: r.text('question_id'),
    text: r.text('text'),
    pick: r.intOrNull('pick'),
    pickOk: r.boolOrNull('pick_ok'),
    createdAt: r.int('created_at'),
  };
}

export function fromLiferRow(row: Row): Lifer {
  const r = read('lifer', row);
  return {
    id: r.int('id'),
    conceptId: r.conceptId('concept_id'),
    cardId: r.int('card_id'),
    repoId: r.int('repo_id'),
    filePath: r.text('file_path'),
    lineNo: r.intOrNull('line_no'),
    at: r.int('at'),
    shownAt: r.intOrNull('shown_at'),
  };
}

export function fromPerfSampleRow(row: Row): PerfSample {
  const r = read('perf_sample', row);
  return { id: r.int('id'), kind: r.text('kind'), ms: r.real('ms'), n: r.int('n'), at: r.int('at') };
}

export function fromGapRow(row: Row): Gap {
  const r = read('gap', row, ['repo_id', 'concept_id']);
  return {
    repoId: r.int('repo_id'),
    conceptId: r.conceptId('concept_id'),
    siteCount: r.int('site_count'),
    minUnknown: r.int('min_unknown'),
    bestSiteId: r.intOrNull('best_site_id'),
    reason: r.textOrNull('reason'),
    status: r.oneOf('status', ['open', 'card_made', 'dismissed'] as const),
    computedAt: r.int('computed_at'),
  };
}

// ───────── 인제스트 산출 ─────────

export function fromCommitFileRow(row: Row): CommitFile {
  const r = read('commit_file', row, ['commit_id', 'path']);
  return {
    commitId: r.int('commit_id'),
    path: r.text('path'),
    oldPath: r.textOrNull('old_path'),
    status: r.oneOf('status', ['A', 'M', 'D', 'R'] as const),
    additions: r.int('additions'),
    deletions: r.int('deletions'),
    touched: r.json('touched_json', touchedSchema),
  };
}

export function fromImportEdgeRow(row: Row): ImportEdge {
  const r = read('import_edge', row, ['from_file_id', 'to_file_id', 'kind']);
  return {
    repoId: r.int('repo_id'),
    fromFileId: r.int('from_file_id'),
    toFileId: r.int('to_file_id'),
    kind: r.oneOf('kind', ['static', 'type', 'dynamic', 'http'] as const),
    confidence: r.oneOf('confidence', ['syntactic', 'heuristic'] as const),
  };
}

export function fromBlockRow(row: Row): Block {
  const r = read('block', row);
  return {
    id: r.int('id'),
    repoId: r.int('repo_id'),
    fileId: r.int('file_id'),
    rev: r.textOrNull('rev'),
    name: r.text('name'),
    kind: r.text('kind'),
    lineStart: r.int('line_start'),
    lineEnd: r.int('line_end'),
    textHash: r.text('text_hash'),
    ast: r.jsonOrNull('ast_json', astLiteSchema) as AstLite | null,
    isAlive: r.bool('is_alive'),
    updatedAt: r.int('updated_at'),
  };
}

/**
 * `capture` 행 → 01 §3.1 `Capture`.
 * `capture.id`·`capture.file_id` 는 `Capture` 에 대응 필드가 없다(호출자가 `fileId` 로 묶어 읽으므로).
 */
export function fromCaptureRow(row: Row): Capture {
  const r = read('capture', row);
  return {
    queryId: r.text('query_id'),
    matchId: r.int('match_id'),
    patternIndex: r.int('pattern_index'),
    name: r.text('name'),
    form: r.textOrNull('form'),
    nodeKind: r.text('node_kind'),
    inError: r.bool('in_error'),
    startByte: r.int('start_byte'),
    endByte: r.int('end_byte'),
    startLine: r.int('start_line'),
    endLine: r.int('end_line'),
    startCol: r.int('start_col'),
    endCol: r.int('end_col'),
    excerpt: r.text('excerpt'),
  };
}

// ───────── settings (KV — 행↔객체 1:1 의 유일한 예외) ─────────

/**
 * `settings.get_all` 의 행들 → `Settings` 조각.
 *
 * 모르는 키는 건너뛴다(앞선 버전이 쓴 키를 오류로 만들지 않는다). 아는 키의 값이 스키마와 다르면
 * 던진다(무음 손상 금지). `tz` 는 첫 실행에 OS 값을 저장하므로(02 §5.6) 이 층에 기본값이 없다 —
 * 호출자가 자기 기본값과 합친다.
 */
export function fromSettingsRows(rows: readonly RowOf<'settings.get_all'>[]): Partial<Settings> {
  const out: Record<string, unknown> = {};
  for (const row of rows) {
    const field = settingsFieldFor(row.key);
    if (field === undefined) continue;
    out[field] = parseJsonColumn(settingsValueSchema(field), row.value_json, 'settings', 'value_json', `key=${row.key}`);
  }
  // 키마다 `settingsSchema.shape[field]` 로 검증했으므로 필드 타입은 이미 맞다.
  return out as Partial<Settings>;
}

// ───────── 쓰기: 객체 → statement 파라미터 ─────────
//
// M0/M1 이 쓰는 테이블만. 호출자가 파라미터를 손으로 짜지 않게 하려는 것이므로 반환 타입은
// 언제나 카탈로그의 `ParamsOf<…>` 그대로다.
//
// 불리언에 관하여: 카탈로그의 `@params` 가 `isDirty: boolean`·`truncated: boolean` 로 선언되어 있고
// (Rust rusqlite 가 bool 을 0/1 로 바인딩한다) 그 계약을 지킨다. SQLite 드라이버를 TS 에서 직접
// 쓰는 자리(테스트·도구)는 `toSqliteBindings()` 로 0/1 로 낮춘다.

/** DDL 파생 입력 타입 — `repo` 는 §8.2 에 인터페이스가 없다. */
export interface RepoWrite {
  rootPath: string; name: string; defaultBranch: string | null; headSha: string | null;
  primaryLang: string | null; fingerprint: string; addedAt: number;
}
export function toRepoParams(v: RepoWrite): ParamsOf<'repo.insert'> {
  return {
    rootPath: v.rootPath, name: v.name, defaultBranch: v.defaultBranch, headSha: v.headSha,
    primaryLang: v.primaryLang, fingerprint: v.fingerprint, addedAt: v.addedAt,
  };
}

/** DDL 파생 입력 타입 — `file` 은 §8.2 에 인터페이스가 없다. */
export interface FileWrite {
  repoId: number; path: string; lang: string | null; grammar: string | null;
  lineCount: number; byteSize: number; contentHash: string | null; headOid: string | null;
  isDirty: boolean; parseQuality: 'ok' | 'poor' | null; skipReason: string | null; updatedAt: number;
}
export function toFileParams(v: FileWrite): ParamsOf<'facts.file_upsert'> {
  return {
    repoId: v.repoId, path: v.path, lang: v.lang, grammar: v.grammar,
    lineCount: v.lineCount, byteSize: v.byteSize, contentHash: v.contentHash, headOid: v.headOid,
    isDirty: v.isDirty, parseQuality: v.parseQuality, skipReason: v.skipReason, updatedAt: v.updatedAt,
  };
}

/** `Capture`(01 §3.1) + 리포·경로 → `capture` 행. 파일 id 는 statement 가 찾는다 (D65). */
export function toCaptureParams(repoId: number, path: string, c: Capture): ParamsOf<'facts.capture_insert'> {
  return {
    repoId, path,
    queryId: c.queryId, matchId: c.matchId, patternIndex: c.patternIndex, name: c.name,
    form: c.form, nodeKind: c.nodeKind, inError: c.inError,
    startByte: c.startByte, endByte: c.endByte, startLine: c.startLine, endLine: c.endLine,
    startCol: c.startCol, endCol: c.endCol, excerpt: c.excerpt,
  };
}

/** DDL 파생 입력 타입 — `git_commit` 은 §8.2 에 인터페이스가 없다. 파생 열(`kind`·`author_matched`)은 TS 파생 층이 따로 쓴다. */
export interface GitCommitWrite {
  repoId: number; sha: string; parentSha: string | null; parentCount: number; authoredAt: number;
  authorEmail: string | null; authorName: string | null; message: string; truncated: boolean;
  filesN: number; insertions: number; deletions: number;
}
export function toGitCommitParams(v: GitCommitWrite): ParamsOf<'facts.commit_insert'> {
  return {
    repoId: v.repoId, sha: v.sha, parentSha: v.parentSha, parentCount: v.parentCount,
    authoredAt: v.authoredAt, authorEmail: v.authorEmail, authorName: v.authorName,
    message: v.message, truncated: v.truncated, filesN: v.filesN,
    insertions: v.insertions, deletions: v.deletions,
  };
}

/** §8.2 `CommitFile` → `commit_file` 행. `touched` 가 여기서 JSON 텍스트가 된다. */
export function toCommitFileParams(repoId: number, sha: string, v: CommitFile): ParamsOf<'facts.commit_file_insert'> {
  return {
    repoId, sha, path: v.path, oldPath: v.oldPath, status: v.status,
    additions: v.additions, deletions: v.deletions, touchedJson: JSON.stringify(v.touched),
  };
}

/** DDL 파생 입력 타입 — `ingest_run` 은 §8.2 에 인터페이스가 없다. */
export interface IngestRunStartWrite {
  repoId: number; startedAt: number; mode: 'full' | 'incremental'; headSha: string | null; appVersion: string | null;
}
export function toIngestRunStartParams(v: IngestRunStartWrite): ParamsOf<'facts.run_start'> {
  return { repoId: v.repoId, startedAt: v.startedAt, mode: v.mode, headSha: v.headSha, appVersion: v.appVersion };
}

export interface IngestRunFinishWrite {
  id: number; finishedAt: number; status: 'done' | 'failed' | 'cancelled';
  filesN: number; sitesN: number; capturesN: number; commitsN: number; warningsN: number;
  peakRssMb: number | null; escalatedToFull: boolean;
  /** `{ grammar: version }` — 여기서 JSON 텍스트가 된다. */
  grammarVersions: Record<string, string> | null;
  queryHash: string | null; dictVersion: string | null; dictSchema: number | null;
  genVersion: number | null; fingerprint: string | null; error: string | null;
}
export function toIngestRunFinishParams(v: IngestRunFinishWrite): ParamsOf<'facts.run_finish'> {
  return {
    id: v.id, finishedAt: v.finishedAt, status: v.status,
    filesN: v.filesN, sitesN: v.sitesN, capturesN: v.capturesN, commitsN: v.commitsN, warningsN: v.warningsN,
    peakRssMb: v.peakRssMb, escalatedToFull: v.escalatedToFull,
    grammarVersionsJson: v.grammarVersions === null ? null : JSON.stringify(v.grammarVersions),
    queryHash: v.queryHash, dictVersion: v.dictVersion, dictSchema: v.dictSchema,
    genVersion: v.genVersion, fingerprint: v.fingerprint, error: v.error,
  };
}

/** `Settings` 조각 → `settings.set` 파라미터 여러 개. 키 하나가 행 하나다. */
export function toSettingsParams(patch: Partial<Settings>, updatedAt: number): ParamsOf<'settings.set'>[] {
  const out: ParamsOf<'settings.set'>[] = [];
  for (const field of Object.keys(SETTINGS_KEYS) as SettingsField[]) {
    const value = patch[field];
    if (value === undefined) continue;
    out.push({ key: SETTINGS_KEYS[field], valueJson: JSON.stringify(value), updatedAt });
  }
  return out;
}

/**
 * 불리언을 0/1 로 낮춘 바인딩. 앱 경로에서는 필요 없다 — Rust 가 bool 을 그대로 바인딩한다.
 * SQLite 드라이버를 TS 에서 직접 잡는 자리(왕복 테스트·도구)에서만 쓴다.
 */
export function toSqliteBindings(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'boolean') out[k] = v ? 1 : 0;
    // 배열·객체는 JSON 본문 그대로 — statement 가 `json_each` 로 푼다. Rust 의
    // `to_sql` 이 하는 것과 같은 변환이라, 같은 statement 가 양쪽에서 같게 돈다.
    else if (v !== null && typeof v === 'object') out[k] = JSON.stringify(v);
    else if (v === undefined) out[k] = null;
    else out[k] = v;
  }
  return out;
}
