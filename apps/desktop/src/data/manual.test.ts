/**
 * 홈에서 손으로 거는 판 두 종류를 **진짜 SQLite** 위에서 돌린다 (02 §5.5 마지막 문단 · D88).
 *
 * `insertPlate` 의 `manual`·`gap` 갈래는 이 파일이 처음 돌린다. 여기서 확인하는 것은 셋이다:
 * ① 오늘 세션이 있으면 현재 자리 **뒤**에 들어간다 ② 뒤 판들이 밀리면서
 * `UNIQUE(session_id, pos)` 를 깨지 않는다(`shift_park`/`shift_unpark` 를 지난다)
 * ③ 세션이 없으면 세션을 먼저 열고 0번으로 들어간다.
 *
 * 시각은 **실시간**이다 — `pickPlateNow` 는 시계를 주입받지 않고 `Date.now()` 를 쓴다.
 * 그래서 만기와 `day_key` 를 고정 상수로 심으면 하루만 지나도 빨개진다.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { deriveFile } from '@chickadee/concepts';
import type { Capture } from '@chickadee/ipc-client';
import { dayKey, estMinFor } from '@chickadee/scheduler';
import {
  migrations, statements, toSqliteBindings, type ConceptId, type DayKey,
} from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

const TZ = 'Asia/Seoul';
const ROLLOVER = 4;
const DAY_MS = 86_400_000;
const ROOT = '/w/tiny';
/** Rust 덤프 — 진짜 사전으로 카드가 나오는 유일한 사용처 묶음이다 (`pipeline.test.ts` 와 같은 것). */
const FIXTURE = join(process.cwd(), 'fixtures/ipc/tiny');
const DUMPED_FILE = 'src/store/repo.ts';

/** 사전에 있는 개념 — 「판 만들기」는 여기로 실제 카드를 굽는다. */
const GAP_CONCEPT = 'ts/optional-chaining' as ConceptId;
/** 사전에 없어도 되는 개념들 — 카드를 손으로 넣으므로 생성기를 타지 않는다. */
const A = 'ts/const-declaration' as ConceptId;
const B = 'ts/array-map' as ConceptId;
const THIRD = 'ts/template-literal' as ConceptId;
/** 큐에 **없는** 개념. 「이 판 찍기」로 끼워 넣는 대상이다. */
const HAND = 'ts/nullish-default' as ConceptId;

let db: SqliteDb;
let now = Date.now();
/** `store_batch` 로 나간 statement 이름. 큐를 어떻게 밀었는지 여기에 남는다. */
let ops: string[] = [];

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
      batch: (batch: { name: string; params: unknown }[]) => {
        ops.push(...batch.map((op) => op.name));
        return Promise.resolve(db.transaction(() => batch.map((op) => run(op.name, op.params)[0]))());
      },
    },
    // 맥락 줄은 못 읽는다(픽스처 리포가 없다) — 생성기는 `excerpt` 로 물러선다.
    file: { readLines: () => Promise.reject(new Error('no file')) },
  },
  IpcError: class extends Error { code = 'X' },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
  on: () => Promise.resolve(() => undefined),
}));

const { makePlateFor, pickPlateNow } = await import('./manual.js');
const { loadPlates } = await import('./session.js');
const { useUi } = await import('../store.js');

// ───────── 픽스처 ─────────

const today = (): string => dayKey(now, TZ, ROLLOVER);

/** 개념 셋과 그 카드. 큐는 「만기 복습」만으로 세운다 — 새 판 상한을 0 으로 눌러 둔다. */
function seed(): void {
  db = new Database(':memory:');
  // 마이그레이션을 전부, 번호 순으로 태운다 — 0001 만 태우면 뒤 마이그레이션이 만든 표를
  // 쓰는 statement 가 「no such table」로 터진다.
  for (const m of [...migrations].sort((a, b) => a.version - b.version)) db.exec(m.sql);
  db.pragma('foreign_keys = ON');

  db.prepare(
    `INSERT INTO repo (id, root_path, name, fingerprint, added_at) VALUES (1, ?, 'tiny', 'r', ?)`,
  ).run(ROOT, now);
  db.prepare(
    `INSERT INTO dictionary_version (id, lang, version, sha256, concept_count, loaded_at)
     VALUES (1, 'ts', '1.0.0', 'x', 4, ?)`,
  ).run(now);
  db.prepare(`INSERT INTO file (id, repo_id, path, updated_at) VALUES (1, 1, ?, ?)`)
    .run(DUMPED_FILE, now);

  const setting = db.prepare(
    `INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)`,
  );
  setting.run('tz', JSON.stringify(TZ), now);
  // 새 판 0 장 — 큐에 무엇이 서는지를 테스트가 통제한다. 삽입 규칙은 새 판 수와 무관하다.
  setting.run('new_per_day', '0', now);

  const concept = db.prepare(
    `INSERT INTO concept (id, lang, name_ko, token, kind, track_default, dict_version_id)
     VALUES (?, 'ts', ?, ?, 'lang', 't0', 1)`,
  );
  concept.run(A, '변수 선언', 'const');
  concept.run(B, '배열 map', 'map');
  concept.run(THIRD, '문자열 끼워 넣기', '`${}`');
  concept.run(HAND, '없을 때의 기본값', '??');
  concept.run(GAP_CONCEPT, '선택적 체이닝', '?.');

  const site = db.prepare(
    `INSERT INTO concept_site (id, repo_id, file_id, concept_id, site_key, line_start, line_end,
       col_start, col_end, shape, excerpt, unknown_count, updated_at)
     VALUES (?, 1, 1, ?, ?, ?, ?, 0, 10, 'shape', ?, 0, ?)`,
  );
  site.run(1, A, 'k1', 10, 10, 'const MAX = 10', now);
  site.run(2, B, 'k2', 40, 40, 'items.map(f)', now);

  card(1, A, 1);
  card(2, B, 2);
  card(3, HAND, null);
  card(4, THIRD, null);
}

/** 손으로 넣는 카드 한 장. payload 는 큐가 읽을 수 있는 최소한만 담는다. */
function card(id: number, conceptId: string, siteId: number | null): void {
  const payload = {
    track: 't0', kind: 'point', file: DUMPED_FILE, focus: 10,
    lines: [{ n: 10, t: 'const MAX = 10' }], q: '어디를 짚을까요', hint: '한 곳',
    answer: 0, why: [null, { t: '그건 다릅니다' }], ok: '맞습니다', rule: '규칙',
    prereq: [], uses: [], promptLines: ['const MAX = 10'],
  };
  db.prepare(
    `INSERT INTO card (id, repo_id, track, kind, concept_id, level, site_id, payload_json,
                       content_hash, created_at)
     VALUES (?, 1, 't0', 'point', ?, 1, ?, ?, ?, ?)`,
  ).run(id, conceptId, siteId, JSON.stringify(payload), `h${id}`, now);
}

/** 만기 복습 후보. 이 둘이 오늘 큐다. */
function due(conceptId: string, dueAt: number): void {
  db.prepare(
    `INSERT INTO mastery (concept_id, state, stability, difficulty, due_at, last_review_at,
                          reps, lapses, layer, updated_at)
     VALUES (?, 2, 5.0, 5.0, ?, ?, 1, 0, 1, ?)`,
  ).run(conceptId, dueAt, dueAt - DAY_MS, now);
}

/**
 * 판 셋이 걸린 오늘 세션 하나. `openSession` 을 거치지 않고 손으로 세운다 —
 * 이 파일이 보려는 것은 큐를 **어떻게 밀어 넣는가**이고, 그 앞의 계획은 `session.test.ts` 것이다.
 */
function openSessionRow(): number {
  db.prepare(
    `INSERT INTO session (id, repo_id, day_key, seq_in_day, started_at, budget_min, planned_min,
                          status, plan_json)
     VALUES (1, 1, ?, 1, ?, 15, 3, 'active', '[]')`,
  ).run(today(), now);
  const item = db.prepare(
    `INSERT INTO session_item (session_id, pos, card_id, concept_id, track, role, est_min,
                               status, created_at)
     VALUES (1, ?, ?, ?, 't0', ?, 0.5, 'pending', ?)`,
  );
  item.run(0, 1, A, 'review', now);
  item.run(1, 2, B, 'review', now);
  item.run(2, 4, THIRD, 'new', now);
  return 1;
}

const req = (conceptId: ConceptId) => ({ repoId: 1, rootPath: ROOT, conceptId, siteId: null });

/** 덤프의 캡처를 사용처로 파생해 심는다 — 「판 만들기」가 진짜 사전으로 카드를 굽는 재료다. */
function seedGapSites(): void {
  interface DumpCapture {
    query_id: string; match_id: number; name: string; pattern_index: number;
    form: string | null; node_kind: string; in_error: number;
    start_byte: number; end_byte: number; start_line: number; end_line: number;
    start_col: number; end_col: number; excerpt: string;
  }
  const raw = JSON.parse(readFileSync(join(FIXTURE, 'captures.json'), 'utf8')) as DumpCapture[];
  const captures: Capture[] = raw.map((r) => ({
    queryId: r.query_id, matchId: r.match_id, name: r.name, patternIndex: r.pattern_index,
    form: r.form, nodeKind: r.node_kind, inError: r.in_error === 1,
    startByte: r.start_byte, endByte: r.end_byte, startLine: r.start_line, endLine: r.end_line,
    startCol: r.start_col, endCol: r.end_col, excerpt: r.excerpt,
  }));

  const insert = db.prepare(
    `INSERT INTO concept_site (repo_id, file_id, concept_id, site_key, line_start, line_end,
       col_start, col_end, shape, occurrence, excerpt, picks_json, hole_json, ctx_json,
       line_concepts_json, uncovered_ratio, confidence, parse_quality, unknown_count, updated_at)
     VALUES (1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ok', 0, ?)`,
  );
  const { sites } = deriveFile(DUMPED_FILE, captures);
  for (const s of sites) {
    insert.run(
      s.conceptId, s.siteKey, s.lineStart, s.lineEnd, s.colStart, s.colEnd, s.shape, s.occurrence,
      s.excerpt, JSON.stringify(s.picks), s.hole === null ? null : JSON.stringify(s.hole),
      JSON.stringify(s.ctx), JSON.stringify(s.lineConcepts), s.uncoveredRatio, s.confidence, now,
    );
  }
  expect(sites.length).toBeGreaterThan(0);

  db.prepare(
    `INSERT INTO gap (repo_id, concept_id, site_count, min_unknown, best_site_id, status, computed_at)
     VALUES (1, ?, ?, 0, (SELECT MIN(id) FROM concept_site WHERE concept_id = ?), 'open', ?)`,
  ).run(GAP_CONCEPT, sites.length, GAP_CONCEPT, now);
}

const positions = (): number[] =>
  (db.prepare('SELECT pos FROM session_item ORDER BY pos').all() as { pos: number }[])
    .map((r) => r.pos);

beforeEach(() => {
  now = Date.now();
  ops = [];
  seed();
  useUi.getState().closeSession();
  useUi.getState().say(undefined);
});

// ───────── ① · ② 오늘 세션이 있을 때 ─────────

describe('오늘 세션이 있으면', () => {
  test('「이 판 찍기」가 현재 자리 뒤에 들어가고 뒤 판들이 한 칸씩 밀린다', async () => {
    const sessionId = openSessionRow();

    const placed = await pickPlateNow(req(HAND));
    expect(placed).toEqual({
      ok: true, role: 'manual', cardId: 3, pos: 1, opened: false, reused: false,
    });

    // 현재 자리는 첫 미완 판(0번)이므로 1번에 들어간다 (02 §5.5 「현재 뒤 pos+1」).
    const plates = await loadPlates(sessionId);
    expect(plates.map((p) => [p.pos, p.role, p.cardId])).toEqual([
      [0, 'review', 1],
      [1, 'manual', 3],
      [2, 'review', 2],
      [3, 'new', 4],
    ]);
    // `UNIQUE(session_id, pos)` — 밀린 자리가 하나도 겹치지 않는다.
    expect(positions()).toEqual([0, 1, 2, 3]);
    // 한 문장으로는 못 민다. 음수로 옮겼다 되돌리는 두 statement 를 반드시 지난다.
    expect(ops).toContain('session.shift_park');
    expect(ops).toContain('session.shift_unpark');
    expect(ops.indexOf('session.shift_park')).toBeLessThan(ops.indexOf('session.item_insert'));
    // 예상 시간은 손으로 쓰지 않는다.
    expect(plates[1]?.estMin).toBe(estMinFor('t0', 'manual'));
  });

  test('같은 판을 두 번 눌러도 한 장이다 — 두 번째는 있는 자리를 돌려준다', async () => {
    const sessionId = openSessionRow();
    await pickPlateNow(req(HAND));
    const again = await pickPlateNow(req(HAND));

    expect(again).toEqual({
      ok: true, role: 'manual', cardId: 3, pos: 1, opened: false, reused: true,
    });
    expect(await loadPlates(sessionId)).toHaveLength(4);
  });

  test('교정쇄가 열려 있으면 store 의 판 목록도 다시 읽는다 (05 §3 queue-changed)', async () => {
    const sessionId = openSessionRow();
    useUi.getState().beginSession(
      {
        id: sessionId, repoId: 1, dayKey: today() as DayKey, seqInDay: 1, startedAt: now,
        endedAt: null, budgetMin: 15, plannedMin: 3, elapsedS: 0, status: 'active', plan: [],
        liferShown: 0,
      },
      await loadPlates(sessionId),
      1,
    );

    await pickPlateNow(req(HAND));
    // 화면이 1번 판을 걸고 있었으므로 그 뒤(2번)에 들어간다.
    const plates = useUi.getState().plates;
    expect(plates).toHaveLength(4);
    expect(plates[2]).toMatchObject({ pos: 2, role: 'manual', cardId: 3 });
  });

  test('「판 만들기」는 사전으로 카드를 굽고 구멍을 닫는다 (role=gap)', async () => {
    seedGapSites();
    const sessionId = openSessionRow();

    const placed = await makePlateFor(req(GAP_CONCEPT));
    if (!placed.ok) throw new Error('판을 만들지 못했다');
    expect(placed.role).toBe('gap');
    expect(placed.pos).toBe(1);
    expect(placed.reused).toBe(false);

    const made = db.prepare('SELECT concept_id, level, site_id FROM card WHERE id = ?')
      .get(placed.cardId) as { concept_id: string; level: number; site_id: number | null };
    expect(made.concept_id).toBe(GAP_CONCEPT);
    expect(made.level).toBe(1); // 첫 노출 = level 1 (02 §6.2)
    expect(made.site_id).not.toBeNull();

    // `card.gap_close` 는 `makeCard` 가 이미 부른다 — 두 번 닫지 않는다.
    expect(db.prepare('SELECT status FROM gap WHERE concept_id = ?').get(GAP_CONCEPT))
      .toEqual({ status: 'card_made' });

    const plates = await loadPlates(sessionId);
    expect(plates[1]).toMatchObject({ pos: 1, role: 'gap', conceptId: GAP_CONCEPT });
    expect(plates[1]?.estMin).toBe(estMinFor('t0', 'gap'));
    expect(positions()).toEqual([0, 1, 2, 3]);
  });
});

// ───────── ③ 세션이 없을 때 ─────────

describe('오늘 세션이 없으면', () => {
  test('세션을 먼저 열고 그 판을 0번으로 끼운다 (선택 ⓐ)', async () => {
    due(A, now - DAY_MS);
    due(B, now - DAY_MS + 1);

    const placed = await pickPlateNow(req(HAND));
    expect(placed).toEqual({
      ok: true, role: 'manual', cardId: 3, pos: 0, opened: true, reused: false,
    });

    // 큐는 `planSession` 이 짠 그대로 남고(만기 복습 둘) 그 앞에 한 장이 얹힌다.
    const store = useUi.getState();
    expect(store.session).not.toBeNull();
    expect(store.pos).toBe(0);
    expect(store.plates.map((p) => [p.pos, p.role])).toEqual([
      [0, 'manual'], [1, 'review'], [2, 'review'],
    ]);
    expect(positions()).toEqual([0, 1, 2]);
  });

  test('이미 큐에 그 카드가 있으면 두 장 걸지 않고 그 자리로 간다', async () => {
    due(HAND, now - DAY_MS);

    const placed = await pickPlateNow(req(HAND));
    expect(placed).toMatchObject({ ok: true, opened: true, reused: true, pos: 0 });
    expect(useUi.getState().plates).toHaveLength(1);
    expect(positions()).toEqual([0]);
  });

  test('큐가 비면 세션을 만들지 않는다 — 카드만 남고 그렇게 말한다', async () => {
    const placed = await pickPlateNow(req(HAND));
    expect(placed).toEqual({
      ok: true, role: 'manual', cardId: 3, pos: null, opened: false, reused: false,
    });
    expect(db.prepare('SELECT COUNT(*) AS n FROM session').get()).toEqual({ n: 0 });
    expect(useUi.getState().session).toBeNull();
  });
});

// ───────── 실패 ─────────

describe('판을 만들 수 없으면', () => {
  test('던지지 않고 사유를 돌려준다 — 큐는 그대로다', async () => {
    const sessionId = openSessionRow();
    const placed = await makePlateFor(req('zz/not-a-concept' as ConceptId));

    expect(placed).toEqual({ ok: false, reason: 'no-plate' });
    expect(await loadPlates(sessionId)).toHaveLength(3);
    expect(ops).not.toContain('session.item_insert');
  });
});
