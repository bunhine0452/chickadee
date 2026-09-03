/**
 * 세션 한 흐름을 **진짜 SQLite** 위에서 돌린다 — 인쇄 시작 → 채점 → 겹 → 다시 찍기 →
 * Esc → 이어 찍기 → 요약, 그리고 `rebuild_mastery == mastery`.
 *
 * IPC 만 모의한다(`store_query`·`store_exec`·`store_batch` 를 better-sqlite3 로 돌린다).
 * 카드 생성기는 포트라 여기서 손으로 만든 카드를 돌려준다 — 이 파일이 검증하는 것은
 * **원장과 큐**이지 카드 문구가 아니다.
 */
import { createRequire } from 'node:module';

import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

/** 2026-09-03 09:00 KST — 하루 경계 04:00 을 이미 지난 시각. */
const T = 1_772_755_200_000;
const DAY_MS = 86_400_000;
const TZ = 'Asia/Seoul';

let db: SqliteDb;

function run(name: string, params: unknown): unknown[] {
  const sql = (statements as Record<string, string>)[name];
  if (sql === undefined) throw new Error(`카탈로그에 없는 이름: ${name}`);
  const stmt = db.prepare(sql);
  const bound = toSqliteBindings((params ?? {}) as Record<string, unknown>);
  if (stmt.reader) return stmt.all(bound) as unknown[];
  const info = stmt.run(bound);
  return [{ changes: info.changes, lastId: Number(info.lastInsertRowid) }];
}

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: (name: string, params: unknown) => Promise.resolve(run(name, params)),
      exec: (name: string, params: unknown) => Promise.resolve(run(name, params)[0]),
      batch: (ops: { name: string; params: unknown }[]) =>
        Promise.resolve(db.transaction(() => ops.map((op) => run(op.name, op.params)[0]))()),
    },
  },
  IpcError: class extends Error {},
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
  on: () => Promise.resolve(() => undefined),
}));

const { emptyMastery, finishPlate } = await import('./plate.js');
import type { CardMaker, Plate } from './session.js';

const {
  loadMastery, loadPlates, openSession, insertRetry, saveItem, saveSession, today,
} = await import('./session.js');
const { loadSummary } = await import('./summary.js');
const { loadSettings, loadScheduler } = await import('./settings.js');
const { rebuildMastery, diffMastery, makeScheduler } = await import('@chickadee/scheduler');
const { fromMasteryRow, fromReviewLogRow } = await import('@chickadee/store-sql');

// ───────── 픽스처 ─────────

const CONCEPTS = ['ts/const-declaration', 'ts/optional-chaining', 'ts/array-map'] as const;

function seed(): void {
  const init = migrations.find((m) => m.version === 1);
  if (!init) throw new Error('0001_init.sql 이 카탈로그에 없다');
  db = new Database(':memory:');
  db.exec(init.sql);
  db.pragma('foreign_keys = ON');

  db.prepare(
    `INSERT INTO repo (id, root_path, name, fingerprint, added_at)
     VALUES (1, '/work/cart-shop', 'cart-shop', 'root1', ?)`,
  ).run(T);
  db.prepare(
    `INSERT INTO dictionary_version (id, lang, version, sha256, concept_count, loaded_at)
     VALUES (1, 'ts', '1.0.0', 'x', 3, ?)`,
  ).run(T);
  db.prepare(`INSERT INTO file (id, repo_id, path, updated_at) VALUES (1, 1, 'src/cart.ts', ?)`).run(T);

  const concept = db.prepare(
    `INSERT INTO concept (id, lang, name_ko, token, kind, track_default, dict_version_id)
     VALUES (?, 'ts', ?, ?, 'lang', 't0', 1)`,
  );
  concept.run(CONCEPTS[0], '변수 선언', 'const');
  concept.run(CONCEPTS[1], '선택적 체이닝', '?.');
  concept.run(CONCEPTS[2], '배열 map', 'map');
  db.prepare(`INSERT INTO concept_prereq (concept_id, prereq_id) VALUES (?, ?)`)
    .run(CONCEPTS[1], CONCEPTS[0]);

  const site = db.prepare(
    `INSERT INTO concept_site (id, repo_id, file_id, concept_id, site_key, line_start, line_end,
       col_start, col_end, shape, excerpt, unknown_count, updated_at)
     VALUES (?, 1, 1, ?, ?, ?, ?, 0, 10, 'shape', ?, ?, ?)`,
  );
  site.run(1, CONCEPTS[0], 'k1', 10, 10, 'const MAX = 10', 0, T);
  site.run(2, CONCEPTS[1], 'k2', 27, 27, 'user?.name', 1, T);
  site.run(3, CONCEPTS[2], 'k3', 40, 40, 'items.map(f)', 2, T);
}

let nextCard = 0;
function makeCard(conceptId: string, siteId: number, level = 1): number {
  nextCard += 1;
  const payload = {
    track: 't0', kind: 'point', file: 'src/cart.ts', focus: 10,
    lines: [{ n: 10, t: 'const MAX = 10' }], q: '어디를 짚을까요', hint: '한 곳',
    answer: 0, why: [null, { t: '그건 다릅니다' }], ok: '맞습니다', rule: '규칙',
    prereq: [], uses: [], promptLines: ['const MAX = 10'],
  };
  db.prepare(
    `INSERT INTO card (id, repo_id, track, kind, concept_id, level, site_id, payload_json,
                       content_hash, created_at)
     VALUES (?, 1, 't0', 'point', ?, ?, ?, ?, ?, ?)`,
  ).run(nextCard, conceptId, level, siteId, JSON.stringify(payload), `h${nextCard}`, T);
  return nextCard;
}

/** 카드가 없으면 그 자리에서 만든다 — 진짜 생성기가 하는 일의 자리다. */
const maker: CardMaker = {
  forReview: (conceptId) => {
    const row = db.prepare(
      `SELECT id FROM card WHERE repo_id = 1 AND concept_id = ? AND retired_at IS NULL LIMIT 1`,
    ).get(conceptId) as { id: number } | undefined;
    if (!row) return Promise.resolve(null);
    return Promise.resolve({ cardId: row.id, conceptId, track: 't0' as const, role: 'review' as const, estMin: 0.5 });
  },
  forNew: (conceptId, siteId) =>
    Promise.resolve({
      cardId: makeCard(conceptId, siteId),
      conceptId, track: 't0' as const, role: 'new' as const, estMin: 2,
    }),
};

async function settings() {
  const s = await loadSettings();
  return { ...s, tz: TZ };
}

/** 판 하나를 마친다. `ok`·`dunno` 만 바꿔 가며 부른다. */
async function answer(plate: Plate, opts: { ok: boolean; dunno?: boolean; at: number }) {
  const s = await settings();
  const scheduler = await loadScheduler(opts.at, s.desiredRetention);
  const mastery = (await loadMastery([plate.conceptId])).get(plate.conceptId)
    ?? emptyMastery(plate.conceptId, null);
  return finishPlate({
    repoId: 1,
    sessionId: 1,
    item: plate,
    state: { sel: 0, answered: true },
    mastery,
    scheduler,
    now: opts.at,
    day: today(opts.at, s),
    ok: opts.ok,
    dunno: opts.dunno ?? false,
    transfer: false,
    detail: { track: 't0', sel: 0, answer: 0, kind: 'point' },
    durationMs: 12_000,
    elapsedS: 12,
    ...(opts.dunno ? { dunnoEvent: { answeredBefore: true, wasCorrect: opts.ok, maxRung: 2 as const } } : {}),
    site: { filePath: 'src/cart.ts', lineNo: 10 },
    liferShown: 0,
  });
}

beforeEach(() => {
  seed();
  nextCard = 0;
  db.prepare(`INSERT INTO settings (key, value_json, updated_at) VALUES ('tz', ?, ?)`)
    .run(JSON.stringify(TZ), T);
});

// ───────── 흐름 ─────────

describe('인쇄 시작', () => {
  test('새 개념 후보로 큐가 서고 세션·항목이 원장에 남는다', async () => {
    const view = await openSession(1, T, maker);
    expect(view).not.toBeNull();
    expect(view?.session.status).toBe('active');
    expect(view?.plates.length).toBeGreaterThan(0);
    expect(view?.plates.every((p) => p.role === 'new')).toBe(true);
    // 하루 상한 2 장 (D12).
    expect(view?.plates).toHaveLength(2);
    // 선행이 먼저 나온다 — `const` 는 `?.` 의 아래층이다.
    expect(view?.plates[0]?.conceptId).toBe(CONCEPTS[0]);
  });

  test('찍을 것이 없으면 세션을 만들지 않는다 (§5.3 빈 상태)', async () => {
    db.exec('DELETE FROM concept_site');
    expect(await openSession(1, T, maker)).toBeNull();
    expect(db.prepare('SELECT COUNT(*) AS n FROM session').get()).toEqual({ n: 0 });
  });

  test('진행바 전체 길이는 판의 예상 시간 합이다', async () => {
    const view = await openSession(1, T, maker);
    const sum = view?.plates.reduce((a, p) => a + p.estMin, 0) ?? 0;
    expect(view?.session.plannedMin).toBeCloseTo(sum, 5);
  });
});

describe('채점 → 겹 → 원장', () => {
  test('첫 정답은 1겹 · LIFER · Hard 등급이다', async () => {
    const view = await openSession(1, T, maker);
    const plate = view?.plates[0];
    if (!plate) throw new Error('판이 없다');

    const r = await answer(plate, { ok: true, at: T });
    expect(r.move.after).toBe(1);
    expect(r.grade).toBe(2); // 객관식 첫 정답은 인식이지 회상이 아니다
    expect(r.lifer).toBe(true);
    expect(r.ceremony).toBe(true);

    const log = fromReviewLogRow(db.prepare('SELECT * FROM review_log').get() as Record<string, unknown>);
    expect(log.conceptId).toBe(plate.conceptId);
    expect(log.layerBefore).toBe(0);
    expect(log.layerAfter).toBe(1);
    expect(log.ok).toBe(true);

    const item = db.prepare('SELECT review_log_id, status FROM session_item WHERE id = ?').get(plate.id);
    expect(item).toEqual({ review_log_id: log.id, status: 'done' });

    const lifer = db.prepare('SELECT concept_id, file_path, shown_at FROM lifer').get();
    expect(lifer).toEqual({ concept_id: plate.conceptId, file_path: 'src/cart.ts', shown_at: T });
  });

  test('오답이면 겹이 그대로이고 다시 찍기가 3자리 뒤에 들어간다', async () => {
    const view = await openSession(1, T, maker);
    const plate = view?.plates[0];
    if (!plate || !view) throw new Error('판이 없다');

    const r = await answer(plate, { ok: false, at: T });
    expect(r.move.after).toBe(0);
    expect(r.grade).toBe(1);
    expect(r.lifer).toBe(false);

    const inserted = await insertRetry(view.session.id, plate.pos, plate.id,
      { id: plate.cardId, conceptId: plate.conceptId, track: 't0' }, T);
    expect(inserted).toBe(true);

    const plates = await loadPlates(view.session.id);
    const retry = plates.find((p) => p.role === 'retry');
    expect(retry?.pos).toBe(Math.min(plates.length - 1, plate.pos + 3));
    expect(retry?.parentItemId).toBe(plate.id);

    // 같은 판의 다시 찍기는 한 번뿐이다 (02 §4).
    expect(await insertRetry(view.session.id, plate.pos, plate.id,
      { id: plate.cardId, conceptId: plate.conceptId, track: 't0' }, T)).toBe(false);
  });

  test('오답 뒤 다시 찍기 정답은 회복만 한다 — 첫 겹은 찍힌다 (R5)', async () => {
    const view = await openSession(1, T, maker);
    const plate = view?.plates[0];
    if (!plate) throw new Error('판이 없다');

    await answer(plate, { ok: false, at: T });
    const retry = await answer({ ...plate, role: 'retry' }, { ok: true, at: T + 60_000 });
    expect(retry.move.after).toBe(1);
    expect(retry.lifer).toBe(true);
    // 다시 찍기로 처음 맞힌 것이라 연출은 요약으로 미룬다 (D76).
    expect(retry.ceremony).toBe(false);
    expect(db.prepare('SELECT shown_at FROM lifer').get()).toEqual({ shown_at: null });
  });

  test('모르겠어요는 답을 맞혔어도 Again 이고 `ok` 는 원래 값이다', async () => {
    const view = await openSession(1, T, maker);
    const plate = view?.plates[0];
    if (!plate) throw new Error('판이 없다');

    const r = await answer(plate, { ok: true, dunno: true, at: T });
    expect(r.grade).toBe(1);
    expect(r.move.after).toBe(0);
    const log = db.prepare('SELECT ok, dunno FROM review_log').get();
    expect(log).toEqual({ ok: 1, dunno: 1 });
  });
});

describe('중단 · 복구 (§5.6)', () => {
  test('Esc 로 나갔다 돌아오면 N번째 판부터 이어 찍는다', async () => {
    const first = await openSession(1, T, maker);
    if (!first) throw new Error('세션이 없다');
    const plate = first.plates[0];
    if (!plate) throw new Error('판이 없다');

    await answer(plate, { ok: true, at: T });
    await saveSession(first.session, 'paused', 30, first.session.plannedMin, null, 1);

    const again = await openSession(1, T + 600_000, maker);
    expect(again?.session.id).toBe(first.session.id);
    expect(again?.pos).toBe(1);
    expect(again?.plates[0]?.status).toBe('done');
  });

  test('강제 종료(저장 없이 끊김) 뒤에도 마친 판은 남는다', async () => {
    const first = await openSession(1, T, maker);
    const plate = first?.plates[0];
    if (!first || !plate) throw new Error('판이 없다');
    await answer(plate, { ok: true, at: T });
    // `session.update` 를 부르지 못하고 죽었다 — 세션은 여전히 `active` 다.
    const again = await openSession(1, T + 60_000, maker);
    expect(again?.session.id).toBe(first.session.id);
    expect(again?.pos).toBe(1);
  });

  test('날이 바뀌면 어제 세션을 버리고 새로 짠다', async () => {
    const first = await openSession(1, T, maker);
    if (!first) throw new Error('세션이 없다');
    await saveSession(first.session, 'paused', 30, first.session.plannedMin, null, 0);

    const next = await openSession(1, T + DAY_MS, maker);
    expect(next?.session.id).not.toBe(first.session.id);
    const old = db.prepare('SELECT status FROM session WHERE id = ?').get(first.session.id);
    expect(old).toEqual({ status: 'abandoned' });
    const leftovers = db.prepare(
      `SELECT COUNT(*) AS n FROM session_item WHERE session_id = ? AND status IN ('pending','active')`,
    ).get(first.session.id);
    expect(leftovers).toEqual({ n: 0 });
  });

  test('하루에 두 번째 세션은 `seq_in_day` 가 오른다', async () => {
    const first = await openSession(1, T, maker);
    if (!first) throw new Error('세션이 없다');
    for (const p of first.plates) await answer(p, { ok: true, at: T });
    await saveSession(first.session, 'done', 60, first.session.plannedMin, T + 60_000, 0);

    // 새 판 상한을 다 썼으므로 두 번째 세션은 만기 복습만으로 서거나 아예 안 선다.
    const second = await openSession(1, T + 3_600_000, maker);
    if (second) expect(second.session.seqInDay).toBe(2);
    else expect(db.prepare('SELECT COUNT(*) AS n FROM session').get()).toEqual({ n: 1 });
  });

  test('판 내부 상태가 저장된다 — 고른 보기와 사다리 단', async () => {
    const view = await openSession(1, T, maker);
    const plate = view?.plates[0];
    if (!view || !plate) throw new Error('판이 없다');
    await saveItem(plate.id, 'active', 7, { sel: 2, rung: 3 });
    const again = await loadPlates(view.session.id);
    expect(again[0]?.state).toEqual({ sel: 2, rung: 3 });
    expect(again[0]?.elapsedS).toBe(7);
  });
});

describe('요약과 원장 재생', () => {
  test('요약이 움직인 잉크와 LIFER 를 보여 준다', async () => {
    const view = await openSession(1, T, maker);
    if (!view) throw new Error('세션이 없다');
    for (const p of view.plates) await answer(p, { ok: true, at: T });

    const s = await settings();
    const summary = await loadSummary(1, view.session.id, view.session.startedAt, T, s);
    expect(summary.plates).toBe(view.plates.length);
    expect(summary.exact).toBe(view.plates.length);
    expect(summary.shifts).toHaveLength(view.plates.length);
    expect(summary.shifts[0]).toMatchObject({ from: 0, to: 1, nextLabel: '내일' });
    expect(summary.lifers.map((l) => l.serial)).toEqual([1, 2]);
  });

  test('`rebuild_mastery()` 가 캐시와 정확히 같다', async () => {
    const view = await openSession(1, T, maker);
    if (!view) throw new Error('세션이 없다');
    const plates = view.plates;
    await answer(plates[0] as Plate, { ok: true, at: T });
    await answer(plates[1] as Plate, { ok: false, at: T + 30_000 });
    await answer({ ...(plates[1] as Plate), role: 'retry' }, { ok: true, at: T + 90_000 });
    await answer(plates[0] as Plate, { ok: true, dunno: true, at: T + 120_000 });

    const logs = db.prepare('SELECT * FROM review_log ORDER BY id').all() as Record<string, unknown>[];
    const cached = (db.prepare('SELECT * FROM mastery').all() as Record<string, unknown>[])
      .map(fromMasteryRow);
    const replayed = rebuildMastery(
      logs.map(fromReviewLogRow),
      (paramsId) => makeScheduler({ paramsId }),
    );
    expect(diffMastery(cached, replayed)).toEqual([]);
  });
});
