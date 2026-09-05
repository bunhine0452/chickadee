/**
 * 왕복 테스트 — 진짜 SQLite 로 한다.
 *
 * 인메모리 DB 에 `migrations/*.sql` 을 순서대로 적용하고, 테이블마다 값이 다 찬 행을 넣고,
 * `SELECT *` 로 도로 읽어 `fromXxxRow()` 를 태운 뒤 원본 객체와 깊은 비교를 한다.
 * 이게 증명하는 것: DDL 의 열 이름·타입과 §8.2 의 필드가 실제로 맞물린다는 것. 손으로 쓴 목 행으로는
 * 열 이름을 틀려도 통과해 버린다.
 *
 * `toXxxParams()` 가 있는 테이블은 카탈로그의 진짜 statement 로 넣는다 — 파라미터 이름까지 검증된다.
 * (테스트 안의 손 SQL 은 규칙 위반이 아니다. SQL 금지는 Rust 소스에 대한 규칙이다.)
 */
import { createRequire } from 'node:module';

import { beforeAll, describe, expect, test } from 'vitest';

import { migrations, statements } from './catalog.js';
import { SCHEMA_VERSION } from './index.js';
import { ColumnTypeError, JsonColumnError } from './errors.js';
import { SETTINGS_KEYS } from './schemas.js';
import {
  asConceptId, asDayKey, fromAppealRow, fromBlockRow, fromCaptureRow, fromCardRow, fromCommitFileRow,
  fromConceptRow, fromConceptSiteRow, fromDunnoEventRow, fromGapRow, fromImportEdgeRow,
  fromLadderEventRow, fromLiferRow, fromMasteryRow, fromPerfSampleRow, fromReviewLogRow,
  fromSessionItemRow, fromSessionRow, fromSettingsRows, fromWhyAnswerRow,
  toCaptureParams, toCommitFileParams, toFileParams, toGitCommitParams, toIngestRunStartParams,
  toRepoParams, toSettingsParams, toSqliteBindings,
  type Row,
} from './rows.js';
import type {
  Appeal, Block, Capture, Card, CommitFile, Concept, ConceptSite, ConceptId, DayKey, DunnoEvent,
  Gap, ImportEdge, LadderEvent, Lifer, Mastery, PerfSample, ReviewLog, Session, SessionItem,
  Settings, WhyAnswer,
} from './types.js';

// better-sqlite3 은 CJS(`export =`) 라 esModuleInterop 이 꺼진 이 tsconfig 에서 default import 가 안 된다.
// 타입만 가져오고 값은 require 로 잡는다 (테스트 전용 의존).
import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

const T = 1_767_225_600_000; // 고정 시각 (unix ms)

// ───────── DB ─────────

function open(): SqliteDb {
  const db = new Database(':memory:');
  for (const m of [...migrations].sort((a, b) => a.version - b.version)) db.exec(m.sql);
  db.pragma('foreign_keys = ON'); // 01 §7 의 연결 PRAGMA
  return db;
}

function insert(db: SqliteDb, table: string, row: Record<string, unknown>): void {
  const cols = Object.keys(row);
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((c) => `:${c}`).join(', ')})`;
  db.prepare(sql).run(toSqliteBindings(row));
}

function one(db: SqliteDb, table: string, where: string): Row {
  const row = db.prepare(`SELECT * FROM ${table} WHERE ${where}`).get();
  if (row === undefined || row === null) throw new Error(`${table}: ${where} 인 행이 없다`);
  return row as Row;
}

const json = (v: unknown): string => JSON.stringify(v);

// ───────── 기대값 (§8.2 객체) ─────────

const CID = {
  universal: asConceptId('common/optional-chaining'),
  ts: asConceptId('ts/optional-chaining'),
  nullish: asConceptId('ts/nullish-coalescing'),
};
const DAY: DayKey = asDayKey('2026-01-01');

const CONCEPT: Concept = {
  id: CID.ts, lang: 'ts', nameKo: '옵셔널 체이닝', nameEn: 'Optional chaining', token: '?.',
  kind: 'lang', universalId: CID.universal, trackDefault: 't0', dictVersionId: 1, isRetired: false,
};

const SITE: ConceptSite = {
  id: 1, repoId: 1, fileId: 1, conceptId: CID.ts, siteKey: 'a1b2c3',
  lineStart: 42, lineEnd: 42, colStart: 10, colEnd: 34, tsNodeKind: 'optional_chain',
  form: 'member', shape: 'a?.b', occurrence: 0,
  excerpt: "const nick = res.user?.profile?.nickname ?? '손님'",
  picks: { 1: 'res.user', 3: 'nickname' }, hole: '?.', ctx: { fallback: "'손님'" },
  lineConcepts: [CID.nullish], uncoveredRatio: 0.25,
  confidence: 'heuristic', parseQuality: 'ok', isDirty: true, isOversize: false,
  commitId: 1, unknownCount: 2, isAlive: true, updatedAt: T,
};

const MASTERY: Mastery = {
  conceptId: CID.ts, state: 2, stability: 12.5, difficulty: 4.25,
  dueAt: T + 86_400_000, lastReviewAt: T, reps: 7, lapses: 1,
  layer: 3, dayKey: DAY, dayStartLayer: 2, dayCeiling: 4,
  firstOkAt: T - 1000, lastOkDay: DAY, dunnoTotal: 2, transferFrom: CID.universal,
  appliedLogId: 3, updatedAt: T,
};

const CARD_T0: Card = {
  id: 1, repoId: 1, unitId: 1, track: 't0', kind: 'meaning', conceptId: CID.ts,
  level: 2, siteId: 1, fileId: 1, commitId: 1,
  payload: {
    track: 't0', kind: 'meaning', file: 'src/features/auth/useLogin.ts', focus: 42,
    lines: [
      { n: 41, t: 'if (!res.ok) return null' },
      { n: 42, seg: [{ t: 'const nick = ' }, { t: 'res.user', pick: 1 }, { hole: true }, { t: 'nickname', pick: 3 }], target: true },
    ],
    q: '42행의 <code>?.</code> 는 무엇을 합니까?', hint: '점선을 고르세요.',
    options: [{ t: '앞이 없으면 멈춘다' }, { t: '뒤를 문자열로 바꾼다', mono: true }],
    answer: 0,
    why: [null, { t: '<code>??</code> 는 채우는 기호입니다.', edge: { h: '?? 와 || 의 차이', code: ['0 ?? 10', '0 || 10'] } }],
    ok: '없으면 멈춥니다.', rule: '<code>.</code> 은 터지고 <code>?.</code> 은 멈춘다.',
    result: { label: 'res.user 가 없을 때', value: "'손님'", note: '?. 가 멈추고 ?? 가 채움' },
    dict: [{ k: '한 줄로', t: '<code>a?.b</code>' }, { k: '42행 안에서', steps: ['res.user 를 읽는다', '.profile 을 읽는다'] }],
    prereq: [{ conceptId: CID.nullish, n: '널 병합 <code>??</code>' }],
    uses: [{ siteId: 1, f: 'src/features/cart/CartSheet.tsx', l: 18 }],
    promptLines: ['const nick = res.user?.profile?.nickname'],
    payoff: '터질 자리를 두 글자가 막는다.', bridge: '아래층에서 돌아오면 이어봅니다.',
    transferFrom: CID.universal, previewSiteId: 1,
  },
  snapshot: [{ n: 42, t: "const nick = res.user?.profile?.nickname ?? '손님'", target: true }],
  genVersion: 1, contentHash: 'hash-t0', createdAt: T, retiredAt: null, stageNo: null,
};

const CARD_T1: Card = {
  id: 2, repoId: 1, unitId: null, track: 't1', kind: 'transcribe', conceptId: CID.ts,
  level: 1, siteId: null, fileId: 1, commitId: null,
  payload: {
    track: 't1', kind: 'transcribe', blockId: 9, file: 'src/features/auth/useLogin.ts', fn: 'useLogin',
    original: ['export function useLogin() {', '  return null', '}'], show2: [0, 2],
    why: {
      line: 1, q: '이 줄이 없으면 무엇이 달라질까요?', help: '반환값을 보세요.',
      choices: [{ t: '아무것도 안 돌아온다', ok: true, fb: '맞습니다' }, { t: '터진다', ok: false, fb: '터지지는 않아요' }],
    },
  },
  snapshot: null, genVersion: 1, contentHash: 'hash-t1', createdAt: T, retiredAt: T + 10, stageNo: null,
};

const CARD_T2: Card = {
  id: 3, repoId: 1, unitId: 1, track: 't2', kind: 'placement', conceptId: CID.ts,
  level: 3, siteId: null, fileId: null, commitId: 1,
  payload: {
    track: 't2', kind: 'placement', q: '이 커밋은 어느 파일을 건드렸을까요?', hint: '반지름을 보세요.',
    bands: [{ l: '핵심', s: '0-1' }], files: [{ p: 'src/a.ts', r: 0 }, { p: 'src/b.ts', r: 1, isNew: true }],
    edges: [['src/a.ts', 'src/b.ts', 'static']],
    commit: { h: 'abc1234', d: '2026-01-01', m: 'fix: 로그인 응답 방어', n: '2' },
    core: { 'src/a.ts': ['+12', '-3'] }, sec: { 'src/b.ts': ['+1', '-0'] },
    trap: { 'src/c.ts': '이 커밋과 무관' }, hints: ['라우터부터 보세요'],
  },
  snapshot: null, genVersion: 2, contentHash: 'hash-t2', createdAt: T, retiredAt: null, stageNo: null,
};

/** 코스 선택형 (D164) — `track` 열은 t3, `stage_no` 가 단이다. */
const CARD_T3: Card = {
  id: 4, repoId: 1, unitId: 1, track: 't3', kind: 'cut', conceptId: CID.ts,
  level: 1, siteId: null, fileId: 1, commitId: null,
  payload: {
    track: 't3', kind: 'cut', stage: 3, file: 'src/features/auth/useLogin.ts', focus: 41,
    lines: [{ n: 41, t: 'if (!res.ok) return null', target: true }, { n: 42, t: 'const nick = 1' }],
    q: '41행을 지우면 무엇이 달라질까요?', hint: '그 줄이 막던 입력을 생각해 보세요.',
    options: [{ t: '실패 응답에서도 아래 줄이 돈다' }, { t: '아무것도 달라지지 않는다' }],
    answer: 0, why: [null, { t: '그 줄은 실패 응답을 막고 있었습니다.' }],
    ok: '그 줄이 실패를 걸러 냅니다.', rule: '가드는 지우면 그 입력이 통과한다.',
    promptLines: ['if (!res.ok) return null', 'const nick = 1'],
    reason: { q: '왜 그런가요?', options: [{ t: '가드라서' }, { t: '주석이라서' }], answer: 0, why: [null, { t: '주석이 아닙니다.' }] },
  },
  snapshot: null, genVersion: 1, contentHash: 'hash-t3', createdAt: T, retiredAt: null, stageNo: 3,
};

const SESSION: Session = {
  id: 1, repoId: 1, dayKey: DAY, seqInDay: 1, startedAt: T, endedAt: T + 900_000,
  budgetMin: 15, plannedMin: 14.5, elapsedS: 870, status: 'done',
  plan: [
    { cardId: 1, conceptId: CID.ts, track: 't0', role: 'review', estMin: 0.5 },
    { cardId: 2, conceptId: CID.ts, track: 't1', role: 'new', estMin: 9 },
  ],
  liferShown: 1,
};

const SESSION_ITEM: SessionItem = {
  id: 1, sessionId: 1, pos: 0, cardId: 1, conceptId: CID.ts, track: 't0',
  role: 'review', estMin: 0.5, parentItemId: null, status: 'done', elapsedS: 42,
  state: {
    sel: 1, answered: true, dunno: true, rung: 3, jumped: true, returned: true,
    prereqDone: [CID.nullish], t1Draft: 'export function', t1Stage: 2, peeks: 1,
    t2Sel: ['src/a.ts'], hints: 2,
  },
  reviewLogId: 1, createdAt: T,
};

const REVIEW_LOG_BASE = {
  sessionId: 1, sessionItemId: 1, cardId: 1, conceptId: CID.ts, track: 't0' as const,
  role: 'review' as const, reviewedAt: T, dayKey: DAY, grade: 3 as const, ok: true, dunno: false, early: false,
  elapsedDays: 3.5, scheduledDays: 4, rAtReview: 0.87, layerBefore: 2 as const, layerAfter: 3 as const,
  sBefore: 9.5, dBefore: 4.1, sAfter: 12.5, dAfter: 4.25, dueAfter: T + 86_400_000,
  paramsId: 1, durationMs: 4200,
};
const REVIEW_LOGS: ReviewLog[] = [
  { id: 1, ...REVIEW_LOG_BASE, detail: { track: 't0', sel: 1, answer: 1, kind: 'meaning' } },
  {
    id: 2, ...REVIEW_LOG_BASE, track: 't1', detail: {
      track: 't1', meaning: 0.92, total: 12, exact: 9, equiv: 2, differ: 1, missing: 0, extra: 0,
      peeks: 1, downgraded: false, stageBefore: 1, stageAfter: 2, appealedLines: [7],
      whyText: '반환값이 사라집니다', whyPick: 0,
    },
  },
  {
    id: 3, ...REVIEW_LOG_BASE, track: 't2', detail: {
      track: 't2', pct: 88.5, found: ['src/a.ts'], missed: [], wrong: ['src/c.ts'], bonus: ['src/b.ts'],
      hints: 1, more: true,
    },
  },
];

const DUNNO: DunnoEvent = {
  id: 1, sessionItemId: 1, reviewLogId: 1, cardId: 1, conceptId: CID.ts, at: T,
  answeredBefore: true, wasCorrect: false, maxRung: 3, layerBefore: 2, layerAfter: 1,
};
const LADDER: LadderEvent = { id: 1, dunnoEventId: 1, rung: 2, action: 'jump', targetCardId: 2, at: T };
const APPEAL: Appeal = {
  id: 1, reviewLogId: 1, cardId: 1, track: 't1', lineNo: 7, originalText: 'const a = 1',
  userText: 'const a=1', normOriginal: 'const a=1', normUser: 'const a=1',
  autoVerdict: 'differ', autoReason: 'whitespace', reasons: ['공백만 다름', '동치'],
  patternKey: 'ws-only', engineVersion: '0.1.0', dictVersion: 'ts@1', status: 'open',
  createdAt: T, resolvedAt: null, note: null,
};
const WHY: WhyAnswer = {
  id: 1, reviewLogId: 1, cardId: 1, blockId: 1, lineNo: 7,
  questionId: 'why_gate:ts/optional-chaining', text: '값이 없을 수 있어서', pick: 0, pickOk: true, createdAt: T,
};
const LIFER: Lifer = {
  id: 1, conceptId: CID.ts, cardId: 1, repoId: 1, filePath: 'src/features/auth/useLogin.ts',
  lineNo: 42, at: T, shownAt: null,
};
const GAP: Gap = {
  repoId: 1, conceptId: CID.nullish, siteCount: 11, minUnknown: 0, bestSiteId: 1,
  reason: 'no-plate', status: 'open', computedAt: T,
};
const PERF: PerfSample = { id: 1, kind: 'ingest.file_p95', ms: 12.5, n: 300, at: T };
const BLOCK: Block = {
  id: 1, repoId: 1, fileId: 1, rev: null, name: 'useLogin', kind: 'function',
  lineStart: 40, lineEnd: 50, textHash: 'blob-1',
  ast: {
    kind: 'function_declaration', named: true, start: 0, end: 120,
    children: [{ kind: 'identifier', named: true, start: 9, end: 17, text: 'useLogin', children: [] }],
  },
  isAlive: true, updatedAt: T,
};
const EDGE: ImportEdge = { repoId: 1, fromFileId: 1, toFileId: 2, kind: 'static', confidence: 'syntactic' };
const CAPTURE: Capture = {
  queryId: 'ts/optional-chaining', matchId: 3, patternIndex: 0, name: 'pick.1', form: 'member',
  nodeKind: 'member_expression', inError: false,
  startByte: 100, endByte: 108, startLine: 42, endLine: 42, startCol: 13, endCol: 21,
  excerpt: 'res.user',
};
const COMMIT_FILE: CommitFile = {
  commitId: 1, path: 'src/a.ts', oldPath: 'src/old.ts', status: 'R',
  additions: 12, deletions: 3, touched: [[10, 14], [30, 31]],
};
const SETTINGS: Settings = {
  budgetMin: 15, tz: 'Asia/Seoul', rolloverHour: 4, desiredRetention: 0.9, newPerDay: 2,
  t1PerWeek: 2, newcomerFlag: 'suspect', theme: 'dark', trim: 'on', motion: 'reduce',
  identities: [{ email: 'me@example.com', name: '나' }], excludeGlobs: ['dist/**', '**/*.min.js'],
  locale: 'en', tutorialSeen: true, declaredNewcomer: false, rootCleared: true,
  dictLangs: ['ts', 'py'], lastRepoId: 3,
};

// ───────── 적재 ─────────

let db: SqliteDb;

function seed(): void {
  insert(db, 'dictionary_version', { id: 1, lang: 'ts', version: '1.0.0', sha256: 'deadbeef', concept_count: 3, loaded_at: T });
  // 보편 개념 먼저 — `concept.universal_id` 가 같은 표를 참조한다.
  insert(db, 'concept', {
    id: CID.universal, lang: 'common', name_ko: '옵셔널 체이닝(보편)', name_en: 'Safe navigation', token: '?.', kind: 'universal',
    universal_id: null, track_default: 't0', dict_version_id: 1, is_retired: 0,
  });
  insert(db, 'concept', {
    id: CONCEPT.id, lang: CONCEPT.lang, name_ko: CONCEPT.nameKo, name_en: CONCEPT.nameEn,
    token: CONCEPT.token, kind: CONCEPT.kind,
    universal_id: CONCEPT.universalId, track_default: CONCEPT.trackDefault,
    dict_version_id: CONCEPT.dictVersionId, is_retired: 0,
  });
  insert(db, 'concept', {
    id: CID.nullish, lang: 'ts', name_ko: '널 병합', token: '??', kind: 'lang',
    universal_id: null, track_default: 't0', dict_version_id: 1, is_retired: 1,
  });

  // repo · file · commit · capture · ingest_run — 진짜 statement 로 쓴다.
  db.prepare(statements['repo.insert']).run(toSqliteBindings(toRepoParams({
    rootPath: '/repos/chickadee', name: 'chickadee', defaultBranch: 'main', headSha: 'abc1234',
    primaryLang: 'ts', fingerprint: 'root1-root2', addedAt: T,
  })));
  for (const path of ['src/a.ts', 'src/b.ts']) {
    db.prepare(statements['facts.file_upsert']).run(toSqliteBindings(toFileParams({
      repoId: 1, path, lang: 'ts', grammar: 'typescript', lineCount: 120, byteSize: 3400,
      contentHash: 'blob-oid', headOid: 'head-oid', isDirty: true, parseQuality: 'ok',
      skipReason: null, updatedAt: T,
    })));
  }
  db.prepare(statements['facts.commit_insert']).run(toSqliteBindings(toGitCommitParams({
    repoId: 1, sha: 'abc1234', parentSha: 'def5678', parentCount: 1, authoredAt: T,
    authorEmail: 'me@example.com', authorName: '나', message: 'fix: 로그인 응답 방어',
    truncated: false, filesN: 2, insertions: 13, deletions: 3,
  })));
  db.prepare(statements['facts.commit_file_insert']).run(toSqliteBindings(toCommitFileParams(1, 'abc1234', COMMIT_FILE)));
  db.prepare(statements['facts.capture_insert']).run(toSqliteBindings(toCaptureParams(1, 'src/a.ts', CAPTURE)));
  db.prepare(statements['facts.run_start']).run(toSqliteBindings(toIngestRunStartParams({
    repoId: 1, startedAt: T, mode: 'incremental', headSha: 'abc1234', appVersion: '0.1.0',
  })));
  for (const p of toSettingsParams(SETTINGS, T)) db.prepare(statements['settings.set']).run(p);

  insert(db, 'unit', { id: 1, repo_id: 1, name: 'auth', root_path: 'src/features/auth', source: 'dir', order_idx: 1 });
  insert(db, 'scheduler_params', {
    id: 1, created_at: T, algo: 'fsrs5', params_json: json(Array.from({ length: 19 }, (_, i) => i / 10)),
    source: 'default', review_count: 0, log_loss: null, is_active: 1,
  });

  insert(db, 'concept_site', {
    id: SITE.id, repo_id: SITE.repoId, file_id: SITE.fileId, concept_id: SITE.conceptId, site_key: SITE.siteKey,
    line_start: SITE.lineStart, line_end: SITE.lineEnd, col_start: SITE.colStart, col_end: SITE.colEnd,
    ts_node_kind: SITE.tsNodeKind, form: SITE.form, shape: SITE.shape, occurrence: SITE.occurrence,
    excerpt: SITE.excerpt, picks_json: json(SITE.picks), hole_json: json(SITE.hole), ctx_json: json(SITE.ctx),
    line_concepts_json: json(SITE.lineConcepts), uncovered_ratio: SITE.uncoveredRatio,
    confidence: SITE.confidence, parse_quality: SITE.parseQuality, is_dirty: 1, is_oversize: 0,
    commit_id: SITE.commitId, unknown_count: SITE.unknownCount, is_alive: 1, updated_at: SITE.updatedAt,
  });

  insert(db, 'import_edge', {
    repo_id: EDGE.repoId, from_file_id: EDGE.fromFileId, to_file_id: EDGE.toFileId,
    kind: EDGE.kind, confidence: EDGE.confidence,
  });

  insert(db, 'block', {
    id: BLOCK.id, repo_id: BLOCK.repoId, file_id: BLOCK.fileId, rev: BLOCK.rev, name: BLOCK.name,
    kind: BLOCK.kind, line_start: BLOCK.lineStart, line_end: BLOCK.lineEnd, text_hash: BLOCK.textHash,
    ast_json: json(BLOCK.ast), is_alive: 1, updated_at: BLOCK.updatedAt,
  });

  for (const c of [CARD_T0, CARD_T1, CARD_T2, CARD_T3]) {
    insert(db, 'card', {
      id: c.id, repo_id: c.repoId, unit_id: c.unitId, track: c.track, kind: c.kind, concept_id: c.conceptId,
      level: c.level, site_id: c.siteId, file_id: c.fileId, commit_id: c.commitId,
      payload_json: json(c.payload), snapshot_json: c.snapshot === null ? null : json(c.snapshot),
      gen_version: c.genVersion, content_hash: c.contentHash, created_at: c.createdAt, retired_at: c.retiredAt,
      stage_no: c.stageNo ?? null,
    });
  }

  insert(db, 'mastery', {
    concept_id: MASTERY.conceptId, state: MASTERY.state, stability: MASTERY.stability, difficulty: MASTERY.difficulty,
    due_at: MASTERY.dueAt, last_review_at: MASTERY.lastReviewAt, reps: MASTERY.reps, lapses: MASTERY.lapses,
    layer: MASTERY.layer, day_key: MASTERY.dayKey, day_start_layer: MASTERY.dayStartLayer,
    day_ceiling: MASTERY.dayCeiling, first_ok_at: MASTERY.firstOkAt, last_ok_day: MASTERY.lastOkDay,
    dunno_total: MASTERY.dunnoTotal, transfer_from: MASTERY.transferFrom,
    applied_log_id: MASTERY.appliedLogId, updated_at: MASTERY.updatedAt,
  });

  insert(db, 'session', {
    id: SESSION.id, repo_id: SESSION.repoId, day_key: SESSION.dayKey, seq_in_day: SESSION.seqInDay,
    started_at: SESSION.startedAt, ended_at: SESSION.endedAt, budget_min: SESSION.budgetMin,
    planned_min: SESSION.plannedMin, elapsed_s: SESSION.elapsedS, status: SESSION.status,
    plan_json: json(SESSION.plan), lifer_shown: SESSION.liferShown,
  });

  // 「판 완료」 순서 그대로: session_item 은 review_log 가 생기기 전이라 review_log_id 가 NULL 이다.
  insert(db, 'session_item', {
    id: SESSION_ITEM.id, session_id: SESSION_ITEM.sessionId, pos: SESSION_ITEM.pos, card_id: SESSION_ITEM.cardId,
    concept_id: SESSION_ITEM.conceptId, track: SESSION_ITEM.track, role: SESSION_ITEM.role,
    est_min: SESSION_ITEM.estMin, parent_item_id: SESSION_ITEM.parentItemId, status: SESSION_ITEM.status,
    elapsed_s: SESSION_ITEM.elapsedS, state_json: json(SESSION_ITEM.state), review_log_id: null,
    created_at: SESSION_ITEM.createdAt,
  });
  for (const log of REVIEW_LOGS) {
    insert(db, 'review_log', {
      id: log.id, session_id: log.sessionId, session_item_id: log.sessionItemId, card_id: log.cardId,
      concept_id: log.conceptId, track: log.track, role: log.role, reviewed_at: log.reviewedAt,
      day_key: log.dayKey, grade: log.grade, ok: log.ok ? 1 : 0, dunno: log.dunno ? 1 : 0,
      early: log.early ? 1 : 0, elapsed_days: log.elapsedDays, scheduled_days: log.scheduledDays,
      r_at_review: log.rAtReview, layer_before: log.layerBefore, layer_after: log.layerAfter,
      s_before: log.sBefore, d_before: log.dBefore, s_after: log.sAfter, d_after: log.dAfter,
      due_after: log.dueAfter, params_id: log.paramsId, duration_ms: log.durationMs,
      detail_json: json(log.detail),
    });
  }
  db.prepare('UPDATE session_item SET review_log_id = :id WHERE id = 1').run({ id: SESSION_ITEM.reviewLogId });

  insert(db, 'dunno_event', {
    id: DUNNO.id, session_item_id: DUNNO.sessionItemId, review_log_id: DUNNO.reviewLogId, card_id: DUNNO.cardId,
    concept_id: DUNNO.conceptId, at: DUNNO.at, answered_before: 1, was_correct: 0,
    max_rung: DUNNO.maxRung, layer_before: DUNNO.layerBefore, layer_after: DUNNO.layerAfter,
  });
  insert(db, 'ladder_event', {
    id: LADDER.id, dunno_event_id: LADDER.dunnoEventId, rung: LADDER.rung, action: LADDER.action,
    target_card_id: LADDER.targetCardId, at: LADDER.at,
  });
  insert(db, 'appeal', {
    id: APPEAL.id, review_log_id: APPEAL.reviewLogId, card_id: APPEAL.cardId, track: APPEAL.track,
    line_no: APPEAL.lineNo, original_text: APPEAL.originalText, user_text: APPEAL.userText,
    norm_original: APPEAL.normOriginal, norm_user: APPEAL.normUser, auto_verdict: APPEAL.autoVerdict,
    auto_reason: APPEAL.autoReason, reasons_json: json(APPEAL.reasons), pattern_key: APPEAL.patternKey,
    engine_version: APPEAL.engineVersion, dict_version: APPEAL.dictVersion, status: APPEAL.status,
    created_at: APPEAL.createdAt, resolved_at: APPEAL.resolvedAt, note: APPEAL.note,
  });
  insert(db, 'why_answer', {
    id: WHY.id, review_log_id: WHY.reviewLogId, card_id: WHY.cardId, block_id: WHY.blockId,
    line_no: WHY.lineNo, question_id: WHY.questionId, text: WHY.text, pick: WHY.pick,
    pick_ok: 1, created_at: WHY.createdAt,
  });
  insert(db, 'lifer', {
    id: LIFER.id, concept_id: LIFER.conceptId, card_id: LIFER.cardId, repo_id: LIFER.repoId,
    file_path: LIFER.filePath, line_no: LIFER.lineNo, at: LIFER.at, shown_at: LIFER.shownAt,
  });
  insert(db, 'gap', {
    repo_id: GAP.repoId, concept_id: GAP.conceptId, site_count: GAP.siteCount, min_unknown: GAP.minUnknown,
    best_site_id: GAP.bestSiteId, reason: GAP.reason, status: GAP.status, computed_at: GAP.computedAt,
  });
  insert(db, 'perf_sample', { id: PERF.id, kind: PERF.kind, ms: PERF.ms, n: PERF.n, at: PERF.at });
}

beforeAll(() => {
  db = open();
  seed();
});

// ───────── 왕복 ─────────

describe('fromXxxRow 왕복 (인메모리 SQLite + 마이그레이션 전부)', () => {
  // 0007 까지 35 · 0009(경로·스키마·죽은 코드, D168·D169)가 7 을 더했다. 0008 은 표를 다시 만들 뿐 수를 안 바꾼다.
  test('마이그레이션이 42개 테이블을 만든다', () => {
    const rows = db.prepare(statements['store.table_names']).all() as { name: string }[];
    expect(rows).toHaveLength(42);
    expect(db.pragma('user_version')).toEqual([{ user_version: SCHEMA_VERSION }]);
  });

  test('concept', () => {
    expect(fromConceptRow(one(db, 'concept', "id = 'ts/optional-chaining'"))).toStrictEqual(CONCEPT);
  });

  test('concept_site — picks/hole/ctx/line_concepts JSON 과 0/1 불리언', () => {
    expect(fromConceptSiteRow(one(db, 'concept_site', 'id = 1'))).toStrictEqual(SITE);
  });

  test('mastery', () => {
    expect(fromMasteryRow(one(db, 'mastery', "concept_id = 'ts/optional-chaining'"))).toStrictEqual(MASTERY);
  });

  test.each([[CARD_T0], [CARD_T1], [CARD_T2], [CARD_T3]])('card #%# — payload/snapshot JSON · stage_no (D164)', (card: Card) => {
    expect(fromCardRow(one(db, 'card', `id = ${card.id}`))).toStrictEqual(card);
  });

  test('session — plan_json', () => {
    expect(fromSessionRow(one(db, 'session', 'id = 1'))).toStrictEqual(SESSION);
  });

  test('session_item — state_json', () => {
    expect(fromSessionItemRow(one(db, 'session_item', 'id = 1'))).toStrictEqual(SESSION_ITEM);
  });

  test.each(REVIEW_LOGS.map((l) => [l] as const))('review_log #%# — detail_json', (log: ReviewLog) => {
    expect(fromReviewLogRow(one(db, 'review_log', `id = ${log.id}`))).toStrictEqual(log);
  });

  test('dunno_event · ladder_event', () => {
    expect(fromDunnoEventRow(one(db, 'dunno_event', 'id = 1'))).toStrictEqual(DUNNO);
    expect(fromLadderEventRow(one(db, 'ladder_event', 'id = 1'))).toStrictEqual(LADDER);
  });

  test('appeal — reasons_json', () => {
    expect(fromAppealRow(one(db, 'appeal', 'id = 1'))).toStrictEqual(APPEAL);
  });

  test('why_answer · lifer · gap · perf_sample', () => {
    expect(fromWhyAnswerRow(one(db, 'why_answer', 'id = 1'))).toStrictEqual(WHY);
    expect(fromLiferRow(one(db, 'lifer', 'id = 1'))).toStrictEqual(LIFER);
    expect(fromGapRow(one(db, 'gap', "repo_id = 1 AND concept_id = 'ts/nullish-coalescing'"))).toStrictEqual(GAP);
    expect(fromPerfSampleRow(one(db, 'perf_sample', 'id = 1'))).toStrictEqual(PERF);
  });

  test('block — ast_json(AstLite) 재귀', () => {
    expect(fromBlockRow(one(db, 'block', 'id = 1'))).toStrictEqual(BLOCK);
  });

  test('import_edge', () => {
    expect(fromImportEdgeRow(one(db, 'import_edge', 'from_file_id = 1 AND to_file_id = 2'))).toStrictEqual(EDGE);
  });
});

describe('toXxxParams 왕복 (카탈로그 statement 로 쓴 뒤 되읽기)', () => {
  test('capture — toCaptureParams → INSERT → fromCaptureRow', () => {
    expect(fromCaptureRow(one(db, 'capture', 'id = 1'))).toStrictEqual(CAPTURE);
  });

  test('commit_file — touched_json 이 [from,to][] 로 돌아온다', () => {
    expect(fromCommitFileRow(one(db, 'commit_file', "commit_id = 1 AND path = 'src/a.ts'"))).toStrictEqual(COMMIT_FILE);
  });

  test('settings — 객체 → KV 행 → 객체', () => {
    const rows = db.prepare(statements['settings.get_all']).all() as { key: string; value_json: string; updated_at: number }[];
    // 키를 더할 때마다 숫자를 고치지 않는다 — `Settings` 필드 전부가 한 행씩 돈다는 것이 요점이다.
    expect(rows).toHaveLength(Object.keys(SETTINGS_KEYS).length);
    expect(fromSettingsRows(rows)).toStrictEqual(SETTINGS);
  });

  test('settings — 모르는 키는 건너뛰고 아는 키만 채운다', () => {
    expect(fromSettingsRows([
      { key: 'budget_min', value_json: '20', updated_at: T },
      { key: 'from_the_future', value_json: '{"x":1}', updated_at: T },
    ])).toStrictEqual({ budgetMin: 20 });
  });

  test('repo · file · git_commit · ingest_run — 파라미터가 열에 그대로 앉는다', () => {
    const repo = one(db, 'repo', 'id = 1');
    expect(repo['root_path']).toBe('/repos/chickadee');
    expect(repo['fingerprint']).toBe('root1-root2');

    const file = one(db, 'file', "path = 'src/a.ts'");
    expect(file['is_dirty']).toBe(1);            // boolean → 0/1
    expect(file['is_alive']).toBe(1);            // statement 가 세우는 값
    expect(file['parse_quality']).toBe('ok');

    const commit = one(db, 'git_commit', "sha = 'abc1234'");
    expect(commit['truncated']).toBe(0);
    expect(commit['files_n']).toBe(2);

    const run = one(db, 'ingest_run', 'id = 1');
    expect(run['status']).toBe('running');
    expect(run['mode']).toBe('incremental');
  });

  test('toSettingsParams 는 준 키만 행으로 만든다', () => {
    expect(toSettingsParams({ theme: 'light', newPerDay: 3 }, T)).toStrictEqual([
      { key: 'new_per_day', valueJson: '3', updatedAt: T },
      { key: 'theme', valueJson: '"light"', updatedAt: T },
    ]);
  });
});

// ───────── 무음 손상 금지 ─────────

/**
 * D154 — 「사용처 없이 카드만 있는 개념」 가지. **이 문장에는 시험이 없었다**: 가지를 더하며
 * 문법 오류가 나도 아무도 안 잡는 상태였고, 낡은 `dist` 로 확인하면 옛 문장을 재게 된다.
 *
 * 시험마다 다른 개념을 쓴다 — DB 가 이 파일 전체에 하나뿐이라 순서에 기대면 안 된다.
 */
describe('queue.new_candidates (실제 SQLite)', () => {
  let n = 0;
  /** 사용처 없이 카드만 있는 개념 하나를 심고 그 id 를 준다. */
  const seedCardOnly = (over: { retired?: boolean; printed?: boolean } = {}): string => {
    n += 1;
    const id = `exec/order${n}`;
    insert(db, 'concept', {
      id, lang: 'exec', name_ko: id, name_en: id, token: null, kind: 'universal',
      universal_id: null, track_default: 't0', dict_version_id: 1, is_retired: 0,
    });
    insert(db, 'card', {
      id: 900 + n, repo_id: 1, unit_id: null, track: 't0', kind: 'point', concept_id: id,
      level: 1, site_id: null, file_id: null, commit_id: null, payload_json: '{}',
      snapshot_json: null, gen_version: 1, content_hash: `exec-${n}`, created_at: T,
      retired_at: over.retired === true ? T : null,
    });
    if (over.printed === true) {
      insert(db, 'mastery', {
        concept_id: id, state: 2, stability: 1, difficulty: 5, due_at: T, last_review_at: T,
        reps: 1, lapses: 0, layer: 1, day_key: '2026-09-04', day_start_layer: 0, day_ceiling: 1,
        first_ok_at: T, last_ok_day: '2026-09-04', dunno_total: 0, transfer_from: null,
        applied_log_id: 0, updated_at: T,
      });
    }
    return id;
  };
  const rows = (): { id: string; site_count: number }[] =>
    db.prepare(statements['queue.new_candidates']).all({ repoId: 1 }) as never;

  test('사용처가 없어도 카드가 있으면 후보로 나온다 — site_count 는 0 이다', () => {
    const id = seedCardOnly();
    const hit = rows().find((r) => r.id === id);
    expect(hit).toBeDefined();
    expect(hit?.site_count).toBe(0);
  });

  test('카드가 은퇴하면 빠진다', () => {
    const id = seedCardOnly({ retired: true });
    expect(rows().some((r) => r.id === id)).toBe(false);
  });

  test('이미 찍은 개념은 빠진다 — 새 판 후보가 아니다', () => {
    const id = seedCardOnly({ printed: true });
    expect(rows().some((r) => r.id === id)).toBe(false);
  });
});

describe('*_json 이 스키마와 다르면 오류다 (02 §8.1)', () => {
  const SECRET = 'PRIVATE_CODE_ZZTOP_9931';

  function corrupt(table: string, column: string, where: string, value: string): void {
    db.prepare(`UPDATE ${table} SET ${column} = :v WHERE ${where}`).run({ v: value });
  }

  test('JSON 이 아니면 JsonColumnError — 원문은 메시지에 없다', () => {
    insert(db, 'perf_sample', { id: 90, kind: 'x', ms: 1, n: 1, at: T });
    insert(db, 'block', {
      id: 90, repo_id: 1, file_id: 1, rev: null, name: 'n', kind: 'function',
      line_start: 1, line_end: 2, text_hash: 'h', ast_json: `{"kind":"${SECRET}"`, is_alive: 1, updated_at: T,
    });
    const row = one(db, 'block', 'id = 90');

    expect(() => fromBlockRow(row)).toThrow(JsonColumnError);
    try {
      fromBlockRow(row);
      expect.unreachable('던졌어야 한다');
    } catch (e) {
      const err = e as JsonColumnError;
      expect(err.table).toBe('block');
      expect(err.column).toBe('ast_json');
      expect(err.rowId).toBe('id=90');
      expect(err.message).not.toContain(SECRET);
      expect(err.issuePaths.join(' ')).not.toContain(SECRET);
      expect(JSON.stringify(err.issuePaths)).toBe('["<root>:invalid_json"]');
    }
  });

  test('JSON 이지만 스키마와 다르면 JsonColumnError — 값은 메시지에 없다', () => {
    insert(db, 'card', {
      id: 90, repo_id: 1, unit_id: null, track: 't0', kind: 'meaning', concept_id: CONCEPT.id,
      level: 1, site_id: null, file_id: null, commit_id: null,
      payload_json: json({ track: 't0', kind: 'meaning', file: SECRET, focus: 'not-a-number' }),
      snapshot_json: null, gen_version: 1, content_hash: 'hash-broken', created_at: T, retired_at: null,
    });
    const row = one(db, 'card', 'id = 90');

    try {
      fromCardRow(row);
      expect.unreachable('던졌어야 한다');
    } catch (e) {
      const err = e as JsonColumnError;
      expect(err).toBeInstanceOf(JsonColumnError);
      expect(err.message).toContain('card.payload_json');
      expect(err.message).not.toContain(SECRET);
      expect(err.issuePaths.some((p) => p.startsWith('focus:'))).toBe(true);
    }
  });

  test('행을 조용히 버리지 않는다 — 오류가 호출자까지 올라온다', () => {
    corrupt('concept_site', 'ctx_json', 'id = 1', json({ fallback: { leaked: SECRET } }));
    expect(() => fromConceptSiteRow(one(db, 'concept_site', 'id = 1'))).toThrow(JsonColumnError);
    corrupt('concept_site', 'ctx_json', 'id = 1', json(SITE.ctx));
    expect(fromConceptSiteRow(one(db, 'concept_site', 'id = 1')).ctx).toStrictEqual(SITE.ctx);
  });

  test('picks_json 은 DDL 기본값 `{}` 과 빈 배열만 빈 레코드로 받는다 (D58)', () => {
    corrupt('concept_site', 'picks_json', 'id = 1', '{}');
    expect(fromConceptSiteRow(one(db, 'concept_site', 'id = 1')).picks).toStrictEqual({});
    corrupt('concept_site', 'picks_json', 'id = 1', '[]');
    expect(fromConceptSiteRow(one(db, 'concept_site', 'id = 1')).picks).toStrictEqual({});
    corrupt('concept_site', 'picks_json', 'id = 1', '["값이 든 배열"]');
    expect(() => fromConceptSiteRow(one(db, 'concept_site', 'id = 1'))).toThrow(JsonColumnError);
    corrupt('concept_site', 'picks_json', 'id = 1', json(SITE.picks));
  });
});

// ───────── 불리언 · 브랜드 ─────────

describe('경계 변환', () => {
  test('INTEGER 0/1 ↔ boolean 왕복', () => {
    for (const [id, stored, expected] of [['c-true', 1, true], ['c-false', 0, false]] as const) {
      insert(db, 'concept', {
        id, lang: 'ts', name_ko: 'n', token: null, kind: 'lang', universal_id: null,
        track_default: 't1', dict_version_id: 1, is_retired: stored,
      });
      expect(fromConceptRow(one(db, 'concept', `id = '${id}'`)).isRetired).toBe(expected);
    }
  });

  test('0/1 이 아닌 값은 ColumnTypeError', () => {
    const row: Row = { ...one(db, 'concept', "id = 'c-true'"), is_retired: 2 };
    expect(() => fromConceptRow(row)).toThrow(ColumnTypeError);
    expect(() => fromConceptRow(row)).toThrow(/concept\.is_retired/);
  });

  test('day_key 가 YYYY-MM-DD 가 아니면 ColumnTypeError', () => {
    const row: Row = { ...one(db, 'session', 'id = 1'), day_key: '2026/01/01' };
    expect(() => fromSessionRow(row)).toThrow(ColumnTypeError);
  });

  test('없는 열은 ColumnTypeError — 조용히 undefined 가 되지 않는다', () => {
    const row: Row = { ...one(db, 'perf_sample', 'id = 1') };
    delete row['ms'];
    expect(() => fromPerfSampleRow(row)).toThrow(/perf_sample\.ms/);
  });

  test('DayKey · ConceptId 는 브랜드다 (컴파일 타임)', () => {
    const day: DayKey = asDayKey('2026-01-01');
    const concept: ConceptId = asConceptId('ts/optional-chaining');
    // @ts-expect-error 평범한 string 은 DayKey 가 아니다 — 이 줄이 통과하면 브랜드가 풀린 것이다.
    const notADay: DayKey = '2026-01-01';
    // @ts-expect-error DayKey 를 ConceptId 자리에 넣을 수 없다.
    const notAConcept: ConceptId = day;

    expect(day).toBe(notADay);
    expect(concept).not.toBe(notAConcept);
    expect(() => asDayKey('2026-1-1')).toThrow(TypeError);
  });
});
