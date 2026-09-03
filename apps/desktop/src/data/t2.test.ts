/**
 * T2 판 한 장을 **원장까지** 마친다 (M4 「끝났다는 증거」).
 *
 * `data/t1.test.ts` 와 같은 틀이다: SQLite 는 진짜이고 IPC 만 모의한다 — 그래서 「이것도
 * 맞다」가 실제로 `appeal` 에 남는지, 그 행이 방금 쓴 `review_log` 를 가리키는지(D84),
 * 그리고 **`grade.pct` 를 실어 보냈는지**를 여기서 확인할 수 있다.
 *
 * 마지막 것이 이 파일이 있는 진짜 이유다. `gradeFor` 는 `pct ?? 0` 을 보므로 `pct` 를
 * 빠뜨리면 100 % 답안이 등급 1(Again)이 되고 FSRS 간격이 통째로 무너진다 — M3 에서 T1 이
 * 그렇게 깨졌고 테스트 하나가 우연히 잡았다. T2 는 우연에 맡기지 않는다.
 */
import { createRequire } from 'node:module';

import { diffMastery, makeScheduler, rebuildMastery } from '@chickadee/scheduler';
import {
  asDayKey, fromMasteryRow, fromReviewLogRow, migrations, statements, toSqliteBindings,
} from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
const Database = require_('better-sqlite3') as new (path: string) => BetterSqlite3.Database;

const T = 1_772_755_200_000; // 2026-09-03 09:00 KST
const TZ = 'Asia/Seoul';

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

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: (name: string, params: unknown) => Promise.resolve(run(name, params)),
      exec: (name: string, params: unknown) => Promise.resolve(run(name, params)[0]),
      batch: (ops: { name: string; params: unknown }[]) =>
        Promise.resolve(db.transaction(() => ops.map((op) => run(op.name, op.params)))()),
    },
    git: { diffText: () => Promise.reject(new Error('no diff')) },
  },
  IpcError: class extends Error { code = 'X' },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
  on: () => Promise.resolve(() => undefined),
}));

const { finishT2Plate, gradeT2Plate } = await import('../session-flow.js');
const { useUi } = await import('../store.js');
const { loadPlates } = await import('./session.js');

const P = {
  page: 'app/cart/page.tsx',
  sheet: 'features/cart/CartSheet.tsx',
  row: 'features/cart/CartItemRow.tsx',
  stepper: 'features/cart/QuantityStepper.tsx',
  hook: 'features/cart/useCartQuantity.ts',
  api: 'features/cart/cartApi.ts',
  route: 'app/api/cart/route.ts',
  repo: 'server/cartRepo.ts',
  schema: 'server/schema.ts',
  useCart: 'features/cart/useCart.ts',
  button: 'components/ui/Button.tsx',
  format: 'lib/format.ts',
} as const;

/** 목업 `T2` 의 cart 지도. core 6 · sec 1 · trap 나머지 (04 §9 T2 골든과 같은 값). */
const PAYLOAD = {
  track: 't2',
  kind: 'placement',
  q: '«장바구니 수량 +/- 조절 기능 추가» 기능을 넣는다면, 어느 파일들을 고쳐야 할까요?',
  hint: '지도에서 파일 상자를 클릭해 고릅니다. 정답 개수는 비공개입니다.',
  bands: [
    { l: '화면', s: 'app/cart/' },
    { l: '기능', s: 'features/cart/' },
    { l: '동작 · 통신', s: '' },
    { l: '공용 · 데이터', s: 'server/' },
  ],
  files: [
    { p: P.page, r: 0 },
    { p: P.sheet, r: 1 },
    { p: P.row, r: 1 },
    { p: P.stepper, r: 1, isNew: true },
    { p: P.hook, r: 2, isNew: true },
    { p: P.api, r: 2 },
    { p: P.route, r: 2 },
    { p: P.useCart, r: 2 },
    { p: P.repo, r: 3 },
    { p: P.schema, r: 3 },
    { p: P.button, r: 3 },
    { p: P.format, r: 3 },
  ],
  edges: [
    [P.page, P.sheet, 'static'],
    [P.sheet, P.row, 'static'],
    [P.row, P.stepper, 'static'],
    [P.stepper, P.hook, 'static'],
    [P.hook, P.api, 'static'],
    [P.api, P.route, 'http'],
    [P.route, P.repo, 'static'],
    [P.repo, P.schema, 'type'],
    [P.sheet, P.useCart, 'static'],
    [P.useCart, P.api, 'static'],
    [P.stepper, P.button, 'static'],
    [P.row, P.format, 'static'],
  ],
  commit: { h: 'a3f19c2', d: '2026-07-14', m: 'feat(cart): 수량 조절', n: '파일 7개 · +181 −23' },
  core: {
    [P.stepper]: ['+64 −0', '새로 만든 파일입니다.'],
    [P.hook]: ['+41 −0', '새로 만든 파일입니다.'],
    [P.row]: ['+9 −4', '13줄이 바뀌었습니다.'],
    [P.api]: ['+18 −1', '19줄이 바뀌었습니다.'],
    [P.route]: ['+27 −2', '29줄이 바뀌었습니다.'],
    [P.repo]: ['+14 −0', '14줄이 바뀌었습니다.'],
  },
  sec: { [P.schema]: ['+4 −1', '몇 줄만 고쳐졌습니다.'] },
  trap: {
    [P.sheet]: '«CartSheet.tsx» 는 «CartItemRow.tsx» 를 놓기만 합니다.',
    [P.page]: '«page.tsx» 는 «CartSheet.tsx» 를 놓기만 합니다.',
    [P.button]: '공용 부품. «QuantityStepper.tsx» 가 가져다 쓸 뿐입니다',
    [P.format]: '공용 부품. «CartItemRow.tsx» 가 가져다 쓸 뿐입니다',
    [P.useCart]: '«useCart.ts» 에 상태가 있지만 이번엔 새 파일 «QuantityStepper.tsx» 이 그 일을 맡았습니다',
  },
  hints: ['3개 층에 걸쳐 있습니다.', '새 파일이 2개 있습니다.', '꼭 고쳐야 하는 파일은 6개입니다.'],
};

function seed(): void {
  const init = migrations.find((m) => m.version === 1);
  if (!init) throw new Error('0001_init.sql 이 카탈로그에 없다');
  db = new Database(':memory:');
  db.exec(init.sql);
  db.pragma('foreign_keys = ON');
  db.prepare(
    `INSERT INTO repo (id, root_path, name, fingerprint, added_at) VALUES (1, '/w/app', 'app', 'r', ?)`,
  ).run(T);
  db.prepare(
    `INSERT INTO dictionary_version (id, lang, version, sha256, concept_count, loaded_at)
     VALUES (1, 'arch', '1.0.0', 'x', 1, ?)`,
  ).run(T);
  db.prepare(`INSERT INTO settings (key, value_json, updated_at) VALUES ('tz', ?, ?)`)
    .run(JSON.stringify(TZ), T);
  db.prepare(
    `INSERT INTO concept (id, lang, name_ko, token, kind, track_default, dict_version_id)
     VALUES ('arch/placement', 'arch', '책임 배치', NULL, 'universal', 't2', 1)`,
  ).run();
  db.prepare(
    `INSERT INTO unit (id, repo_id, name, root_path, source) VALUES (1, 1, 'cart', 'features/cart', 'dir')`,
  ).run();
  db.prepare(
    `INSERT INTO card (id, repo_id, unit_id, track, kind, concept_id, level, payload_json,
                       content_hash, created_at)
     VALUES (1, 1, 1, 't2', 'placement', 'arch/placement', 1, ?, 'h2', ?)`,
  ).run(JSON.stringify(PAYLOAD), T);
  db.prepare(`INSERT INTO card_state (card_id, prints, stage) VALUES (1, 0, 1)`).run();
  db.prepare(
    `INSERT INTO session (id, repo_id, day_key, seq_in_day, started_at, budget_min, planned_min,
                          status, plan_json)
     VALUES (1, 1, '2026-09-03', 1, ?, 15, 4, 'active', '[]')`,
  ).run(T);
  db.prepare(
    `INSERT INTO session_item (id, session_id, pos, card_id, concept_id, track, role, est_min, created_at)
     VALUES (1, 1, 0, 1, 'arch/placement', 't2', 'new', 4, ?)`,
  ).run(T);
}

async function open(): Promise<void> {
  seed();
  const plates = await loadPlates(1);
  const row = db.prepare('SELECT * FROM session WHERE id = 1').get() as Record<string, unknown>;
  useUi.getState().beginSession(
    {
      id: 1, repoId: 1, dayKey: asDayKey('2026-09-03'), seqInDay: 1,
      startedAt: row.started_at as number, endedAt: null, budgetMin: 15, plannedMin: 4,
      elapsedS: 0, status: 'active', plan: [], liferShown: 0,
    },
    plates,
    0,
  );
}

const rows = (sql: string): Record<string, unknown>[] =>
  db.prepare(sql).all() as Record<string, unknown>[];

const CORE = [P.stepper, P.hook, P.row, P.api, P.route, P.repo];

beforeEach(async () => {
  await open();
});

describe('T2 판 한 장 (04 §8 · 02 §4)', () => {
  test('core 를 다 고르면 진급이고 원장에 그대로 남는다', async () => {
    const graded = gradeT2Plate({ kind: 'placement', selected: CORE }, 0);
    expect(graded?.pct).toBe(100);
    expect(graded?.verdict).toBe('advance');

    const done = await finishT2Plate(graded!, [], 240_000);
    expect(done?.correct).toBe(true);
    // 0겹 → 1겹. 첫 성공이라 LIFER 행도 선다.
    expect(done?.layer).toEqual([0, 1]);

    const log = rows('SELECT * FROM review_log')[0] as Record<string, unknown>;
    expect(log.track).toBe('t2');
    expect(log.ok).toBe(1);
    const detail = JSON.parse(log.detail_json as string) as Record<string, unknown>;
    expect(detail.track).toBe('t2');
    expect(detail.pct).toBe(100);
    expect(detail.found).toHaveLength(6);
    expect(detail.missed).toEqual([]);
    expect(detail.more).toBe(false);

    expect(rows('SELECT * FROM lifer')).toHaveLength(1);
  });

  test('**`grade.pct` 를 실어 보낸다** — 100 % 가 Again 이 되지 않는다 (M3 지뢰)', async () => {
    const graded = gradeT2Plate({ kind: 'placement', selected: CORE }, 0);
    await finishT2Plate(graded!, [], 240_000);
    const log = rows('SELECT * FROM review_log')[0] as Record<string, unknown>;
    // `pct` 가 안 실리면 `gradeFor` 가 `pct ?? 0` → 0 으로 읽어 등급 1(Again)이 된다.
    expect(log.grade).not.toBe(1);
    expect(log.grade).toBe(3); // Good — 첫 성공이 아니면 Hard 지만 여기선 전이가 없다
    // 간격이 실제로 벌어졌는지 — Again 이면 오늘 안이다.
    expect(log.due_after as number).toBeGreaterThan(T);
  });

  test('04 §9 T2 골든 — 5개 골라 pct 67 · repeat-soft, 원장도 같은 값', async () => {
    const picked = [P.stepper, P.hook, P.row, P.api, P.sheet];
    const graded = gradeT2Plate({ kind: 'placement', selected: picked }, 0);
    expect(graded?.pct).toBe(67);
    expect(graded?.verdict).toBe('repeat-soft');
    expect(graded?.found).toHaveLength(4);
    expect(graded?.missed.sort()).toEqual([P.route, P.repo].sort());
    expect(graded?.wrong).toEqual([P.sheet]);

    const done = await finishT2Plate(graded!, [], 240_000);
    // 85 를 못 넘었으므로 겹은 그대로다 (02 §4 T2 행).
    expect(done?.correct).toBe(false);
    expect(done?.layer).toEqual([0, 0]);
    const detail = JSON.parse(
      (rows('SELECT * FROM review_log')[0] as Record<string, unknown>).detail_json as string,
    ) as Record<string, unknown>;
    expect(detail.pct).toBe(67);
  });

  test('04 §9 T2 골든 — 12개 전부 고르면 pct 100 이어도 진급하지 않는다 (wrong 5 > 3)', async () => {
    const all = PAYLOAD.files.map((f) => f.p);
    expect(all).toHaveLength(12);
    const graded = gradeT2Plate({ kind: 'placement', selected: all }, 0);
    expect(graded?.pct).toBe(100);
    // core 6 · sec 1 · wrong 5. `ceil(6/2) = 3` 이라 5 > 3 → 진급 금지.
    expect(graded?.wrong).toHaveLength(5);
    expect(graded?.verdict).not.toBe('advance');
    expect(graded?.capped).not.toBeNull();

    const done = await finishT2Plate(graded!, [], 240_000);
    expect(done?.correct).toBe(false);
    expect(done?.layer).toEqual([0, 0]);
  });

  test('「이것도 맞다」가 파일마다 한 행씩, 방금 쓴 원장을 가리킨다 (04 §8.4 · D84)', async () => {
    const picked = [...CORE, P.sheet, P.page];
    const graded = gradeT2Plate({ kind: 'placement', selected: picked }, 0);
    expect(graded?.wrong.sort()).toEqual([P.sheet, P.page].sort());
    // wrong 2 ≤ ceil(6/2) = 3 이라 상한에 안 걸린다 — 이의는 진급과 무관하다.
    expect(graded?.verdict).toBe('advance');

    const done = await finishT2Plate(graded!, graded!.wrong, 240_000);
    expect(done).not.toBeNull();

    const log = rows('SELECT * FROM review_log')[0] as Record<string, unknown>;
    const appeals = rows('SELECT * FROM appeal ORDER BY user_text');
    expect(appeals).toHaveLength(2);
    for (const appeal of appeals) {
      expect(appeal.review_log_id).toBe(log.id);
      expect(appeal.track).toBe('t2');
      expect(appeal.auto_verdict).toBe('wrong-pick');
      // T2 의 이의는 줄이 아니라 **파일**이다.
      expect(appeal.line_no).toBeNull();
      expect(appeal.status).toBe('open');
    }
    expect(appeals.map((a) => a.user_text).sort()).toEqual([P.sheet, P.page].sort());

    // 점수는 이의로 변하지 않는다 (02 §4 이의 행).
    const detail = JSON.parse(log.detail_json as string) as Record<string, unknown>;
    expect(detail.pct).toBe(100);
    expect(detail.more).toBe(true);
  });

  test('힌트는 감점이 아니라 등급 신호다 — 세 번 쓰면 Good 이 Hard 로 내려간다', async () => {
    const graded = gradeT2Plate({ kind: 'placement', selected: CORE }, 3);
    expect(graded?.pct).toBe(100);
    await finishT2Plate(graded!, [], 240_000);
    const log = rows('SELECT * FROM review_log')[0] as Record<string, unknown>;
    expect(log.ok).toBe(1);
    // 02 §4 「힌트 횟수가 임계를 넘으면 Good→Hard」.
    expect(log.grade).toBe(2);
  });

  test('Q4 재생 — `rebuild_mastery()` 가 캐시와 정확히 같다 (T2 까지 확장, diff 0)', async () => {
    const graded = gradeT2Plate({ kind: 'placement', selected: CORE }, 0);
    await finishT2Plate(graded!, [], 240_000);

    const logs = (rows('SELECT * FROM review_log ORDER BY id')).map(fromReviewLogRow);
    const cached = (rows('SELECT * FROM mastery')).map(fromMasteryRow);
    const replayed = rebuildMastery(logs, (paramsId) => makeScheduler({ paramsId }));
    // 재생이 실제로 뭔가를 했는지 먼저 본다 — 0행이면 같은 게 아니라 둘 다 빈 것이다.
    expect(cached).toHaveLength(1);
    expect(diffMastery(cached, replayed)).toEqual([]);
  });

  test('고른 파일과 힌트 단은 판에 저장된다 — Esc 로 나갔다 와도 이어 찍는다', async () => {
    const graded = gradeT2Plate({ kind: 'placement', selected: CORE }, 2);
    await finishT2Plate(graded!, [], 240_000);
    const item = rows('SELECT * FROM session_item WHERE id = 1')[0] as Record<string, unknown>;
    const state = JSON.parse(item.state_json as string) as Record<string, unknown>;
    expect(state.answered).toBe(true);
    expect(state.hints).toBe(2);
    expect(state.t2Sel).toEqual([...CORE].sort());
  });
});
