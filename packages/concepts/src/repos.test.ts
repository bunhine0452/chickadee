/**
 * 리포 장부 (D65). `repo_probe` 하나와 `repo.*` statement 로 등록·목록·이동·삭제가 조립되는지.
 * 사실 층은 진짜 sqlite 이고 `repo_probe` 만 모의한다 — 그것만이 파일 시스템을 본다.
 */
import { createRequire } from 'node:module';

import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

const T = 1_767_225_600_000;
let db: SqliteDb;

/** `repo_probe` 가 돌려줄 것. 테스트마다 갈아 끼운다. */
let probe: (path: string) => { rootPath: string; fingerprint: string; headCommit: string | null };

function run(name: string, params: unknown): unknown[] {
  const sql = (statements as Record<string, string>)[name];
  if (sql === undefined) throw new Error(`카탈로그에 없는 이름: ${name}`);
  const stmt = db.prepare(sql);
  const bound = toSqliteBindings((params ?? {}) as Record<string, unknown>);
  return stmt.reader ? (stmt.all(bound) as unknown[]) : [stmt.run(bound)];
}

class FakeIpcError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: (name: string, params: unknown) => Promise.resolve(run(name, params)),
      exec: (name: string, params: unknown) => Promise.resolve(run(name, params)[0]),
      batch: (ops: { name: string; params: unknown }[]) =>
        Promise.resolve(ops.map((op) => run(op.name, op.params)[0])),
    },
    repo: { probe: (path: string) => Promise.resolve(probe(path)) },
  },
  IpcError: FakeIpcError,
  on: () => Promise.resolve(() => undefined),
}));

const { listRepos, registerRepo, relocateRepo, removeRepo } = await import('./repos.js');

beforeEach(() => {
  const init = migrations.find((m) => m.version === 1);
  if (!init) throw new Error('0001_init.sql 이 카탈로그에 없다');
  db = new Database(':memory:');
  db.exec(init.sql);
  db.pragma('foreign_keys = ON');
  probe = () => ({ rootPath: '/work/cart-shop', fingerprint: 'root1', headCommit: 'head1' });
});

describe('등록', () => {
  test('하위 폴더를 골라도 루트가 등록된다', async () => {
    probe = () => ({ rootPath: '/work/cart-shop', fingerprint: 'root1', headCommit: 'head1' });
    const repo = await registerRepo('/work/cart-shop/src/features', T);
    expect(repo.rootPath).toBe('/work/cart-shop');
    expect(repo.name).toBe('cart-shop');
    expect(repo.status).toBe('ok');
  });

  test('커밋 0개 리포도 열린다 (D44)', async () => {
    probe = () => ({ rootPath: '/work/fresh', fingerprint: '', headCommit: null });
    const repo = await registerRepo('/work/fresh', T);
    expect(repo.fingerprint).toBe('');
    expect(repo.headSha).toBeNull();
  });

  test('같은 루트를 두 번 등록하지 않는다', async () => {
    await registerRepo('/work/cart-shop', T);
    await expect(registerRepo('/work/cart-shop', T)).rejects.toMatchObject({
      code: 'REPO_DUPLICATE',
    });
  });
});

describe('목록', () => {
  test('폴더가 사라지면 missing 이다', async () => {
    await registerRepo('/work/cart-shop', T);
    probe = () => {
      throw new FakeIpcError('GIT_NOT_REPO', '없다');
    };
    const [repo] = await listRepos();
    expect(repo?.status).toBe('missing');
  });

  test('떼어 낸 리포는 detached 다', async () => {
    const repo = await registerRepo('/work/cart-shop', T);
    await removeRepo(repo.id, false, T);
    const [after] = await listRepos();
    expect(after?.status).toBe('detached');
  });
});

describe('이동', () => {
  test('첫 커밋이 같으면 경로만 바뀐다', async () => {
    const repo = await registerRepo('/work/cart-shop', T);
    probe = () => ({ rootPath: '/moved/cart-shop', fingerprint: 'root1', headCommit: 'head1' });
    const after = await relocateRepo(repo.id, '/moved/cart-shop');
    expect(after.rootPath).toBe('/moved/cart-shop');
    expect(after.status).toBe('ok');
  });

  test('첫 커밋이 다르면 다른 리포다', async () => {
    const repo = await registerRepo('/work/cart-shop', T);
    probe = () => ({ rootPath: '/other', fingerprint: 'root2', headCommit: 'head2' });
    await expect(relocateRepo(repo.id, '/other')).rejects.toMatchObject({
      code: 'REPO_FINGERPRINT_MISMATCH',
    });
  });

  test('커밋 0개였던 리포는 비교할 것이 없다', async () => {
    probe = () => ({ rootPath: '/work/fresh', fingerprint: '', headCommit: null });
    const repo = await registerRepo('/work/fresh', T);
    probe = () => ({ rootPath: '/moved/fresh', fingerprint: 'root9', headCommit: 'head9' });
    const after = await relocateRepo(repo.id, '/moved/fresh');
    expect(after.rootPath).toBe('/moved/fresh');
  });

  test('없는 리포는 옮길 수 없다', async () => {
    await expect(relocateRepo(99, '/x')).rejects.toMatchObject({ code: 'REPO_NOT_FOUND' });
  });
});

describe('삭제', () => {
  test('purge 는 사실과 파생을 지우고 카드는 은퇴시킨다 (D31)', async () => {
    const repo = await registerRepo('/work/cart-shop', T);
    db.prepare(statements['facts.file_upsert']).run(toSqliteBindings({
      repoId: repo.id, path: 'src/a.ts', lang: null, grammar: 'typescript', lineCount: 1,
      byteSize: 10, contentHash: 'h', headOid: 'h', isDirty: false, parseQuality: 'ok',
      skipReason: null, updatedAt: T,
    }));
    await removeRepo(repo.id, true, T);
    expect(db.prepare('SELECT COUNT(*) AS n FROM file').get()).toEqual({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM repo').get()).toEqual({ n: 0 });
  });

  test('purge 가 아니면 행은 남고 상태만 바뀐다', async () => {
    const repo = await registerRepo('/work/cart-shop', T);
    await removeRepo(repo.id, false, T);
    expect(db.prepare('SELECT COUNT(*) AS n FROM repo').get()).toEqual({ n: 1 });
  });
});
