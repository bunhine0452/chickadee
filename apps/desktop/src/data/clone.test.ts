/**
 * 클론 코스가 **원장까지** 닿는지 (D120).
 *
 * 아래 SQLite 는 진짜이고 IPC 만 모의한다 — 그래서 「코스가 원장에 무엇을 남기는가」를
 * 화면 없이 여기서 다 볼 수 있다: 세션이 `done` 으로 태어나는지, 판의 `role` 이 `manual`
 * 인지, `clone_step.review_log_id` 가 방금 쓴 원장 행을 가리키는지, 그리고 코스가
 * `card_state.stage` 와 하루 한 겹 규칙을 건드리지 않는지.
 *
 * 조각 분할 골든도 여기 있다 — `segment()` 는 `packages/cards` 의 것이고 코스는 그것을
 * 그대로 쓴다. 여기서 재는 것은 「코스가 그 결과를 `clone_step` 으로 옮기는가」다.
 */
import { createRequire } from 'node:module';

import { makeScheduler } from '@chickadee/scheduler';
import { asDayKey, migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { Dict } from '@chickadee/dictionary';
import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
const Database = require_('better-sqlite3') as new (path: string) => BetterSqlite3.Database;

const T = 1_772_755_200_000; // 2026-09-03 09:00 KST
const DAY = asDayKey('2026-09-03');
const PATH = 'src/big.ts';

/** 58줄 함수. 40줄을 넘으므로 `segment()` 가 둘로 나눈다 (04 §3.1). */
const BIG = [
  'export function big(n: number): number {',
  ...Array.from({ length: 55 }, (_, i) => `  const v${i} = n + ${i}`),
  '  return n',
  '}',
];

let db: BetterSqlite3.Database;

function run(name: string, params: unknown): unknown[] {
  const sql = (statements as Record<string, string>)[name];
  if (sql === undefined) throw new Error(`카탈로그에 없는 이름: ${name}`);
  const stmt = db.prepare(sql);
  const bound = toSqliteBindings((params ?? {}) as Record<string, unknown>);
  if (stmt.reader) return stmt.all(bound) as unknown[];
  const info = stmt.run(bound);
  return [{ changes: info.changes, lastId: Number(info.lastInsertRowid) }];
}

/** 워크트리 대신 이 배열을 읽는다. `to` 는 배타이고 줄 번호는 1부터다. */
let source: string[] = BIG;

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: (name: string, params: unknown) => Promise.resolve(run(name, params)),
      exec: (name: string, params: unknown) => Promise.resolve(run(name, params)[0]),
      batch: (ops: { name: string; params: unknown }[]) =>
        Promise.resolve(db.transaction(() => ops.map((op) => run(op.name, op.params)))()),
    },
    file: {
      readLines: (req: { from: number; to: number }) =>
        Promise.resolve({ lines: source.slice(req.from - 1, req.to - 1) }),
    },
    // 이 픽스처에는 문법 크레이트가 없다 — 04 §4.5 의 언어 폴백을 그대로 지난다.
    parse: { snippet: () => Promise.reject(new Error('no parser')) },
  },
  IpcError: class extends Error { code = 'X' },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
  on: () => Promise.resolve(() => undefined),
}));

const clone = await import('./clone.js');

/**
 * 사전은 최소로 만든다. 코스가 사전에서 읽는 것은 셋뿐이다 — `essential`(대표 개념 자격),
 * `difficulty`(동률 깨기), `dict.one_liner`(스펙 카드 ②층). 진짜 번들을 쓰면 사전이 바뀔
 * 때마다 이 테스트의 기대값이 같이 흔들린다.
 */
const dict = {
  langs: new Map([['ts', { essential: ['ts/const'] }]]),
  concepts: new Map([
    ['ts/const', {
      id: 'ts/const', lang: 'ts', name: { ko: '상수', en: 'const' }, token: 'const',
      difficulty: 2, essential: true, dict: { one_liner: '값을 다시 묶지 않는다' },
    }],
  ]),
  queries: new Map(),
  problems: [],
} as unknown as Dict;

const deps = { repoId: 1, rootPath: '/w/app', dict, dictVersion: '1.0.0', now: T, day: DAY };
const scheduler = makeScheduler({ paramsId: 1, requestRetention: 0.9 });

const rows = (sql: string): Record<string, unknown>[] =>
  db.prepare(sql).all() as Record<string, unknown>[];

function seed(): void {
  db = new Database(':memory:');
  for (const m of [...migrations].sort((a, b) => a.version - b.version)) db.exec(m.sql);
  db.pragma('foreign_keys = ON');
  db.prepare(
    `INSERT INTO repo (id, root_path, name, fingerprint, added_at) VALUES (1, '/w/app', 'app', 'r', ?)`,
  ).run(T);
  db.prepare(
    `INSERT INTO dictionary_version (id, lang, version, sha256, concept_count, loaded_at)
     VALUES (1, 'ts', '1.0.0', 'x', 1, ?)`,
  ).run(T);
  db.prepare(
    `INSERT INTO concept (id, lang, name_ko, token, kind, track_default, dict_version_id)
     VALUES ('ts/const', 'ts', '상수', 'const', 'lang', 't1', 1)`,
  ).run();
  db.prepare(
    `INSERT INTO file (id, repo_id, path, grammar, line_count, content_hash, updated_at)
     VALUES (1, 1, ?, 'typescript', ?, 'blob1', ?)`,
  ).run(PATH, BIG.length, T);
  db.prepare(
    `INSERT INTO block (id, repo_id, file_id, name, kind, line_start, line_end, text_hash, updated_at)
     VALUES (1, 1, 1, 'big', 'function', 1, ?, 'h-block', ?)`,
  ).run(BIG.length, T);
  db.prepare(
    `INSERT INTO concept_site (id, repo_id, file_id, concept_id, site_key, line_start, line_end,
                               col_start, col_end, shape, excerpt, updated_at)
     VALUES (1, 1, 1, 'ts/const', 'k1', 2, ?, 2, 8, 'decl', 'const v0', ?)`,
  ).run(BIG.length - 2, T);
  db.prepare(
    `INSERT INTO scheduler_params (id, created_at, params_json, source, is_active)
     VALUES (1, ?, '[]', 'default', 1)`,
  ).run(T);
  db.prepare(`INSERT INTO unit (id, repo_id, name, root_path, source, order_idx)
              VALUES (1, 1, 'big', 'src', 'dir', 0)`).run();
  db.prepare(`INSERT INTO unit_file (unit_id, file_id) VALUES (1, 1)`).run();
  source = BIG;
}

beforeEach(() => { seed(); });

async function startWithFirstStep(): Promise<{
  run: NonNullable<Awaited<ReturnType<typeof clone.startCourse>>>;
  step: Awaited<ReturnType<typeof clone.nextStep>>;
}> {
  const started = await clone.startCourse(deps, { kind: 'repo' });
  if (started === null) throw new Error('코스가 서지 않았다');
  return { run: started, step: await clone.nextStep(deps, started) };
}

describe('목차 (clone-order · clone-plate-lazy)', () => {
  test('코스를 열면 세션은 done 이고 예산은 0 이다 — 일일 큐가 이 세션을 집지 못한다', async () => {
    const started = await clone.startCourse(deps, { kind: 'repo' });
    expect(started?.mode).toBe('dep');
    expect(started?.steps.map((s) => s.path)).toEqual([PATH]);

    const session = rows('SELECT * FROM session')[0] as Record<string, unknown>;
    expect(session.status).toBe('done');
    expect(session.budget_min).toBe(0);
    expect(session.elapsed_s).toBe(0);
    // `session.open_today` 는 active·paused 만 돌려준다 — 코스 세션은 걸리지 않는다.
    expect(run('session.open_today', { repoId: 1, dayKey: DAY })).toEqual([]);
  });

  test('코스를 열 때는 조각을 만들지 않는다 — 목차만 선다', async () => {
    await clone.startCourse(deps, { kind: 'repo' });
    expect(rows('SELECT * FROM clone_step')).toEqual([]);
  });

  test('이어할 코스는 run_open 이 돌려준다', async () => {
    const started = await clone.startCourse(deps, { kind: 'repo' });
    const again = await clone.openCourse(1);
    expect(again?.id).toBe(started?.id);
    expect(again?.steps).toEqual(started?.steps);

    await clone.closeCourse(started?.id ?? 0, 'done', T);
    expect(await clone.openCourse(1)).toBeNull();
  });
});

describe('조각 분할 골든 (clone-plate-segment)', () => {
  test('58줄 함수는 조각 둘이 되고 본문 줄 범위가 이어 붙는다', async () => {
    const { run: started } = await startWithFirstStep();
    const steps = rows('SELECT * FROM clone_step ORDER BY seq, part');
    expect(steps.map((s) => [s.seq, s.part])).toEqual([[0, 0], [0, 1]]);
    // 본문 범위는 시그니처(1줄)와 닫힘(1줄)을 뺀 2..57 을 둘로 나눈 것이다.
    expect(steps.map((s) => [s.line_start, s.line_end])).toEqual([[2, 29], [30, 57]]);
    expect(steps.every((s) => s.block_id === 1)).toBe(true);
    expect(started.steps.length).toBe(1); // 목차는 파일 하나, 조각은 둘
  });

  test('둘째 조각은 「…이어서」 헤더로 시작하고 시그니처를 되풀이한다', async () => {
    const { run: started } = await startWithFirstStep();
    const all = await clone.courseSteps(started.id);
    const second = all[1];
    if (second === undefined) throw new Error('둘째 조각이 없다');
    const plate = await clone.buildCoursePlate(deps, second);
    if (plate === null || 'stale' in plate) throw new Error('판을 만들지 못했다');
    expect(plate.payload.original[0]).toBe('// …이어서');
    expect(plate.payload.original[1]).toBe(BIG[0]);
    expect(plate.spec.header).toBe('// …이어서');
    expect(plate.payload.blockId).toBe(1);
  });

  test('원문이 바뀌면 그 조각은 stale 이다 — text_hash 가 잡는다', async () => {
    const { step } = await startWithFirstStep();
    if (step === null) throw new Error('조각이 없다');
    source = [...BIG.slice(0, 10), '  const changed = 1', ...BIG.slice(10)];
    expect(await clone.buildCoursePlate(deps, step)).toEqual({ stale: true });
    // 안 끝낸 조각만 무효가 된다. 다시 자르는 것은 P4 다.
    expect(rows('SELECT status FROM clone_step').map((r) => r.status))
      .toEqual(['stale', 'stale']);
  });
});

describe('페이딩 (clone-fading)', () => {
  test('코스 기본은 2단계다', async () => {
    const { step } = await startWithFirstStep();
    if (step === null) throw new Error('조각이 없다');
    const plate = await clone.buildCoursePlate(deps, step);
    if (plate === null || 'stale' in plate) throw new Error('판을 만들지 못했다');
    expect(plate.stage).toBe(2);
    expect(plate.conceptId).toBe('ts/const');
  });

  test('대표 개념이 3겹이면 백지(3단계)다', async () => {
    db.prepare(
      `INSERT INTO mastery (concept_id, layer, updated_at) VALUES ('ts/const', 3, ?)`,
    ).run(T);
    const { step } = await startWithFirstStep();
    if (step === null) throw new Error('조각이 없다');
    const plate = await clone.buildCoursePlate(deps, step);
    if (plate === null || 'stale' in plate) throw new Error('판을 만들지 못했다');
    expect(plate.stage).toBe(3);
  });
});

describe('채점과 원장 (clone-grading)', () => {
  async function gradeFirst(user: readonly string[]): Promise<void> {
    const { run: started, step } = await startWithFirstStep();
    if (step === null) throw new Error('조각이 없다');
    const plate = await clone.buildCoursePlate(deps, step);
    if (plate === null || 'stale' in plate) throw new Error('판을 만들지 못했다');
    await clone.gradeCourseStep(
      deps, started, plate,
      { user, peeks: 0, downgraded: false, elapsedS: 300, durationMs: 300_000 },
      scheduler,
    );
  }

  test('완벽한 필사는 판 하나 · 원장 한 행을 남기고 role 은 manual 이다', async () => {
    const { run: started, step } = await startWithFirstStep();
    if (step === null) throw new Error('조각이 없다');
    const plate = await clone.buildCoursePlate(deps, step);
    if (plate === null || 'stale' in plate) throw new Error('판을 만들지 못했다');

    const graded = await clone.gradeCourseStep(
      deps, started, plate,
      {
        user: plate.payload.original, peeks: 0, downgraded: false,
        elapsedS: 300, durationMs: 300_000,
      },
      scheduler,
    );
    expect(graded.result.pct).toBe(100);
    expect(graded.result.verdict).toBe('advance');

    const item = rows('SELECT * FROM session_item')[0] as Record<string, unknown>;
    expect(item.role).toBe('manual');
    expect(item.track).toBe('t1');
    expect(item.session_id).toBe(started.sessionId);
    expect(item.status).toBe('done');

    const log = rows('SELECT * FROM review_log')[0] as Record<string, unknown>;
    expect(log.role).toBe('manual');
    expect(log.concept_id).toBe('ts/const');
    expect(log.ok).toBe(1);
    expect(log.session_item_id).toBe(item.id);
    expect(log.layer_before).toBe(0);
    expect(log.layer_after).toBe(1);

    // 코스 소속은 이 열이 가른다 — 원장에는 코스를 가리키는 열이 없다.
    const cloneStep = rows('SELECT * FROM clone_step ORDER BY part')[0] as Record<string, unknown>;
    expect(cloneStep.review_log_id).toBe(log.id);
    expect(cloneStep.session_item_id).toBe(item.id);
    expect(cloneStep.status).toBe('done');
    expect(cloneStep.pct).toBe(100);
    expect(cloneStep.elapsed_s).toBe(300);

    // 하루 새 판 상한(02 §5.2)은 `role='new'` 만 센다 — 코스는 거기에 안 잡힌다.
    expect(run('queue.new_count_today', { repoId: 1, day: DAY })).toEqual([{ n: 0 }]);
  });

  test('큐의 사다리를 코스가 밀지 않는다 — card_state.stage 는 그대로다', async () => {
    await gradeFirst(BIG);
    const state = rows('SELECT * FROM card_state')[0] as Record<string, unknown>;
    // 카드가 코스에서 처음 만들어졌으므로 1 이다. 코스의 2단계가 여기 새겨지지 않는다.
    expect(state.stage).toBe(1);
    expect(state.prints).toBe(1);
  });

  test('같은 개념을 오늘 큐에서 이미 올렸으면 코스가 겹을 두 번 올리지 않는다', async () => {
    // 오늘 큐가 이미 한 겹 올린 상태 — `day_ceiling` 이 오늘 천장이다 (02 §3.3 R1).
    db.prepare(
      `INSERT INTO mastery (concept_id, state, layer, day_key, day_start_layer, day_ceiling,
                            first_ok_at, last_ok_day, updated_at)
       VALUES ('ts/const', 2, 1, ?, 0, 1, ?, ?, ?)`,
    ).run(DAY, T, DAY, T);

    await gradeFirst(BIG);

    const log = rows('SELECT * FROM review_log')[0] as Record<string, unknown>;
    expect(log.layer_before).toBe(1);
    expect(log.layer_after).toBe(1);
    const mastery = rows(`SELECT * FROM mastery WHERE concept_id = 'ts/const'`)[0] as Record<string, unknown>;
    expect(mastery.layer).toBe(1);
  });

  test('같은 조각을 다시 치면 카드를 새로 만들지 않는다 — content_hash 가 같다', async () => {
    const { run: started, step } = await startWithFirstStep();
    if (step === null) throw new Error('조각이 없다');
    const plate = await clone.buildCoursePlate(deps, step);
    if (plate === null || 'stale' in plate) throw new Error('판을 만들지 못했다');
    const answer = {
      user: plate.payload.original, peeks: 0, downgraded: false,
      elapsedS: 300, durationMs: 300_000,
    };
    await clone.gradeCourseStep(deps, started, plate, answer, scheduler);
    await clone.gradeCourseStep(deps, started, plate, answer, scheduler);

    expect(rows('SELECT * FROM card').length).toBe(1);
    expect(rows('SELECT * FROM review_log').length).toBe(2);
    // 판 자리는 겹치지 않는다 — `UNIQUE(session_id, pos)` 를 스스로 지킨다.
    expect(rows('SELECT pos FROM session_item ORDER BY pos').map((r) => r.pos)).toEqual([0, 1]);
  });

  test('사전에 있는 필수 문법이 조각에 없으면 원장에 아무것도 안 쓴다', async () => {
    db.prepare(`UPDATE concept_site SET is_alive = 0`).run();
    const { run: started, step } = await startWithFirstStep();
    if (step === null) throw new Error('조각이 없다');
    const plate = await clone.buildCoursePlate(deps, step);
    if (plate === null || 'stale' in plate) throw new Error('판을 만들지 못했다');
    expect(plate.conceptId).toBeNull();

    const graded = await clone.gradeCourseStep(
      deps, started, plate,
      { user: plate.payload.original, peeks: 0, downgraded: false, elapsedS: 60, durationMs: 60_000 },
      scheduler,
    );
    expect(graded.finish).toBeNull();
    expect(graded.result.pct).toBe(100);
    expect(rows('SELECT * FROM review_log')).toEqual([]);
    const cloneStep = rows('SELECT * FROM clone_step ORDER BY part')[0] as Record<string, unknown>;
    expect(cloneStep.status).toBe('done');
    expect(cloneStep.review_log_id).toBeNull();
  });
});

describe('이어하기 (clone-resume)', () => {
  test('초안은 조각에 남고 다음에 칠 조각은 그 자리다', async () => {
    const { run: started, step } = await startWithFirstStep();
    if (step === null) throw new Error('조각이 없다');
    await clone.saveDraft(step.id, 42, 'export function big(');

    const back = await clone.nextStep(deps, started);
    expect(back?.id).toBe(step.id);
    expect(back?.draft_text).toBe('export function big(');
    expect(back?.elapsed_s).toBe(42);
  });

  test('앞 조각을 마치면 다음 조각으로 넘어간다', async () => {
    const { run: started, step } = await startWithFirstStep();
    if (step === null) throw new Error('조각이 없다');
    const plate = await clone.buildCoursePlate(deps, step);
    if (plate === null || 'stale' in plate) throw new Error('판을 만들지 못했다');
    await clone.gradeCourseStep(
      deps, started, plate,
      {
        user: plate.payload.original, peeks: 0, downgraded: false,
        elapsedS: 300, durationMs: 300_000,
      },
      scheduler,
    );
    const next = await clone.nextStep(deps, started);
    expect(next?.part).toBe(1);
    expect(await clone.courseProgress(started.id)).toEqual({ total: 2, done: 1, elapsedS: 300 });
  });
});
