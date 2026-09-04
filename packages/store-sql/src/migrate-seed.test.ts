/**
 * 시드 DB 이행 테스트 (06 §6.1).
 *
 * 과거 버전 DB(`fixtures/db/v0001.db` …)를 최신까지 올려 `PRAGMA integrity_check` 와
 * **행 수 보존**을 확인한다. 06 §6.1 의 「새 마이그레이션 PR 은 시드 DB를 추가한다」를
 * 사람의 기억이 아니라 이 파일이 강제한다 — 마이그레이션 하나마다 시드 하나를 요구한다.
 *
 * **시드는 커밋된 바이너리다(생성 스크립트가 아니다).** 시드의 뜻은 「그때의 앱이 실제로 쓴
 * 바이트」이고, 오늘의 `0001_init.sql` 로 다시 만들어 내면 그 DDL 이 바뀌어도 시드가 같이
 * 바뀌어 **어긋남을 영원히 못 본다**. 파일 하나 66 KB 는 그 대가로 싸다. 새 시드는 그 판의
 * 앱(또는 그 판의 마이그레이션까지만 적용한 DB)으로 만들어 넣는다.
 *
 * 러너는 Rust `crates/store/src/migrate.rs` 다. 여기서는 그 절차(파일 하나 = 한 트랜잭션,
 * 성공하면 `user_version` 을 직접 세움)를 같은 순서로 재현한다 — 마이그레이션 SQL 자체를
 * 검증하는 것이 목적이고, Rust 러너의 백업·거부 동작은 `crates/store/tests/store.rs` 가 본다.
 */
import { copyFileSync, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { migrations, statements } from './catalog.js';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

const SEED_DIR = join(process.cwd(), 'fixtures/db');
const SEED_NAME = (version: number): string => `v${String(version).padStart(4, '0')}.db`;
const SCHEMA_VERSION = migrations[migrations.length - 1]?.version ?? 0;

/** 이행할 것 하나 = 트랜잭션 하나. 실패하면 통째로 롤백된다 (06 §6.1). */
function stepUp(db: SqliteDb, m: { version: number; sql: string }): void {
  db.transaction(() => {
    db.exec(m.sql);
    // 파일 안에 같은 pragma 가 있어도 러너가 정본을 찍는다 — Rust 쪽과 같은 순서다.
    db.pragma(`user_version = ${m.version}`);
  })();
}

/**
 * `PRAGMA user_version` 보다 큰 순번만, 오름차순으로.
 *
 * **외래키는 루프 밖에서 끈다** — Rust 러너(`crates/store/src/migrate.rs`)가 하는 그대로다
 * (D146). 표를 다시 만드는 이행에서 켜 둔 채로 두면 `DROP TABLE` 이 `ON DELETE CASCADE` 를
 * 먼저 돌려 자식 행이 조용히 사라진다. `PRAGMA foreign_keys` 는 트랜잭션 안에서 무시되므로
 * 이행 파일이 스스로 끌 수 없고, 여기가 러너와 같은 자리다. 끝나고 `foreign_key_check` 로
 * 확인하는 것까지 같아야 이 하네스가 러너의 대역 노릇을 한다.
 */
function runPending(db: SqliteDb): number[] {
  const from = Number((db.pragma('user_version', { simple: true }) as number | bigint) ?? 0);
  const pending = [...migrations].sort((a, b) => a.version - b.version)
    .filter((m) => m.version > from);
  if (pending.length === 0) return [];
  db.pragma('foreign_keys = OFF');
  let broken: unknown[] = [];
  try {
    for (const m of pending) stepUp(db, m);
    broken = db.pragma('foreign_key_check') as unknown[];
  } finally {
    // 되살리는 것만 `finally` 에 둔다 — 여기서 던지면 원래 오류가 가려진다.
    db.pragma('foreign_keys = ON');
  }
  if (broken.length > 0) throw new Error(`foreign_key_check: ${broken.length}`);
  return pending.map((m) => m.version);
}

/** 테이블마다 행 수. 표 이름은 카탈로그의 `store.table_names` 가 준다. */
function rowCounts(db: SqliteDb): Record<string, number> {
  const names = db.prepare(statements['store.table_names']).all() as { name: string }[];
  const out: Record<string, number> = {};
  for (const { name } of names) {
    // 표 이름은 sqlite_master 에서 왔고 카탈로그 밖 SQL 을 만들지 않는다 — 테스트 안이다.
    out[name] = (db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get() as { n: number }).n;
  }
  return out;
}

/** 시드를 임시 폴더로 복사해 연다 — 픽스처 파일은 절대 건드리지 않는다. */
function openCopy(seed: string): { db: SqliteDb; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'chickadee-seed-'));
  const at = join(dir, 'chickadee.db');
  copyFileSync(join(SEED_DIR, seed), at);
  return { db: new Database(at), dir };
}

describe('시드 DB 이행 (06 §6.1)', () => {
  test('마이그레이션마다 시드 DB 가 하나씩 있다', () => {
    const missing = migrations
      .map((m) => SEED_NAME(m.version))
      .filter((name) => !existsSync(join(SEED_DIR, name)));
    // 06 §6.1: 새 마이그레이션 PR 은 시드 DB 를 추가한다. 빠뜨리면 여기서 걸린다.
    expect(missing).toEqual([]);
  });

  test('fixtures/db 에는 마이그레이션에 없는 시드가 없다', () => {
    const known = new Set(migrations.map((m) => SEED_NAME(m.version)));
    const stray = readdirSync(SEED_DIR).filter((n) => n.endsWith('.db') && !known.has(n));
    expect(stray).toEqual([]);
  });

  for (const m of migrations) {
    const seed = SEED_NAME(m.version);

    test(`${seed} 를 최신까지 올리면 integrity_check 가 ok 다`, () => {
      const { db, dir } = openCopy(seed);
      try {
        expect(db.pragma('user_version', { simple: true })).toBe(m.version);
        runPending(db);
        expect(db.pragma('user_version', { simple: true })).toBe(SCHEMA_VERSION);
        expect(db.pragma('integrity_check', { simple: true })).toBe('ok');
        expect(db.pragma('foreign_key_check')).toEqual([]);
      } finally {
        db.close();
        rmSync(dir, { recursive: true, force: true });
      }
    });

    test(`${seed} 의 행 수가 이행 뒤에도 그대로다`, () => {
      const { db, dir } = openCopy(seed);
      try {
        const before = rowCounts(db);
        // 0행짜리 DB 는 「보존」을 증명하지 못한다 — 시드에 실제 학습 기록이 있어야 한다.
        expect(before['review_log']).toBeGreaterThan(0);
        expect(before['mastery']).toBeGreaterThan(0);
        expect(before['concept_site']).toBeGreaterThan(0);

        runPending(db);

        const after = rowCounts(db);
        for (const [table, n] of Object.entries(before)) {
          expect(`${table}=${after[table] ?? -1}`).toBe(`${table}=${n}`);
        }
      } finally {
        db.close();
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }

  /**
   * 프레임 자체의 자가 검사. 지금은 마이그레이션이 `0001_init.sql` 하나라 위 두 테스트에서
   * 「올린다」가 0회다 — 그 상태로 두면 두 번째 마이그레이션이 왔을 때 **처음 도는 코드**가 된다.
   * 여기서 가짜 2번을 한 번 태워 러너 절차가 실제로 도는 것을 지금 확인해 둔다.
   * (이 SQL 은 `migrations` 에 들어가지 않는다 — 이 테스트 안에서만 산다.)
   */
  test('두 번째 마이그레이션이 오면 그대로 돈다 — 열 추가는 행을 지우지 않는다', () => {
    const { db, dir } = openCopy(SEED_NAME(SCHEMA_VERSION));
    try {
      const before = rowCounts(db);
      stepUp(db, {
        version: SCHEMA_VERSION + 1,
        sql: `
          ALTER TABLE mastery ADD COLUMN note TEXT;
          CREATE TABLE probe (id INTEGER PRIMARY KEY, at INTEGER NOT NULL);
        `,
      });

      expect(db.pragma('user_version', { simple: true })).toBe(SCHEMA_VERSION + 1);
      expect(db.pragma('integrity_check', { simple: true })).toBe('ok');
      const after = rowCounts(db);
      for (const [table, n] of Object.entries(before)) expect(after[table]).toBe(n);
      expect(after['probe']).toBe(0);
    } finally {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('DB 가 최신보다 높으면 러너가 거부한다 — 이행할 것을 세는 자리가 같다 (db-newer)', () => {
    // `crates/store/src/migrate.rs` 의 `from > top` 이 그 판단이고, 백업·거부의 실물은
    // `crates/store/tests/store.rs` 가 가짜 카탈로그로 본다. 여기서는 **이 카탈로그가**
    // 그 판단에 넘기는 값 — 최상단 번호와 미적용 목록 — 을 고정한다.
    const { db, dir } = openCopy(SEED_NAME(SCHEMA_VERSION));
    try {
      db.pragma(`user_version = ${SCHEMA_VERSION + 1}`);
      const from = Number(db.pragma('user_version', { simple: true }));
      const top = Math.max(...migrations.map((m) => m.version));
      expect(top).toBe(SCHEMA_VERSION);
      expect(from > top).toBe(true);
      // 거부 경로에 들어가므로 이행은 한 건도 돌지 않는다.
      expect(migrations.filter((m) => m.version > from)).toEqual([]);
    } finally {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('한 판 낮은 DB 는 이행할 것이 남아 있다 — 러너가 백업을 뜨는 조건이다', () => {
    // `migrate.rs` 는 `pending` 이 비지 않고 파일이 이미 있을 때만 백업한다 (01 §7).
    // 마이그레이션이 늘어도 뜻이 안 바뀌도록 「마지막 바로 아래」를 연다 — 번호를 박으면
    // 판이 오를 때마다 이 줄이 틀린다.
    const { db, dir } = openCopy(SEED_NAME(SCHEMA_VERSION - 1));
    try {
      const from = Number(db.pragma('user_version', { simple: true }));
      expect(migrations.filter((m) => m.version > from).map((m) => m.version))
        .toEqual([SCHEMA_VERSION]);
    } finally {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('실패한 마이그레이션은 통째로 롤백된다 — 반쯤 올라간 DB 로 열지 않는다', () => {
    const { db, dir } = openCopy(SEED_NAME(SCHEMA_VERSION));
    try {
      expect(() => stepUp(db, {
        version: SCHEMA_VERSION + 1,
        sql: `
          CREATE TABLE half (id INTEGER PRIMARY KEY);
          THIS IS NOT SQL;
        `,
      })).toThrow();

      expect(db.pragma('user_version', { simple: true })).toBe(SCHEMA_VERSION);
      const names = (db.prepare(statements['store.table_names']).all() as { name: string }[])
        .map((r) => r.name);
      expect(names).not.toContain('half');
    } finally {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

/** 0002 그 자체 (D118). 원장은 추가만 — 열을 하나 더하고 아무 행도 건드리지 않는다. */
describe('0002 — concept.name_en', () => {
  const columns = (db: SqliteDb): string[] =>
    (db.prepare('PRAGMA table_info(concept)').all() as { name: string }[]).map((c) => c.name);

  test('v0001 을 올리면 name_en 이 생기고 name_ko 는 그대로 남는다', () => {
    const { db, dir } = openCopy(SEED_NAME(1));
    try {
      expect(columns(db)).not.toContain('name_en');
      const before = db.prepare('SELECT id, name_ko FROM concept ORDER BY id').all();

      runPending(db);

      expect(columns(db)).toContain('name_en');
      expect(db.prepare('SELECT id, name_ko FROM concept ORDER BY id').all()).toEqual(before);
      // 이행은 값을 지어내지 않는다 — 다음 인제스트가 사전에서 채운다.
      const filled = db.prepare('SELECT COUNT(*) AS n FROM concept WHERE name_en IS NOT NULL')
        .get() as { n: number };
      expect(filled.n).toBe(0);
    } finally {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('열을 더하고 나면 사전 이름의 양쪽을 다 쓸 수 있다', () => {
    const { db, dir } = openCopy(SEED_NAME(SCHEMA_VERSION));
    try {
      const id = (db.prepare('SELECT id FROM concept LIMIT 1').get() as { id: string }).id;
      db.prepare('UPDATE concept SET name_en = ? WHERE id = ?').run('Optional chaining', id);
      const row = db.prepare('SELECT name_ko, name_en FROM concept WHERE id = ?').get(id) as
        { name_ko: string; name_en: string | null };
      expect(row.name_en).toBe('Optional chaining');
      expect(row.name_ko.length).toBeGreaterThan(0);
    } finally {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
