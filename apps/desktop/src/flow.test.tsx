// @vitest-environment jsdom
/**
 * 리포 등록부터 홈이 실데이터를 그리는 데까지, 한 번에 (06 §1.4).
 *
 * Rust 는 모의한다 — `ingest_start` 가 하는 일은 `file`·`capture` 행을 쓰는 것이고,
 * 여기서는 그 행을 직접 심은 뒤 `ingest_done` 을 낸다. **그다음부터 끝까지가 진짜다**:
 * 카탈로그의 SQL, 사전, 파생 층, 홈 쿼리, 그리고 화면.
 *
 * 이것이 M1 「끝났다는 증거」 2번(홈이 목업과 같은 모양으로 실데이터를 보인다)을 헤드리스로
 * 확인할 수 있는 만큼이다. WKWebView 안에서의 모습은 사람이 봐야 한다.
 */
import { createRequire } from 'node:module';

import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

const T = 1_767_225_600_000;
let db: SqliteDb;
let picked: string | null = '/work/cart-shop';
/** `ingest_start` 가 불렸을 때 심을 파일. Rust 가 썼을 법한 행이다. */
const FILES: { path: string; line: string }[] = [
  { path: 'src/features/cart/useCart.ts', line: 'const nick = res.user?.profile\n' },
  { path: 'src/features/cart/api.ts', line: 'const a = res.user?.profile\n' },
  { path: 'src/features/cart/view.ts', line: 'const b = res.user?.profile\n' },
];

function run(name: string, params: unknown): unknown[] {
  const sql = (statements as Record<string, string>)[name];
  if (sql === undefined) throw new Error(`카탈로그에 없는 이름: ${name}`);
  const stmt = db.prepare(sql);
  const bound = toSqliteBindings((params ?? {}) as Record<string, unknown>);
  return stmt.reader ? (stmt.all(bound) as unknown[]) : [stmt.run(bound)];
}

/** Rust 가 캡처를 쓰는 자리. `res.user?.profile` 한 줄의 site + pick 3개. */
function seedFacts(repoId: number): void {
  for (const { path, line } of FILES) {
    run('facts.file_upsert', {
      repoId, path, lang: null, grammar: 'typescript', lineCount: 1, byteSize: line.length,
      contentHash: `h-${path}`, headOid: `h-${path}`, isDirty: false, parseQuality: 'ok',
      skipReason: null, updatedAt: T,
    });
    const at = line.indexOf('res.user?.profile');
    const caps = [
      ['site', at, at + 17, 'member_expression'],
      ['pick.1', at, at + 8, 'member_expression'],
      ['pick.2', at + 8, at + 10, 'optional_chain'],
      ['pick.3', at + 10, at + 17, 'property_identifier'],
    ] as const;
    for (const [name, start, end, kind] of caps) {
      run('facts.capture_insert', {
        repoId, path, queryId: 'ts/optional-chaining', matchId: 1, patternIndex: 0,
        name, form: 'member', nodeKind: kind, inError: false,
        startByte: start, endByte: end, startLine: 1, endLine: 1,
        startCol: start, endCol: end, excerpt: line.slice(start, end),
      });
    }
  }
}

type Handler = (payload: unknown) => void;
const listeners = new Map<string, Handler[]>();

vi.mock('@chickadee/ipc-client', async (real) => {
  const actual = await real<typeof import('@chickadee/ipc-client')>();
  return {
    ...actual,
    ipc: {
      store: {
        query: (name: string, params: unknown) => Promise.resolve(run(name, params)),
        exec: (name: string, params: unknown) => Promise.resolve(run(name, params)[0]),
        batch: (ops: { name: string; params: unknown }[]) =>
          Promise.resolve(ops.map((op) => run(op.name, op.params)[0])),
        open: () => Promise.resolve({ userVersion: 1, path: ':memory:', sizeBytes: 0, wal: true }),
        info: () => Promise.resolve({ userVersion: 1, path: ':memory:', sizeBytes: 0, wal: true }),
      },
      repo: {
        probe: (path: string) =>
          Promise.resolve({ rootPath: path, fingerprint: 'root1', headCommit: 'head1' }),
      },
      dialog: { pickFolder: () => Promise.resolve(picked) },
      ingest: {
        start: (spec: { repoId: number }) => {
          // Rust 가 하는 일 — 사실을 쓰고, 진행을 알리고, 끝났다고 한다.
          seedFacts(spec.repoId);
          for (const phase of ['walk', 'parse', 'git', 'write']) {
            emit('ingest_progress', { jobId: 'j', phase, done: 3, total: 3, elapsedMs: 1 });
          }
          emit('ingest_warning', { jobId: 'j', relPath: 'src/gen.ts', reason: 'generated' });
          emit('ingest_done', {
            jobId: 'j', files: 3, changed: 3, deleted: 0, captures: 12, commits: 0,
            escalatedToFull: false, elapsedMs: 12, peakRssMb: 0, cancelled: false, warnings: 1,
          });
          return Promise.resolve({ jobId: 'j' });
        },
      },
      git: { blameLines: () => Promise.resolve({ hunks: [] }) },
      win: { show: () => Promise.resolve() },
    },
    on: (name: string, cb: Handler) => {
      listeners.set(name, [...(listeners.get(name) ?? []), cb]);
      return Promise.resolve(() => listeners.delete(name));
    },
  };
});

function emit(name: string, payload: unknown): void {
  for (const cb of listeners.get(name) ?? []) cb(payload);
}

const { App } = await import('./App.js');
const { addRepo } = await import('./flow.js');
const { useUi } = await import('./store.js');

beforeEach(() => {
  const init = migrations.find((m) => m.version === 1);
  if (!init) throw new Error('0001_init.sql 이 카탈로그에 없다');
  db = new Database(':memory:');
  db.exec(init.sql);
  db.pragma('foreign_keys = ON');
  listeners.clear();
  picked = '/work/cart-shop';
  useUi.setState({
    screen: 'first-run', repos: [], activeId: null, home: null, at: null,
    currentPath: undefined, warnings: [], ingestDone: false, cancelling: false,
    error: undefined, toast: undefined,
  });
});

afterEach(cleanup);

describe('리포 하나를 등록하면', () => {
  test('사실 → 사용처 → 대지 → 구멍 이 한 흐름으로 이어진다', async () => {
    await addRepo('/work/cart-shop');
    const ui = useUi.getState();
    expect(ui.repos).toHaveLength(1);
    expect(ui.ingestDone).toBe(true);
    expect(ui.error).toBeUndefined();

    const home = ui.home;
    expect(home).not.toBeNull();
    expect(home?.masthead.concepts).toBe(1);
    expect(home?.sheets[0]?.name).toBe('cart');
    expect(home?.sheets[0]?.nodes[0]?.conceptId).toBe('ts/optional-chaining');
    expect(home?.gaps[0]?.siteCount).toBe(3);
    expect(home?.files).toBe(3);
  });

  test('건너뛴 파일이 사유와 함께 남는다', async () => {
    await addRepo('/work/cart-shop');
    expect(useUi.getState().warnings).toEqual([{ relPath: 'src/gen.ts', reason: 'generated' }]);
  });

  test('홈이 그 데이터를 그린다 — 마스트헤드·대지·판이 없는 문법', async () => {
    await addRepo('/work/cart-shop');
    useUi.getState().go('home');
    render(<App />);

    // 대지 한 장과 그 안의 스티커
    expect(screen.getByText('cart')).toBeDefined();
    expect(screen.getAllByText(/옵셔널 체이닝/).length).toBeGreaterThan(0);
    // 「판이 없는 문법」 — 내 코드엔 3곳 있는데 아직 판이 없다
    expect(screen.getByText(/판이 없는 문법/)).toBeDefined();
    expect(screen.getByText(/번 등장/).textContent).toContain('3');
  });

  test('리포가 0개면 첫 실행 화면이다', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: '리포 등록' })).toBeDefined();
  });

  test('같은 리포를 두 번 등록하면 그렇게 말한다', async () => {
    await addRepo('/work/cart-shop');
    await addRepo('/work/cart-shop');
    expect(useUi.getState().error).toContain('이미 등록된');
  });
});

describe('진행 화면', () => {
  test('네 단계가 모두 지나간다', async () => {
    const seen: string[] = [];
    const stop = useUi.subscribe((s) => {
      if (s.at) seen.push(s.at.phase);
    });
    await addRepo('/work/cart-shop');
    stop();
    // Rust 의 넷과 TS 의 `derive` — 화면은 이것을 네 칸으로 접는다 (D47).
    expect(new Set(seen)).toEqual(new Set(['walk', 'parse', 'git', 'write', 'derive']));
  });
});

describe('끝난 뒤', () => {
  test('성공하면 홈으로 넘어간다 — 진행 화면에 갇히지 않는다', async () => {
    await addRepo('/work/cart-shop');
    expect(useUi.getState().screen).toBe('home');
  });
});
