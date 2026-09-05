/**
 * 챕터 진도 (D165). 앞 절반은 순수 판정, 뒤 절반은 **진짜 sqlite** 위의 원장 한 바퀴다 —
 * 카탈로그의 SQL 을 그대로 돌리므로 `chapter.sql` 이 깨지면 화면이 아니라 여기서 걸린다.
 */
import { createRequire } from 'node:module';

import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

const T = 1_767_225_600_000;
const DAY = 86_400_000;
let db: SqliteDb;

function run(name: string, params: unknown): unknown[] {
  const sql = (statements as Record<string, string>)[name];
  if (sql === undefined) throw new Error(`카탈로그에 없는 이름: ${name}`);
  const bound = toSqliteBindings((params ?? {}) as Record<string, unknown>);
  const stmt = db.prepare(sql);
  return stmt.reader ? (stmt.all(bound) as unknown[]) : [stmt.run(bound)];
}

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: (name: string, params: unknown) => Promise.resolve(run(name, params)),
      exec: (name: string, params: unknown) => Promise.resolve(run(name, params)[0]),
      batch: (ops: { name: string; params: unknown }[]) =>
        Promise.resolve(ops.map((op) => run(op.name, op.params)[0])),
    },
  },
  on: () => Promise.resolve(() => undefined),
  IpcError: class extends Error {},
}));

const {
  advance, deferChapter, foldPath, fromChapterRow, passTarget, readingTally, recordStageResult,
  stagePasses, stuckAction,
} = await import('./progress.js');
type ChapterProgress = Awaited<ReturnType<typeof recordStageResult>>['next'];

const fresh = (unitId = 1): ChapterProgress => ({
  unitId, stageReached: 0, passedAt: null, state: 0, stability: null, difficulty: null,
  dueAt: null, lastReviewAt: null, reps: 0, lapses: 0,
});

const result = (stage: 1 | 2 | 3 | 4 | 5, asked: number, correct: number) =>
  ({ unitId: 1, stage, asked, correct, durationMs: 1000 });

describe('통과선 (mastery.md §3.2)', () => {
  test('1·2·4단은 전부 맞아야 한다 — 부분점수가 없다', () => {
    expect(stagePasses(1, 8, 8)).toBe(true);
    expect(stagePasses(1, 8, 7)).toBe(false);
    expect(stagePasses(2, 1, 1)).toBe(true);
    expect(stagePasses(2, 5, 4)).toBe(false);
    expect(stagePasses(4, 3, 2)).toBe(false);
  });

  test('3단은 4/5', () => {
    expect(stagePasses(3, 5, 4)).toBe(true);
    expect(stagePasses(3, 5, 3)).toBe(false);
    expect(stagePasses(3, 3, 3)).toBe(true);
    expect(stagePasses(3, 3, 2)).toBe(false);
  });

  test('문항이 없으면 통과가 아니다', () => {
    expect(stagePasses(3, 0, 0)).toBe(false);
  });

  test('1단은 경로 위 개념의 겹으로 센다 — 전부 1겹 이상', () => {
    const tally = readingTally([{ layer: 0 }, { layer: 2 }, { layer: 1 }]);
    expect(tally).toEqual({ asked: 3, correct: 2 });
    expect(stagePasses(1, tally.asked, tally.correct)).toBe(false);
  });
});

describe('챕터 통과', () => {
  const step = (row: ChapterProgress, stage: 1 | 2 | 3 | 4, ok: boolean, hasRepair = false) =>
    advance({
      row, result: result(stage, 1, ok ? 1 : 0), kind: 'first', hasRepair, now: T,
    });

  test('러너가 있으면 5단까지가 통과다 (D180 ④)', () => {
    expect(passTarget(false, true)).toBe(5);
    expect(passTarget(true, true)).toBe(5);

    const run = (row: ChapterProgress, stage: 1 | 2 | 3 | 4 | 5) =>
      advance({ row, result: result(stage, 1, 1), kind: 'first', hasRepair: true, hasRun: true, now: T });
    let row = fresh();
    for (const stage of [1, 2, 3, 4] as const) row = run(row, stage).next;
    // 4단까지 다 맞혔어도 실행이 있는 챕터는 아직 통과가 아니다.
    expect(row.passedAt).toBeNull();
    const fifth = run(row, 5);
    expect(fifth.justPassed).toBe(true);
    expect(fifth.next.stageReached).toBe(5);
  });

  test('4단을 못 굽는 챕터는 3단까지가 통과다 (D165 기본값)', () => {
    expect(passTarget(false)).toBe(3);
    expect(passTarget(true)).toBe(4);

    let row = fresh();
    for (const stage of [1, 2] as const) row = step(row, stage, true).next;
    expect(row.passedAt).toBeNull();
    const third = step(row, 3, true);
    expect(third.justPassed).toBe(true);
    expect(third.next.passedAt).toBe(T);
  });

  test('4단 문항이 있으면 3단까지로는 안 통과한다', () => {
    let row = fresh();
    for (const stage of [1, 2] as const) row = step(row, stage, true, true).next;
    const third = step(row, 3, true, true);
    expect(third.justPassed).toBe(false);
    expect(third.next.passedAt).toBeNull();
    const fourth = step(third.next, 4, true, true);
    expect(fourth.next.passedAt).toBe(T);
  });

  test('틀린 단은 진도를 안 올리고, 내리지도 않는다', () => {
    const row = { ...fresh(), stageReached: 2 };
    const moved = step(row, 3, false);
    expect(moved.next.stageReached).toBe(2);
    expect(moved.log.passed).toBe(false);
  });
});

describe('재검 (mastery.md §4 ②)', () => {
  const passed = { ...fresh(), stageReached: 3, passedAt: T, state: 2 as const, reps: 1 };
  const schedule = {
    state: 3 as const, stability: 2, difficulty: 6, dueAt: T + 3 * DAY, lastReviewAt: T,
    reps: 2, lapses: 1, elapsedDays: 3,
  };

  test('Again 이면 stage_reached 가 하나 내려간다 — 유일한 되돌림', () => {
    const moved = advance({
      row: passed, result: result(2, 2, 0), kind: 'recheck', hasRepair: false, now: T + 3 * DAY,
      recheck: { grade: 1, schedule },
    });
    expect(moved.next.stageReached).toBe(2);
    expect(moved.log.grade).toBe(1);
    expect(moved.log.elapsedDays).toBe(3);
  });

  test('되돌려도 passed_at 은 안 지운다 — 해금을 걷지 않는다', () => {
    const moved = advance({
      row: passed, result: result(2, 2, 0), kind: 'recheck', hasRepair: false, now: T + 3 * DAY,
      recheck: { grade: 1, schedule },
    });
    expect(moved.next.passedAt).toBe(T);
  });

  test('Good 은 진도를 그대로 두고 일정만 옮긴다', () => {
    const moved = advance({
      row: passed, result: result(2, 2, 2), kind: 'recheck', hasRepair: false, now: T + 3 * DAY,
      recheck: { grade: 3, schedule },
    });
    expect(moved.next.stageReached).toBe(3);
    expect(moved.next.dueAt).toBe(T + 3 * DAY);
    expect(moved.next.state).toBe(3);
  });

  test('첫 판정에는 등급도 elapsed_days 도 없다', () => {
    const moved = advance({
      row: fresh(), result: result(1, 2, 2), kind: 'first', hasRepair: false, now: T,
    });
    expect(moved.log.grade).toBeNull();
    expect(moved.log.elapsedDays).toBe(0);
  });
});

describe('막힘 처방 (mastery.md §5)', () => {
  test('단마다 방향이 다르고, 새 ladder_event.action 값을 안 만든다', () => {
    expect(stuckAction({ stage: 1, dunnoCount: 1 })).toMatchObject({ kind: 'prereq' });
    expect(stuckAction({ stage: 2, dunnoCount: 1 })).toMatchObject({
      kind: 'fold', rung: 2, action: 'jump', hops: 3,
    });
    expect(stuckAction({ stage: 3, dunnoCount: 2 })).toMatchObject({ kind: 'concept-front' });
    expect(stuckAction({ stage: 4, dunnoCount: 1 })).toMatchObject({
      kind: 'prompt', rung: 4, action: 'prompt_built',
    });
  });

  test('세 번 막히면 단과 무관하게 그날 접는다', () => {
    for (const stage of [1, 2, 3, 4] as const) {
      expect(stuckAction({ stage, dunnoCount: 3 }).kind).toBe('defer');
    }
  });

  test('경로 접기 — 5칸을 3칸으로, 양 끝은 남는다', () => {
    const hops = ['front', 'controller', 'service', 'dao', 'mapper']
      .map((path) => ({ path, line: 1, kind: 'static' as const }));
    const folded = foldPath(hops);
    expect(folded.map((h) => h.path)).toEqual(['front', 'service', 'mapper']);
    // 이미 짧으면 그대로.
    expect(foldPath(hops.slice(0, 2)).map((h) => h.path)).toEqual(['front', 'controller']);
  });
});

// ───────── 진짜 sqlite ─────────

function seedChapter(unitId: number, name: string, orderIdx: number): void {
  run('derive.unit_upsert', { repoId: 1, name, rootPath: null, orderIdx });
  run('derive.chapter_upsert', { repoId: 1, name, origin: 'entry', updatedAt: T });
  const got = db.prepare('SELECT unit_id FROM chapter ORDER BY unit_id').all() as { unit_id: number }[];
  expect(got.some((r) => r.unit_id === unitId)).toBe(true);
}

beforeEach(() => {
  db = new Database(':memory:');
  for (const m of [...migrations].sort((a, b) => a.version - b.version)) db.exec(m.sql);
  db.pragma('foreign_keys = ON');
  run('repo.insert', {
    rootPath: '/fixture', name: 'fixture', defaultBranch: null, headSha: null,
    primaryLang: null, fingerprint: '', addedAt: T,
  });
  run('session.insert', {
    repoId: 1, dayKey: '2026-01-01', seqInDay: 1, startedAt: T, budgetMin: 15, plannedMin: 15,
    status: 'active', planJson: '[]',
  });
  seedChapter(1, 'auth', 0);
  seedChapter(2, 'dream', 1);
});

const record = (over: Partial<Parameters<typeof recordStageResult>[0]> = {}) => recordStageResult({
  sessionId: 1, dayKey: '2026-01-01', now: T, row: fresh(), kind: 'first', hasRepair: false,
  result: result(1, 3, 3), ...over,
});

const chapterOf = (unitId: number): ChapterProgress =>
  fromChapterRow(run('chapter.get', { unitId })[0] as Parameters<typeof fromChapterRow>[0]);

describe('원장 한 바퀴', () => {
  test('단 하나를 판정하면 원장 한 행과 챕터 캐시가 같이 선다', async () => {
    await record();
    const log = db.prepare('SELECT * FROM stage_log').all() as Record<string, unknown>[];
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ unit_id: 1, stage: 1, kind: 'first', passed: 1, grade: null });
    const row = chapterOf(1);
    expect(row.stageReached).toBe(1);
    // 재생 커서가 방금 쓴 원장 행을 가리킨다 (last_insert_rowid).
    const cur = db.prepare('SELECT applied_log_id FROM chapter WHERE unit_id = 1')
      .get() as { applied_log_id: number };
    expect(cur.applied_log_id).toBe(log[0]?.['id']);
  });

  test('1·2·3단을 밟으면 passed_at 이 서고 다음 챕터가 열린다', async () => {
    let row = fresh();
    for (const stage of [1, 2, 3] as const) {
      const moved = await record({ row, result: result(stage, 1, 1), now: T + stage });
      row = moved.next;
    }
    expect(chapterOf(1).passedAt).toBe(T + 3);
    const today = run('chapter.today', { repoId: 1, dayKey: '2026-01-01' }) as { name: string }[];
    expect(today[0]?.name).toBe('dream');
  });

  test('재검은 만기가 지나야 나오고, 같은 날 두 번은 안 나온다', async () => {
    let row = fresh();
    for (const stage of [1, 2, 3] as const) {
      row = (await record({ row, result: result(stage, 1, 1) })).next;
    }
    const schedule = {
      state: 2 as const, stability: 3, difficulty: 6, dueAt: T + 3 * DAY, lastReviewAt: T,
      reps: 1, lapses: 0, elapsedDays: 0,
    };
    row = (await record({
      row, kind: 'recheck', result: result(2, 2, 2), now: T,
      recheck: { grade: 3, schedule },
    })).next;

    const before = run('chapter.due', { repoId: 1, now: T + DAY, dayKey: '2026-01-02' });
    expect(before).toHaveLength(0);           // 아직 만기가 아니다
    const sameDay = run('chapter.due', { repoId: 1, now: T + 4 * DAY, dayKey: '2026-01-01' });
    expect(sameDay).toHaveLength(0);          // 만기지만 오늘 이미 냈다
    const due = run('chapter.due', { repoId: 1, now: T + 4 * DAY, dayKey: '2026-01-04' });
    expect(due).toHaveLength(1);
  });

  test('그날 접은 챕터는 오늘 챕터에서 빠진다', async () => {
    await deferChapter(1, '2026-01-01', T);
    const today = run('chapter.today', { repoId: 1, dayKey: '2026-01-01' }) as { name: string }[];
    expect(today[0]?.name).toBe('dream');
    const tomorrow = run('chapter.today', { repoId: 1, dayKey: '2026-01-02' }) as { name: string }[];
    expect(tomorrow[0]?.name).toBe('auth');
  });

  test('단마다 마지막 첫 판정만 센다 — 다시 밟으면 그것이 답이다', async () => {
    await record({ result: result(2, 1, 0), now: T });
    await record({ result: result(2, 1, 1), now: T + 1000 });
    const rows = run('stage.last_first_pass', { unitId: 1 }) as { stage: number; passed: number }[];
    expect(rows).toEqual([{ stage: 2, passed: 1, reviewed_at: T + 1000 }]);
    expect(run('stage.by_unit', { unitId: 1 })).toHaveLength(2);
  });

  test('1단 통과선은 mastery 의 겹을 읽는다 — 판이 없는 개념은 0겹', () => {
    db.exec(`
      INSERT INTO dictionary_version (lang, version, sha256, concept_count, loaded_at)
      VALUES ('ts', '1', 'x', 2, ${T});
      INSERT INTO concept (id, lang, name_ko, kind, track_default, dict_version_id)
      VALUES ('ts/a', 'ts', 'ㄱ', 'lang', 't0', 1), ('ts/b', 'ts', 'ㄴ', 'lang', 't0', 1);
      INSERT INTO unit_node (unit_id, concept_id, track, node_order)
      VALUES (1, 'ts/a', 't0', 0), (1, 'ts/b', 't0', 1);
      INSERT INTO mastery (concept_id, layer, updated_at) VALUES ('ts/a', 2, ${T});
    `);
    const rows = run('chapter.reading_layers', { unitId: 1 }) as { layer: number }[];
    expect(rows.map((r) => r.layer)).toEqual([2, 0]);
    const tally = readingTally(rows);
    expect(stagePasses(1, tally.asked, tally.correct)).toBe(false);
  });
});
