// @vitest-environment jsdom
/**
 * 세션 한 흐름을 **화면에서** 돌린다 (M2 「끝났다는 증거」).
 *
 * 아래 SQLite 는 진짜이고 IPC 만 모의한다 — 그래서 「고르기 → Enter → Space」 세 번이
 * 원장에 무엇을 남기는지를 화면 쪽에서 확인할 수 있다. 카드는 손으로 넣는다: 여기서
 * 검증하는 것은 **판을 넘기는 흐름**이지 문항의 문구가 아니다.
 */
import { createRequire } from 'node:module';

import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { cleanup, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
const Database = require_('better-sqlite3') as new (path: string) => BetterSqlite3.Database;

const T = 1_772_755_200_000; // 2026-09-03 09:00 KST
const TZ = 'Asia/Seoul';

let db: BetterSqlite3.Database;
let calls = 0;

function run(name: string, params: unknown): unknown[] {
  calls += 1;
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
    file: { readLines: () => Promise.reject(new Error('no file')) },
  },
  IpcError: class extends Error { code = 'X' },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
  on: () => Promise.resolve(() => undefined),
}));

const { SessionScreen } = await import('./SessionScreen.js');
const { useUi } = await import('../../store.js');
const { loadPlates } = await import('../../data/session.js');

const PAYLOAD = {
  track: 't0', kind: 'meaning', file: 'src/cart.ts', focus: 27,
  lines: [{ n: 27, t: 'const name = user?.name' }],
  q: '이 줄이 끝난 뒤 <code>name</code> 에는 무엇이 있나요',
  hint: '중간이 비어 있을 때',
  options: [{ t: 'undefined' }, { t: '빈 문자열' }, { t: '오류' }, { t: 'null' }],
  answer: 0,
  why: [null, { t: '빈 문자열은 스스로 만들어지지 않습니다' }, { t: '멈추는 것이지 던지는 것이 아닙니다' },
    { t: 'null 은 직접 넣어야 나옵니다' }],
  ok: '맞았습니다 — 중간이 비면 거기서 멈춥니다',
  rule: '규칙 — 앞이 <code>null</code>·<code>undefined</code> 면 거기서 멈춥니다',
  prereq: [], uses: [], promptLines: ['const name = user?.name'],
};

function seed(): void {
  const init = migrations.find((m) => m.version === 1);
  if (!init) throw new Error('0001_init.sql 이 카탈로그에 없다');
  db = new Database(':memory:');
  db.exec(init.sql);
  db.pragma('foreign_keys = ON');
  db.prepare(
    `INSERT INTO repo (id, root_path, name, fingerprint, added_at) VALUES (1, '/w/cart', 'cart', 'r', ?)`,
  ).run(T);
  db.prepare(
    `INSERT INTO dictionary_version (id, lang, version, sha256, concept_count, loaded_at)
     VALUES (1, 'ts', '1.0.0', 'x', 2, ?)`,
  ).run(T);
  db.prepare(`INSERT INTO file (id, repo_id, path, updated_at) VALUES (1, 1, 'src/cart.ts', ?)`).run(T);
  db.prepare(`INSERT INTO settings (key, value_json, updated_at) VALUES ('tz', ?, ?)`)
    .run(JSON.stringify(TZ), T);

  const concept = db.prepare(
    `INSERT INTO concept (id, lang, name_ko, token, kind, track_default, dict_version_id)
     VALUES (?, 'ts', ?, ?, 'lang', 't0', 1)`,
  );
  concept.run('ts/optional-chaining', '선택적 체이닝', '?.');
  concept.run('ts/array-map', '배열 map', 'map');

  const card = db.prepare(
    `INSERT INTO card (id, repo_id, track, kind, concept_id, level, payload_json, content_hash, created_at)
     VALUES (?, 1, 't0', 'meaning', ?, 1, ?, ?, ?)`,
  );
  card.run(1, 'ts/optional-chaining', JSON.stringify(PAYLOAD), 'h1', T);
  card.run(2, 'ts/array-map', JSON.stringify(PAYLOAD), 'h2', T);

  db.prepare(
    `INSERT INTO session (id, repo_id, day_key, seq_in_day, started_at, budget_min, planned_min,
                          status, plan_json)
     VALUES (1, 1, '2026-09-03', 1, ?, 15, 4, 'active', '[]')`,
  ).run(T);
  const item = db.prepare(
    `INSERT INTO session_item (id, session_id, pos, card_id, concept_id, track, role, est_min, created_at)
     VALUES (?, 1, ?, ?, ?, 't0', 'new', 2, ?)`,
  );
  item.run(1, 0, 1, 'ts/optional-chaining', T);
  item.run(2, 1, 2, 'ts/array-map', T);
}

async function mount() {
  seed();
  const plates = await loadPlates(1);
  const rows = db.prepare('SELECT * FROM session WHERE id = 1').get() as Record<string, unknown>;
  useUi.getState().beginSession(
    {
      id: 1, repoId: 1, dayKey: '2026-09-03' as never, seqInDay: 1, startedAt: T, endedAt: null,
      budgetMin: 15, plannedMin: 4, elapsedS: 0, status: 'active', plan: [], liferShown: 0,
    },
    plates,
    0,
  );
  void rows;
  return render(<SessionScreen repoId={1} repoName="cart" />);
}

beforeEach(() => {
  calls = 0;
  vi.spyOn(Date, 'now').mockReturnValue(T);
});

afterEach(() => {
  // 루트 vitest 설정이 `globals: false` 라 RTL 의 자동 정리가 안 걸린다 — 손으로 부른다.
  cleanup();
  useUi.getState().closeSession();
  vi.restoreAllMocks();
});

/** 교정지 안에서만 찾는다 — 작업 띠의 이름표가 같은 글자를 들고 있다. */
const sheet = () => within(document.querySelector('.ps') as HTMLElement);

/** LIFER 베일은 아무 키로 닫힌다. 열려 있는 동안은 모든 키를 먹으므로 먼저 치운다. */
async function dismissLifer(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  if (document.querySelector('.lifer-card') === null) return;
  await user.keyboard('[Enter]');
  await waitFor(() => {
    expect(document.querySelector('.lifer-card')).toBeNull();
  });
}

describe('교정쇄 한 흐름', () => {
  test('고르기 → Enter → Space 세 번이면 판 한 장이 끝난다 (정본 §3-8)', async () => {
    const user = userEvent.setup();
    await mount();

    expect(sheet().getByText('선택적 체이닝')).toBeTruthy();
    // 답하기 전 판정란은 비어 있지만 자리는 이미 있다 (정본 §3-3).
    expect(document.querySelector('.slot')).toBeTruthy();

    await user.keyboard('[Digit1]');
    await user.keyboard('[Enter]');

    await waitFor(() => {
      expect(document.querySelector('.fb')).toBeTruthy();
    });
    expect(sheet().getByText('정합')).toBeTruthy();

    const log = db.prepare('SELECT concept_id, ok, layer_before, layer_after, grade FROM review_log').get();
    expect(log).toEqual({
      concept_id: 'ts/optional-chaining', ok: 1, layer_before: 0, layer_after: 1, grade: 2,
    });

    // 개념 첫 성공이므로 LIFER 의식이 뜬다 (정본 §3-6). 아무 키로 닫힌다.
    expect(document.querySelector('.lifer-card')).toBeTruthy();
    expect(db.prepare('SELECT concept_id, shown_at FROM lifer').get())
      .toEqual({ concept_id: 'ts/optional-chaining', shown_at: T });
    await dismissLifer(user);

    // 카드 전환에 IPC 0회 (05 §10) — 다음 판의 문항은 이미 메모리에 있다.
    const before = calls;
    await user.keyboard('[Space]');
    await waitFor(() => {
      expect(sheet().getByText('배열 map')).toBeTruthy();
    });
    expect(calls).toBe(before);
  });

  test('오답이면 진단이 뜨고 다시 찍기가 큐에 들어간다 (02 §4)', async () => {
    const user = userEvent.setup();
    await mount();

    await user.keyboard('[Digit3]');
    await user.keyboard('[Enter]');

    await waitFor(() => {
      expect(sheet().getByText('어긋남')).toBeTruthy();
    });
    expect(sheet().getByText(/멈추는 것이지 던지는 것이 아닙니다/)).toBeTruthy();

    const retry = db.prepare(`SELECT pos, role FROM session_item WHERE role = 'retry'`).get();
    expect(retry).toEqual({ pos: 2, role: 'retry' });
    // 겹은 바닥까지 떨어지지 않는다 — 유지다.
    const log = db.prepare('SELECT layer_before, layer_after FROM review_log').get();
    expect(log).toEqual({ layer_before: 0, layer_after: 0 });
  });

  test('마지막 판을 마치면 요약이 뜬다 — 오늘 움직인 잉크', async () => {
    const user = userEvent.setup();
    await mount();

    for (let i = 0; i < 2; i += 1) {
      await user.keyboard('[Digit1]');
      await user.keyboard('[Enter]');
      await waitFor(() => {
        expect(db.prepare('SELECT COUNT(*) AS n FROM review_log').get()).toEqual({ n: i + 1 });
      });
      await dismissLifer(user);
      await user.keyboard('[Space]');
    }

    await waitFor(() => {
      expect(document.querySelector('.done-head')).toBeTruthy();
    });
    expect(db.prepare(`SELECT status FROM session WHERE id = 1`).get()).toEqual({ status: 'done' });
    // 두 개념 모두 0겹 → 1겹.
    expect(db.prepare('SELECT COUNT(*) AS n FROM review_log WHERE layer_after = 1').get()).toEqual({ n: 2 });
  });

  test('Esc 로 나가면 세션이 멈추고 진행이 남는다 (정본 §3-4)', async () => {
    const user = userEvent.setup();
    await mount();

    await user.keyboard('[Digit1]');
    await user.keyboard('[Enter]');
    await waitFor(() => {
      expect(document.querySelector('.fb')).toBeTruthy();
    });

    // Esc 는 한 번에 한 겹만 벗긴다 (05 §2.3) — 먼저 LIFER 베일, 그 다음 세션.
    await dismissLifer(user);
    await user.keyboard('[Escape]');
    await waitFor(() => {
      expect(useUi.getState().session).toBeNull();
    });
    expect(db.prepare('SELECT status FROM session WHERE id = 1').get()).toEqual({ status: 'paused' });
    // 마친 판은 원장에 남는다 — 다시 열면 그 다음 판부터다.
    expect(db.prepare(`SELECT status FROM session_item WHERE id = 1`).get()).toEqual({ status: 'done' });
  });

  test('「모르겠어요」를 누르면 사다리가 열리고 발자국이 남는다 (02 §4)', async () => {
    const user = userEvent.setup();
    await mount();

    const acts = within(document.querySelector('.acts') as HTMLElement);
    await user.click(acts.getByRole('button', { name: /모르겠어요/ }));
    await waitFor(() => {
      expect(document.querySelector('.reprint')).toBeTruthy();
    });

    const dunno = db.prepare('SELECT session_item_id, max_rung FROM dunno_event').get();
    expect(dunno).toEqual({ session_item_id: 1, max_rung: 1 });
    expect(db.prepare(`SELECT rung, action FROM ladder_event`).get()).toEqual({ rung: 1, action: 'open' });
  });
});
