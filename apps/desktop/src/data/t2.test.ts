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
const { loadPlates, openSession } = await import('./session.js');
const {
  bakeNextT2, BAKE_ATTEMPTS, REPO_TARGETS, T2_ORDER, T2_REPO_KINDS, t2Todo,
} = await import('./graph.js');

/**
 * 이 픽스처가 실제로 구울 수 있는 종 (D142). 리포 지도 두 종은 `clone.course_files` 가
 * 요구하는 `grammar`·`line_count` 가 이 시드에 없어 재료가 0건이다 — 대지 회전만 센다.
 */
const UNIT_KINDS = T2_ORDER.filter((k) => !T2_REPO_KINDS.includes(k));

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
  db = new Database(':memory:');
  // 마이그레이션을 전부, 번호 순으로 태운다 — 0001 만 태우면 뒤 마이그레이션이 만든 표를
  // 쓰는 statement 가 「no such table」로 터진다.
  for (const m of [...migrations].sort((a, b) => a.version - b.version)) db.exec(m.sql);
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

describe('T2 판 한 장 (04 §8 · 02 §4)', () => {
  beforeEach(async () => {
    await open();
  });

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

// ───────── D140 · 회전 ─────────

/**
 * **큐가 같은 판만 주지 않는다는 증거** (D140 · `#b-rotate-test`).
 *
 * 고장은 둘이 겹쳐 있었다. `queue.next_track_card` 가 `LIMIT 1` 로 늘 같은 행을 줬고,
 * 그래서 `forUnit` 은 첫 판이 구워진 뒤로 한 번도 불리지 않는 죽은 코드였다. 20대지짜리
 * 리포에서 사용자가 평생 보는 구조 문제가 **한 장**이었다는 뜻이다.
 *
 * 여기서는 대지 셋짜리 리포를 세우고 세션을 여러 날 열어 판이 실제로 바뀌는지 본다.
 * 판을 마치는 것은 흉내 낸다 — `card_state.last_printed_at` 을 그날로 올리는 것이
 * `plate.ts` 가 판을 마칠 때 하는 일이고, 이 테스트가 보는 것은 채점이 아니라 큐다.
 */
const DAY = 86_400_000;
const UNITS = 3;

/** 대지 하나의 파일 사슬. 층이 있어야 흐름·방향이 나온다(04 §8.3). */
const chainOf = (u: number): string[] => [
  `app/u${u}/page.ts`,
  `features/u${u}/Sheet.ts`,
  `features/u${u}/Row.ts`,
  `features/u${u}/Stepper.ts`,
  `features/u${u}/useThing.ts`,
  `features/u${u}/api.ts`,
  `server/u${u}/repo.ts`,
];

function seedRepo(units: number): void {
  db = new Database(':memory:');
  for (const m of [...migrations].sort((a, b) => a.version - b.version)) db.exec(m.sql);
  db.pragma('foreign_keys = ON');
  db.prepare(
    `INSERT INTO repo (id, root_path, name, fingerprint, added_at) VALUES (1, '/w/app', 'app', 'r', ?)`,
  ).run(T);
  db.prepare(
    `INSERT INTO dictionary_version (id, lang, version, sha256, concept_count, loaded_at)
     VALUES (1, 'arch', '1.0.0', 'x', 4, ?)`,
  ).run(T);
  db.prepare(`INSERT INTO settings (key, value_json, updated_at) VALUES ('tz', ?, ?)`)
    .run(JSON.stringify(TZ), T);

  const concept = db.prepare(
    `INSERT INTO concept (id, lang, name_ko, token, kind, track_default, dict_version_id)
     VALUES (?, 'arch', ?, NULL, 'universal', 't2', 1)`,
  );
  for (const [id, name] of [
    ['arch/placement', '책임 배치'], ['arch/radius', '영향 반경'],
    ['arch/flow', '흐름 추적'], ['arch/direction', '의존성 방향'],
  ]) concept.run(id, name);

  const file = db.prepare(
    `INSERT INTO file (id, repo_id, path, updated_at) VALUES (?, 1, ?, ?)`,
  );
  const unit = db.prepare(
    `INSERT INTO unit (id, repo_id, name, root_path, source, order_idx) VALUES (?, 1, ?, ?, 'dir', ?)`,
  );
  const unitFile = db.prepare(`INSERT INTO unit_file (unit_id, file_id) VALUES (?, ?)`);
  const edge = db.prepare(
    `INSERT INTO import_edge (repo_id, from_file_id, to_file_id, kind) VALUES (1, ?, ?, 'static')`,
  );
  const commit = db.prepare(
    `INSERT INTO git_commit (id, repo_id, sha, parent_count, authored_at, message, files_n,
                             insertions, deletions, is_reachable, kind, author_matched)
     VALUES (?, 1, ?, 1, ?, ?, 4, 60, 8, 1, 'normal', 1)`,
  );
  const commitFile = db.prepare(
    `INSERT INTO commit_file (commit_id, path, status, additions, deletions, touched_json)
     VALUES (?, ?, ?, ?, 2, '[]')`,
  );

  let fileId = 0;
  let commitId = 0;
  for (let u = 1; u <= units; u += 1) {
    const paths = chainOf(u);
    const ids = paths.map((path) => {
      fileId += 1;
      file.run(fileId, path, T);
      return fileId;
    });
    unit.run(u, `u${u}`, `features/u${u}`, u);
    for (const id of ids) unitFile.run(u, id);
    for (let i = 0; i + 1 < ids.length; i += 1) edge.run(ids[i], ids[i + 1]);

    // 04 §8.1 은 후보 커밋 3건 이상을 요구한다 — 넷을 둔다.
    for (let c = 1; c <= 4; c += 1) {
      commitId += 1;
      commit.run(commitId, `s${String(commitId).padStart(6, '0')}`, T - commitId * DAY,
        `feat(u${u}): 기능 ${c} 을 더한다`);
      // 대지 파일 넷 — 「소스 파일 3~12개」 안이다. 첫 커밋의 첫 파일만 새 파일.
      for (let i = 0; i < 4; i += 1) {
        commitFile.run(commitId, paths[i + 1] as string, c === 1 && i === 0 ? 'A' : 'M', 9 + i * 3);
      }
    }
  }
}

const deps = { repoId: 1, rootPath: '/w/app', now: T };

/** 판을 마친 흔적 — `plate.ts` 가 `card.state_upsert` 로 하는 일 중 큐가 보는 부분. */
function markPrinted(cardId: number, at: number): void {
  db.prepare(
    `UPDATE card_state SET prints = prints + 1, last_printed_at = ? WHERE card_id = ?`,
  ).run(at, cardId);
}

const madeSet = (): Set<string> => new Set(
  (rows(`SELECT unit_id, kind FROM card WHERE track = 't2'`))
    .map((r) => `${String(r.unit_id)}:${String(r.kind)}`),
);

describe('T2 회전 (D140 · 대지 3 × 종 4)', () => {
  beforeEach(() => {
    seedRepo(UNITS);
  });

  test('굽는 순서는 종이 바깥 고리다 — 책임 배치를 대지 전부에 먼저 돌린다', () => {
    const units = [1, 2, 3].map((id) => ({ id, name: `u${id}`, rootPath: `features/u${id}` }));
    const todo = t2Todo(units, new Set(['1:placement']));
    // 대지 회전 넷 × 3 − 이미 구운 하나, 그리고 리포 지도 두 종의 상한(진입점 1 · 역할 3).
    expect(todo).toHaveLength(UNITS * UNIT_KINDS.length - 1
      + Math.min(UNITS, REPO_TARGETS.entry) + Math.min(UNITS, REPO_TARGETS.role));
    expect(todo.slice(0, 3).map((x) => `${x.unit.id}:${x.kind}`))
      .toEqual(['2:placement', '3:placement', '1:radius']);
    // 리포 지도 종은 대지를 회전 커서로만 쓴다 — 몇 번째 후보인지는 `targetIndex` 가 든다.
    expect(todo.filter((x) => x.kind === 'role').map((x) => x.targetIndex)).toEqual([0, 1, 2]);
    expect(todo.filter((x) => x.kind === 'entry')).toHaveLength(1);
  });

  test('부를 때마다 새 (대지, 종) 이 하나씩 늘고 12장에서 멈춘다', async () => {
    const seen: string[] = [];
    for (let i = 0; i < UNITS * UNIT_KINDS.length + 2; i += 1) {
      const made = await bakeNextT2(deps);
      if (made === null) break;
      const row = rows(`SELECT unit_id, kind FROM card WHERE id = ${made.cardId}`)[0]!;
      seen.push(`${String(row.unit_id)}:${String(row.kind)}`);
    }
    // 한 번에 한 장씩만 굽는다 — 일괄 생성이면 첫 호출에서 12장이 들어와 있다.
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toHaveLength(UNITS * UNIT_KINDS.length);
    expect(seen.slice(0, 3)).toEqual(['1:placement', '2:placement', '3:placement']);
    // 네 종이 다 나왔다 (D107 이 약속하고 한 번도 일어나지 않았던 것).
    expect(new Set(seen.map((s) => s.split(':')[1]))).toEqual(new Set(UNIT_KINDS));
    expect(await bakeNextT2(deps)).toBeNull();
  });

  test('세션당 한 장 — 한 번 부르면 카드가 딱 한 행 는다', async () => {
    expect(rows(`SELECT id FROM card WHERE track = 't2'`)).toHaveLength(0);
    await bakeNextT2(deps);
    expect(rows(`SELECT id FROM card WHERE track = 't2'`)).toHaveLength(1);
    await bakeNextT2(deps);
    expect(rows(`SELECT id FROM card WHERE track = 't2'`)).toHaveLength(2);
  });

  test('한 대지도 판을 못 내면 시도는 BAKE_ATTEMPTS 에서 멈춘다', async () => {
    // 엣지를 지우면 지도가 3노드에 못 미쳐 어느 종도 안 나온다 (D103 `two-commits` 와 같다).
    db.prepare('DELETE FROM import_edge').run();
    db.prepare('DELETE FROM commit_file').run();
    expect(await bakeNextT2(deps)).toBeNull();
    expect(rows(`SELECT id FROM card WHERE track = 't2'`)).toHaveLength(0);
    expect(BAKE_ATTEMPTS).toBeGreaterThan(0);
  });

  test('`queue.next_track_card` 가 최근 7일 안에 찍은 판을 주지 않는다', async () => {
    const first = await bakeNextT2(deps);
    expect(first).not.toBeNull();
    const printedBefore = (at: number): unknown[] =>
      run('queue.next_track_card', { repoId: 1, track: 't2', printedBefore: at - 7 * DAY });

    // 아직 안 찍었다 — 나온다.
    expect(printedBefore(T)).toHaveLength(1);
    markPrinted(first!.cardId, T);
    // 오늘 찍었다 — 창 안이라 안 나온다. 이 한 줄이 「평생 한 장」을 끝낸다.
    expect(printedBefore(T + 2 * DAY)).toHaveLength(0);
    expect(printedBefore(T + 6 * DAY)).toHaveLength(0);
    // 7일이 지나면 다시 돈다.
    expect(printedBefore(T + 7 * DAY)).toHaveLength(1);
  });

  test('T1 은 걸러지지 않는다 — 3단계 페이딩이 같은 카드를 다시 부른다', () => {
    db.prepare(
      `INSERT INTO card (id, repo_id, track, kind, concept_id, level, payload_json, content_hash,
                         created_at)
       VALUES (900, 1, 't1', 'transcribe', 'arch/placement', 1, '{}', 'h900', ?)`,
    ).run(T);
    db.prepare(
      `INSERT INTO card_state (card_id, prints, stage, last_printed_at) VALUES (900, 1, 2, ?)`,
    ).run(T);
    // `REPRINT_GAP_DAYS.t1 = 0` → `printedBefore = now` 라 어제 찍은 판도 그대로 나온다.
    expect(run('queue.next_track_card', { repoId: 1, track: 't1', printedBefore: T + DAY }))
      .toHaveLength(1);
  });

  test('세션을 여러 날 열면 판이 반복되지 않는다 (큐 전체 경로)', async () => {
    const maker = {
      forReview: () => Promise.resolve(null),
      forNew: () => Promise.resolve(null),
      forBlock: () => Promise.resolve(null),
      forUnit: async () => {
        const made = await bakeNextT2({ ...deps, now: deps.now });
        return made === null ? null : {
          cardId: made.cardId,
          conceptId: made.card.conceptId,
          track: 't2' as const,
          role: 'new' as const,
          estMin: 4,
        };
      },
    };

    const printed: number[] = [];
    // T2 리듬은 2일 간격이라 이틀에 한 번 연다 (02 §5.2).
    for (let d = 0; d < UNITS * UNIT_KINDS.length * 2; d += 2) {
      const now = T + d * DAY;
      deps.now = now;
      const view = await openSession(1, now, maker);
      if (view === null) break;
      const plate = view.plates[0];
      expect(plate?.track).toBe('t2');
      printed.push(plate!.cardId);
      markPrinted(plate!.cardId, now);
      // 세션을 닫아야 다음 날이 새 큐를 짠다 (02 §5.6).
      db.prepare(`UPDATE session SET status = 'done', ended_at = ? WHERE id = ?`)
        .run(now, view.session.id);
      db.prepare(`UPDATE session_item SET status = 'done' WHERE session_id = ?`)
        .run(view.session.id);
    }
    deps.now = T;

    // 고장 났을 때 이 배열은 [1,1,1,1,…] 이었다.
    expect(printed).toHaveLength(UNITS * UNIT_KINDS.length);
    expect(new Set(printed).size).toBe(printed.length);
    expect(madeSet().size).toBe(UNITS * UNIT_KINDS.length);

    // 대지 셋이 다 나왔고 종도 넷이 다 나왔다 (D107).
    const shown = rows(
      `SELECT unit_id, kind FROM card WHERE id IN (${printed.join(',')})`,
    );
    expect(new Set(shown.map((r) => r.unit_id)).size).toBe(UNITS);
    expect(new Set(shown.map((r) => r.kind))).toEqual(new Set(UNIT_KINDS));
  });

  test('다 구운 뒤에는 7일 창 밖으로 나온 옛 판을 다시 낸다', async () => {
    // 열두 조합을 미리 다 굽고 전부 한참 전에 찍은 것으로 둔다.
    for (let i = 0; i < UNITS * UNIT_KINDS.length; i += 1) {
      const made = await bakeNextT2(deps);
      markPrinted(made!.cardId, T - (30 - i) * DAY);
    }
    expect(await bakeNextT2(deps)).toBeNull();

    // 큐는 가장 오래 안 본 판을 준다 — 「굽는다」와 「다시 낸다」 사이 갈림이 여기다.
    const next = run('queue.next_track_card', {
      repoId: 1, track: 't2', printedBefore: T - 7 * DAY,
    }) as { id: number; prints: number }[];
    expect(next).toHaveLength(1);
    expect(next[0]!.prints).toBe(1);
    const oldest = rows(
      `SELECT card_id FROM card_state ORDER BY last_printed_at LIMIT 1`,
    )[0]!;
    expect(next[0]!.id).toBe(oldest.card_id);
  });
});
