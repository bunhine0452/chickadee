/**
 * 내 커밋 가르기 — 원장까지 한 바퀴 (03 §1.2 · D121).
 *
 * `isMine()` 자체는 `concepts.test.ts` 가 순수 함수로 재고, 여기서만 확인되는 것은
 * **`git_commit.author_matched` 열에 실제로 무엇이 써지는가**다. 배선 버그가 산 자리가
 * 그 사이였다 — 판정 함수는 맞게 돌고 있었고 입력이 언제나 빈 목록이었다.
 */
import { createRequire } from 'node:module';

import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
const Database = require_('better-sqlite3') as new (path: string) => BetterSqlite3.Database;

const T = 1_772_755_200_000;

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
  },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
}));

const { reclassifyCommits, suggestIdentitiesFor } = await import('./identities.js');

const ME = { email: 'me@example.com', name: 'Kim Hyunbin' };

/**
 * author 가 다른 커밋 다섯. 셋이 내 것이다.
 *
 * `b2` 가 경계다 — GitHub 로그인 `kimhyunbin` 은 이름 `Kim Hyunbin` 과 **완전 일치가
 * 아니라서** 안 걸린다(`isMine` 은 로그인 경로에서 정규화하지 않는다, 03 §1.2). 넓히면
 * 「Kim」 이 남의 커밋을 잡아 T2 정답지가 오염된다 — 그 오탐이 편의보다 비싸다.
 */
const COMMITS = [
  { sha: 'a1', email: 'me@example.com', name: 'Kim Hyunbin', msg: 'feat: a' },
  { sha: 'a2', email: 'ME@Example.com', name: 'Kim Hyunbin', msg: 'fix: b' },
  { sha: 'a3', email: '77+me@users.noreply.github.com', name: null, msg: 'docs: c' },
  { sha: 'b1', email: 'other@example.com', name: 'Someone Else', msg: 'feat: d' },
  { sha: 'b2', email: '99+kimhyunbin@users.noreply.github.com', name: null, msg: 'feat: e' },
];

function matchedShas(): string[] {
  return (db.prepare('SELECT sha FROM git_commit WHERE author_matched = 1 ORDER BY sha')
    .all() as { sha: string }[]).map((r) => r.sha);
}

beforeEach(() => {
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  for (const m of migrations) db.exec(m.sql);
  db.prepare(
    `INSERT INTO repo (id, root_path, name, fingerprint, added_at)
     VALUES (1, '/w/x', 'x', 'r', ?)`,
  ).run(T);
  for (const [i, c] of COMMITS.entries()) {
    db.prepare(
      `INSERT INTO git_commit
         (repo_id, sha, authored_at, author_email, author_name, message, parent_count,
          files_n, insertions, deletions, is_reachable, kind, author_matched)
       VALUES (1, ?, ?, ?, ?, ?, 1, 2, 10, 1, 1, 'normal', 0)`,
    ).run(c.sha, T + i, c.email, c.name, c.msg);
  }
});

describe('reclassifyCommits', () => {
  test('identity 가 비면 한 건도 내 것이 아니다 — 배선이 빠졌을 때의 증상 그대로', async () => {
    expect(await reclassifyCommits(1, [])).toEqual({ mine: 0, all: 5 });
    expect(matchedShas()).toEqual([]);
  });

  test('하나만 넣어도 메일 대소문자와 GitHub noreply 까지 걸린다', async () => {
    expect(await reclassifyCommits(1, [ME])).toEqual({ mine: 3, all: 5 });
    expect(matchedShas()).toEqual(['a1', 'a2', 'a3']);
  });

  test('다시 비우면 도로 0 이 된다 — 재인제스트 없이 열만 다시 쓴다', async () => {
    await reclassifyCommits(1, [ME]);
    expect(await reclassifyCommits(1, [])).toEqual({ mine: 0, all: 5 });
    expect(matchedShas()).toEqual([]);
  });

  test('kind 도 같이 다시 매긴다 — 머지는 내 것이어도 merge 다', async () => {
    db.prepare("UPDATE git_commit SET parent_count = 2 WHERE sha = 'a1'").run();
    await reclassifyCommits(1, [ME]);
    const row = db.prepare("SELECT kind, author_matched FROM git_commit WHERE sha = 'a1'")
      .get() as { kind: string; author_matched: number };
    expect(row).toEqual({ kind: 'merge', author_matched: 1 });
  });
});

describe('suggestIdentitiesFor', () => {
  test('커밋 author 를 빈도순으로 낸다', async () => {
    const got = await suggestIdentitiesFor(1);
    expect(got[0]).toEqual({ email: 'me@example.com', name: 'Kim Hyunbin' });
    expect(got.map((i) => i.email)).toContain('other@example.com');
  });

  test('커밋이 없으면 빈 목록 — 화면은 손으로 넣는 길을 남긴다', async () => {
    db.prepare('DELETE FROM git_commit').run();
    expect(await suggestIdentitiesFor(1)).toEqual([]);
  });
});
