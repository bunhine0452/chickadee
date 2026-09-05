/**
 * sqlite 러너의 약속 (D175 를 SQL 로 · 정본 §5).
 *
 * `sql_run` 을 **진짜 sqlite 로** 대신한다 — `better-sqlite3` 는 이미 이 리포의 개발
 * 의존이고(`migrate-seed.test.ts`), 가짜 표를 돌려주는 대역으로는 채점의 핵심인
 * 「행이 실제로 몇 개 나오나」를 한 줄도 못 잰다. Rust 쪽 계약(없는 값 · 상한 · 중단)은
 * `crates/store/src/run.rs` 의 단위 시험이 따로 증명한다.
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

interface AskSpec { setup: string[]; asks: string[]; timeoutMs: number; maxRows: number }

/** 호출 수와 걸린 시간 — 왕복 시간 실측이 여기서 나온다. */
const calls: { spec: AskSpec; ms: number }[] = [];

/** Rust `chickadee_store::run::ask` 와 같은 계약. 값은 글자로, 없는 값은 `null`. */
function ask(spec: AskSpec): unknown {
  const t0 = performance.now();
  const db = new Database(':memory:');
  const out = {
    tables: [] as { columns: string[]; rows: (string | null)[][]; truncated: boolean }[],
    failedAt: null as number | null,
    message: null as string | null,
    timedOut: false,
    durationMs: 0,
  };
  try {
    for (const [i, sql] of spec.setup.entries()) {
      try {
        db.exec(sql);
      } catch (e) {
        out.failedAt = -(i + 1);
        out.message = (e as Error).message;
        break;
      }
    }
    if (out.failedAt === null) {
      for (const [i, sql] of spec.asks.entries()) {
        try {
          const stmt = db.prepare(sql);
          // 표를 안 내는 문장(고치기·지우기)도 돌아야 한다 — Rust 쪽 `raw_query` 가
          // 그렇게 돈다. `better-sqlite3` 는 `all()` 을 거절하므로 여기서 갈라 준다.
          if (!stmt.reader) {
            stmt.run();
            out.tables.push({ columns: [], rows: [], truncated: false });
            continue;
          }
          const columns = stmt.columns().map((c) => c.name);
          const raw = stmt.raw().all() as unknown[][];
          const rows = raw
            .slice(0, spec.maxRows)
            .map((r) => r.map((c) => (c === null ? null : String(c))));
          out.tables.push({ columns, rows, truncated: raw.length > spec.maxRows });
        } catch (e) {
          out.failedAt = i;
          out.message = (e as Error).message;
          break;
        }
      }
    }
  } finally {
    db.close();
  }
  const ms = performance.now() - t0;
  out.durationMs = Math.round(ms);
  calls.push({ spec, ms });
  return out;
}

vi.mock('@chickadee/ipc-client', () => ({
  ipc: { sql: { run: (spec: AskSpec) => Promise.resolve(ask(spec)) } },
  IpcError: class extends Error {},
}));

const { diffTables, runSql, detectSql, SQL_TIMEOUT_MS } = await import('./sql-runner.js');
const { runTests } = await import('./runner.js');
type Spec = Parameters<typeof runSql>[0];

const DB = [
  'CREATE TABLE cart (id INTEGER PRIMARY KEY, status TEXT NOT NULL, closed_at INTEGER)',
  "INSERT INTO cart VALUES (1,'open',NULL),(2,'open',NULL),(3,'closed',1700000000),(4,'closed',1700000100)",
];

const spec = (over: Partial<Spec>): Spec => ({
  repoId: 1 as Spec['repoId'],
  lang: 'sql',
  dialect: 'sqlite',
  files: [],
  tests: [],
  timeoutMs: SQL_TIMEOUT_MS,
  db: DB,
  cases: [],
  ...over,
});

describe('대칭 차집합 (EXCEPT 양방향과 같은 판정)', () => {
  it('행 순서가 달라도 order:none 이면 같은 표다', () => {
    const d = diffTables([['1'], ['2']], [['2'], ['1']], 'none');
    expect(d.onlyExpected).toEqual([]);
    expect(d.onlyActual).toEqual([]);
  });

  it('중복 행 수를 본다 — EXCEPT 하나로는 못 보는 자리다', () => {
    const d = diffTables([['1'], ['1']], [['1']], 'none');
    expect(d.onlyExpected).toEqual([['1']]);
    expect(d.onlyActual).toEqual([]);
  });

  it('없는 값과 빈 글자를 안 섞는다', () => {
    const d = diffTables([[null]], [['']], 'none');
    expect(d.onlyExpected).toEqual([[null]]);
    expect(d.onlyActual).toEqual([['']]);
  });

  it('칸 경계가 안 무너진다', () => {
    const d = diffTables([['a', 'sb']], [['as', 'b']], 'none');
    expect(d.onlyExpected).toHaveLength(1);
    expect(d.onlyActual).toHaveLength(1);
  });

  it('order:given 이면 순서까지 본다', () => {
    const d = diffTables([['1'], ['2']], [['2'], ['1']], 'given');
    expect(d.onlyExpected).toHaveLength(2);
  });

  it('열 수가 다르면 행을 안 견준다', () => {
    const d = diffTables([['1']], [['1', 'x']], 'none', { expected: 1, actual: 2 });
    expect(d.widthMismatch).toEqual({ expected: 1, actual: 2 });
  });
});

describe('sqlite 러너', () => {
  it('탐지는 언제나 켜진다 — 엔진이 앱에 실려 있다', async () => {
    await expect(detectSql()).resolves.toEqual({ ok: true, dialect: 'sqlite' });
  });

  it('참조 문장과 같은 표를 내면 통과다', async () => {
    const out = await runSql(spec({
      cases: [{
        name: '열린 장바구니',
        query: "SELECT id FROM cart WHERE closed_at IS NULL",
        expect: { sql: "SELECT id FROM cart WHERE status = 'open'" },
      }],
    }));
    expect(out.status).toBe('passed');
    expect(out.passed).toBe(1);
  });

  it('견주기 기호로 물으면 0행이 되어 떨어진다 — 0-4 가 가르치는 그 자리다', async () => {
    const out = await runSql(spec({
      cases: [{
        name: '열린 장바구니',
        query: 'SELECT id FROM cart WHERE closed_at = NULL',
        expect: { rows: [['1'], ['2']] },
      }],
    }));
    expect(out.status).toBe('failed');
    expect(out.failures[0]?.message).toContain('빠진 행 2개');
  });

  it('손으로 적은 기대 표로도 채점된다', async () => {
    const out = await runSql(spec({
      cases: [{
        name: '닫힌 장바구니',
        query: "SELECT id FROM cart WHERE status = 'closed'",
        expect: { rows: [['3'], ['4']] },
      }],
    }));
    expect(out.status).toBe('passed');
  });

  it('줄 세우기가 없으면 순서를 안 따진다', async () => {
    const out = await runSql(spec({
      cases: [{
        name: '순서 없음',
        query: 'SELECT id FROM cart ORDER BY id DESC',
        expect: { rows: [['1'], ['2'], ['3'], ['4']] },
      }],
    }));
    expect(out.status).toBe('passed');
  });

  it("order:'given' 이면 같은 행이라도 순서가 다르면 떨어진다", async () => {
    const out = await runSql(spec({
      cases: [{
        name: '순서 있음',
        query: 'SELECT id FROM cart ORDER BY id DESC',
        expect: { rows: [['1'], ['2'], ['3'], ['4']] },
        order: 'given',
      }],
    }));
    expect(out.status).toBe('failed');
  });

  it('없는 열을 물으면 그 문항만 떨어지고 이유가 남는다', async () => {
    const out = await runSql(spec({
      cases: [
        { name: '오타', query: 'SELECT statuss FROM cart', expect: { rows: [] } },
        { name: '멀쩡', query: 'SELECT id FROM cart', expect: { rows: [['1'], ['2'], ['3'], ['4']] } },
      ],
    }));
    expect(out.status).toBe('failed');
    expect(out.passed).toBe(1);
    expect(out.failures[0]?.message).toContain('statuss');
  });

  it('문항 하나가 표를 고쳐도 다음 문항이 물려받지 않는다', async () => {
    const out = await runSql(spec({
      cases: [
        { name: '비우기', query: 'DELETE FROM cart', expect: { rows: [] } },
        { name: '그대로', query: 'SELECT id FROM cart', expect: { rows: [['1'], ['2'], ['3'], ['4']] } },
      ],
    }));
    expect(out.passed).toBe(2);
  });

  it('방언이 안 맞으면 화면이 말할 사유가 실린다 (D186 ④)', async () => {
    const out = await runSql(spec({ dialect: 'mysql' as never, cases: [{ name: 'x', query: 'SELECT 1', expect: { rows: [] } }] }));
    expect(out.status).toBe('no-runner');
    expect(out.reason).toBe('dialect-unsupported');
  });

  it('세울 데이터베이스가 없으면 그 사실을 말한다', async () => {
    const out = await runSql(spec({ db: [], cases: [{ name: 'x', query: 'SELECT 1', expect: { rows: [] } }] }));
    expect(out.status).toBe('no-runner');
    expect(out.reason).toBe('no-fixture-db');
  });

  it('픽스처가 깨지면 학습자 답을 오답으로 안 센다', async () => {
    const out = await runSql(spec({
      db: ['CREATE TABEL cart (id INTEGER)'],
      cases: [{ name: 'x', query: 'SELECT 1', expect: { rows: [['1']] } }],
    }));
    expect(out.status).toBe('no-runner');
    expect(out.failed).toBe(0);
  });

  it("runTests 가 lang:'sql' 을 이 어댑터로 보낸다 — 탐지 없이 바로 돈다", async () => {
    const out = await runTests(spec({
      cases: [{ name: '전부', query: 'SELECT id FROM cart', expect: { rows: [['1'], ['2'], ['3'], ['4']] } }],
    }));
    expect(out.status).toBe('passed');
  });

  it('왕복 시간을 잰다 — 자바 러너의 초 단위와 견주려고 남긴다', async () => {
    calls.length = 0;
    const out = await runSql(spec({
      cases: [{ name: '전부', query: 'SELECT id, status FROM cart', expect: { sql: 'SELECT id, status FROM cart' } }],
    }));
    expect(out.status).toBe('passed');
    expect(calls).toHaveLength(1);
    // 세우기 2문 + 묻기 2문이 한 번에 도는 데 걸린 시간. 상한은 넉넉히 둔다 — 재는 것이
    // 목적이고 CI 기계가 느려도 이 시험이 빨간불이 되면 안 된다.
    expect(calls[0]?.ms ?? 0).toBeLessThan(500);
  });
});

/**
 * 픽스처 DB 를 러너가 받는 문장 목록으로 편다 — 스키마 그대로, 행 그대로.
 *
 * 러너의 `db` 는 문장 배열이라 파일을 안 받는다(메모리에만 서는 이유가 그것이다).
 * 그래서 시드해 둔 `fixtures/db/v0009.db` 를 여기서 문장으로 편다 —
 * 그 시드가 실제로 **표를 낸다**는 것을 이 시험이 확인한다
 * (`scripts/seed-fixture-db.mjs` 가 만든 것).
 */
function fixtureStatements(tables: string[]): string[] {
  const db = new Database(join(process.cwd(), 'fixtures/db/v0009.db')) as SqliteDb;
  const out: string[] = [];
  try {
    for (const name of tables) {
      const ddl = db
        .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?")
        .get(name) as { sql: string } | undefined;
      if (!ddl) throw new Error(`fixtures/db/v0009.db 에 ${name} 이 없다`);
      // 외래키는 이 시험의 관심이 아니고, 표를 골라 뽑으면 부모가 빠질 수 있다.
      out.push(ddl.sql.replace(/REFERENCES\s+\w+\s*(\([^)]*\))?/g, ''));
      const rows = db.prepare(`SELECT * FROM "${name}"`).all() as Record<string, unknown>[];
      for (const row of rows) {
        const cols = Object.keys(row).map((c) => `"${c}"`).join(', ');
        const vals = Object.values(row)
          .map((v) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`))
          .join(', ');
        out.push(`INSERT INTO "${name}" (${cols}) VALUES (${vals})`);
      }
    }
  } finally {
    db.close();
  }
  return out;
}

describe('시드해 둔 픽스처 DB 가 실제 표를 낸다', () => {
  const db = fixtureStatements(['file', 'git_commit', 'concept_site']);

  it('행이 있다 — 표만 있던 상태로는 아무것도 못 잰다', () => {
    expect(db.filter((s) => s.startsWith('INSERT'))).not.toHaveLength(0);
  });

  it('0-1 — 줄 세우기 없는 「몇 줄만」은 세 줄을 낸다', async () => {
    const out = await runSql(spec({
      db,
      cases: [{
        name: '0-1 행 집합',
        query: 'SELECT path FROM file LIMIT 3',
        expect: { sql: 'SELECT path FROM file LIMIT 3' },
      }],
    }));
    expect(out.status).toBe('passed');
  });

  it('0-4 — 견주기로 물으면 0행, 묻는 낱말로 물으면 두 줄이다', async () => {
    const out = await runSql(spec({
      db,
      cases: [
        {
          name: '0-4 모름',
          query: 'SELECT sha FROM git_commit WHERE author_email = NULL',
          expect: { sql: 'SELECT sha FROM git_commit WHERE author_email IS NULL' },
        },
      ],
    }));
    expect(out.status).toBe('failed');
    expect(out.failures[0]?.message).toContain('빠진 행 2개');
  });

  it('0-7 — 묶어 센 값이 파일마다 다르다', async () => {
    const out = await runSql(spec({
      db,
      cases: [{
        name: '0-7 행마다 한 번',
        query: 'SELECT file_id, COUNT(*) AS n FROM concept_site GROUP BY file_id',
        expect: { sql: 'SELECT file_id, COUNT(*) FROM concept_site GROUP BY file_id' },
      }],
    }));
    expect(out.status).toBe('passed');
    expect(out.passed).toBe(1);
  });
});
